import type { FastifyInstance } from 'fastify';
import * as argon2 from 'argon2';
import prisma from '../lib/prisma';
import type { JwtPayload } from '../plugins/jwt';
import { issueTokens } from '../lib/tokens';
import { LIMITS } from '../lib/rateLimitConfig';
import { makeSlowDown, ipKey } from '../plugins/slowDown';

// Dummy hash used to prevent timing attacks when user doesn't exist
let _dummyHash: string | null = null;
async function dummyHash(): Promise<string> {
  if (!_dummyHash) _dummyHash = await argon2.hash('__dummy__');
  return _dummyHash;
}

function validateEmailPassword(email: unknown, password: unknown): string | null {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return 'email and password are required';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'invalid email format';
  }
  if (password.length < 8) {
    return 'password must be at least 8 characters';
  }
  return null;
}

// Route-level slow-down handlers — created once, reused per request.
const registerSlowDown = makeSlowDown(LIMITS.authRegister.slowDown!, ipKey)
const loginSlowDown = makeSlowDown(LIMITS.authLogin.slowDown!, ipKey)

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post(
    '/register',
    {
      config: { rateLimit: LIMITS.authRegister },
      preHandler: [registerSlowDown],
    },
    async (req, reply) => {
      const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };

      const validationError = validateEmailPassword(email, password);
      if (validationError) return reply.status(400).send({ error: validationError });

      const emailNorm = (email as string).trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
      if (existing) return reply.status(409).send({ error: 'email already registered' });

      const passwordHash = await argon2.hash(password as string);
      const user = await prisma.user.create({ data: { email: emailNorm, passwordHash } });

      const tokens = await issueTokens(app, user.id);
      return reply.status(201).send({ ...tokens, userId: user.id });
    },
  );

  // POST /auth/login
  app.post(
    '/login',
    {
      config: { rateLimit: LIMITS.authLogin },
      preHandler: [loginSlowDown],
    },
    async (req, reply) => {
      const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };

      const validationError = validateEmailPassword(email, password);
      if (validationError) return reply.status(400).send({ error: validationError });

      const emailNorm = (email as string).trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email: emailNorm } });

      // Always run argon2.verify to prevent timing-based user enumeration
      const hash = user?.passwordHash ?? (await dummyHash());
      const valid = await argon2.verify(hash, password as string);

      if (!user || !valid) return reply.status(401).send({ error: 'invalid credentials' });

      const tokens = await issueTokens(app, user.id);
      return { ...tokens, userId: user.id };
    },
  );

  // POST /auth/refresh — rotate refresh token
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: unknown };
    if (typeof refreshToken !== 'string') {
      return reply.status(400).send({ error: 'refreshToken is required' });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      return reply.status(401).send({ error: 'invalid or expired refresh token' });
    }

    // Rotate: delete old, issue new pair
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await issueTokens(app, stored.userId);
    return tokens;
  });

  // GET /auth/me
  app.get('/me', { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as JwtPayload;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });
    return user;
  });
}
