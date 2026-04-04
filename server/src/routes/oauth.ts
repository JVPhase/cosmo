/**
 * POST /auth/oauth
 *
 * Mobile-first "token exchange" flow:
 *   1. Client obtains an ID token from Google / Apple (via expo-auth-session,
 *      @react-native-google-signin/google-signin, or expo-apple-authentication).
 *   2. Client POSTs { provider, idToken } here.
 *   3. Server verifies the token, finds-or-creates the user, and returns
 *      our own JWT pair — same shape as /auth/login.
 *
 * Verification backends
 *   Google — calls Google's tokeninfo endpoint (simple, no extra library).
 *            Set GOOGLE_CLIENT_IDS to validate `aud`; omit in development.
 *            For high-traffic production use google-auth-library instead.
 *   Apple  — verifies RS256 JWT against Apple's JWKS via `jose`.
 *            APPLE_BUNDLE_ID (= audience) is required.
 */
import type { FastifyInstance } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import prisma from '../lib/prisma';
import { issueTokens } from '../lib/tokens';

// ─── Google ──────────────────────────────────────────────────────────────────

type GoogleTokenInfo = {
  sub: string;
  email: string;
  email_verified: string;
  aud: string;
  error_description?: string;
};

async function verifyGoogleIdToken(idToken: string): Promise<{ sub: string; email: string }> {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url);
  const data = (await res.json()) as GoogleTokenInfo;

  if (!res.ok || !data.sub || !data.email) {
    throw new Error(data.error_description ?? 'Invalid Google token');
  }

  // Validate audience when configured (comma-separated for iOS + Android client IDs)
  const allowedAuds = process.env.GOOGLE_CLIENT_IDS?.split(',').map((s) => s.trim());
  if (allowedAuds?.length && !allowedAuds.includes(data.aud)) {
    throw new Error('Google token audience mismatch');
  }

  return { sub: data.sub, email: data.email };
}

// ─── Apple ───────────────────────────────────────────────────────────────────

const APPLE_ISSUER = 'https://appleid.apple.com';
// jose caches the JWKS fetch automatically
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

async function verifyAppleIdToken(idToken: string): Promise<{ sub: string; email?: string }> {
  const bundleId = process.env.APPLE_BUNDLE_ID;
  if (!bundleId) throw new Error('APPLE_BUNDLE_ID env var is not set');

  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: APPLE_ISSUER,
    audience: bundleId,
  });

  if (typeof payload.sub !== 'string') throw new Error('Apple token missing sub');

  return {
    sub: payload.sub,
    // Apple only includes email on first sign-in; subsequent tokens omit it
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}

// ─── Route ───────────────────────────────────────────────────────────────────

type OAuthProvider = 'google' | 'apple';

export async function oauthRoutes(app: FastifyInstance) {
  app.post<{ Body: { provider?: unknown; idToken?: unknown } }>(
    '/oauth',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { provider, idToken } = req.body ?? {};

      if (provider !== 'google' && provider !== 'apple') {
        return reply.status(400).send({ error: 'provider must be "google" or "apple"' });
      }
      if (typeof idToken !== 'string' || !idToken) {
        return reply.status(400).send({ error: 'idToken is required' });
      }

      // ── 1. Verify ID token with the provider ──────────────────────────────
      let providerUserId: string;
      let email: string | undefined;

      try {
        if (provider === 'google') {
          ({ sub: providerUserId, email } = await verifyGoogleIdToken(idToken));
        } else {
          ({ sub: providerUserId, email } = await verifyAppleIdToken(idToken));
        }
      } catch (err) {
        app.log.warn({ provider, err }, 'OAuth token verification failed');
        return reply.status(401).send({ error: 'invalid identity token' });
      }

      // ── 2. Find or create user + link OAuth account ───────────────────────
      const linkedAccount = await prisma.oAuthAccount.findUnique({
        where: { provider_providerUserId: { provider, providerUserId } },
      });

      let userId: string;
      let isNewUser = false;

      if (linkedAccount) {
        userId = linkedAccount.userId;
      } else {
        // Transaction: reuse existing account by email, or create a new one
        const user = await prisma.$transaction(async (tx) => {
          let u = email ? await tx.user.findUnique({ where: { email } }) : null;

          if (!u) {
            // Apple may not provide email after first sign-in — use a stable placeholder
            const fallbackEmail = `${provider}:${providerUserId}@oauth.internal`;
            u = await tx.user.create({ data: { email: email ?? fallbackEmail } });
            isNewUser = true;
          }

          await tx.oAuthAccount.create({ data: { userId: u.id, provider, providerUserId } });
          return u;
        });
        userId = user.id;
      }

      // ── 3. Issue our JWT pair (same shape as /auth/login) ─────────────────
      const tokens = await issueTokens(app, userId);
      return reply.status(isNewUser ? 201 : 200).send({ ...tokens, userId });
    },
  );
}
