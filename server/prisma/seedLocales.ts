import { PrismaClient } from '@prisma/client';
import { seedLocaleBundles } from './localeBundles';

const prisma = new PrismaClient();

async function main() {
  await seedLocaleBundles(prisma);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
