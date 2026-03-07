import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const existing = await prisma.user.findUnique({ where: { email: 'demo@acme.com' } });
  if (existing) {
    console.log('Demo user already exists — skipping seed.');
    return;
  }

  await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      domain: 'acme.com',
      settings: { create: {} },
      users: {
        create: {
          email: 'demo@acme.com',
          passwordHash,
          name: 'Demo User',
          role: 'ADMIN',
        },
      },
    },
  });

  console.log('Demo user created:');
  console.log('  Email:    demo@acme.com');
  console.log('  Password: demo1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
