/**
 * JWT helpers for contract tests.
 * Signs a token using the app's JWT plugin (same secret as routes use).
 */
import type { FastifyInstance } from 'fastify';

export function signToken(app: FastifyInstance, userId: string): string {
  return app.jwt.sign({ userId });
}
