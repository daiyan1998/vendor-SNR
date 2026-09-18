import { PrismaService } from '../../src/prisma/prisma.service.js';

export async function createTestPrisma(): Promise<PrismaService> {
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  return prisma;
}

export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.phoneNumber.deleteMany();
  await prisma.user.deleteMany();
}
