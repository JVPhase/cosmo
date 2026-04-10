/**
 * Sets up the test database by running Prisma migrations.
 * Reads DATABASE_URL from .env.test (cross-platform).
 *
 * Usage: tsx scripts/test-db-setup.ts
 *        (also run as: npm run db:test:setup)
 */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(__dirname, '..', '.env.test');
const envContent = readFileSync(envPath, 'utf-8');

// Parse DATABASE_URL from .env.test
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error('DATABASE_URL not found in .env.test');
  process.exit(1);
}
const dbUrl = match[1].trim();

console.log(`Running Prisma migrate deploy on test DB...`);
execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: dbUrl },
  cwd: join(__dirname, '..'),
});
console.log('Test DB setup complete.');
