import { randomBytes } from 'crypto';
import type { FastifyInstance } from 'fastify';
import prisma from './prisma';
import type { JwtPayload } from '../plugins/jwt';

const ACCESS_TTL = '1h';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function issueTokens(app: FastifyInstance, userId: string) {
  const accessToken: string = app.jwt.sign({ userId } satisfies JwtPayload, { expiresIn: ACCESS_TTL });

  const token = randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });

  return { accessToken, refreshToken: token };
}
