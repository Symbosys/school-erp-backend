import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const host = process.env.DATABASE_HOST || 'localhost';
const user = process.env.DATABASE_USER;
const dbName = process.env.DATABASE_NAME;
const port = Number(process.env.DATABASE_PORT) || 3306;

console.table({
  host,
  user,
  database: dbName,
  port,
  hasPassword: !!process.env.DATABASE_PASSWORD
});

const adapter = new PrismaMariaDb({
  host: host === 'localhost' ? '127.0.0.1' : host,
  user: user,
  password: process.env.DATABASE_PASSWORD,
  database: dbName,
  port: port,
  connectionLimit: 20
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


