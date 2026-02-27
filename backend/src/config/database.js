import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log('Disconnected from database');
};
