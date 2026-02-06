"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_1 = require("../generated/prisma/client");
const globalForPrisma = globalThis;
// parse database url to get connection details
const dbUrl = new URL(process.env.DATABASE_URL);
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port) || 3306,
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.substring(1),
    connectionLimit: 10,
});
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter,
        log: ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=prisma.js.map