"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_1 = require("../generated/prisma/client");
const globalForPrisma = global;
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
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: host === 'localhost' ? '127.0.0.1' : host,
    user: user,
    password: process.env.DATABASE_PASSWORD,
    database: dbName,
    port: port,
    connectionLimit: 20
});
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        adapter,
        log: ['error', 'warn'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=prisma.js.map