import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pollify.local' },
    update: {
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true
    },
    create: {
      email: 'admin@pollify.local',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('user123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'user@pollify.local' },
    update: {
      password: userPassword,
      role: UserRole.USER,
      isActive: true
    },
    create: {
      email: 'user@pollify.local',
      name: 'Demo User',
      password: userPassword,
      role: UserRole.USER,
      isActive: true
    },
  });

  console.log('Created users:', { admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
