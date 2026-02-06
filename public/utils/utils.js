"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateRange = exports.parseCookies = exports.zodError = void 0;
exports.parseToDecimal = parseToDecimal;
exports.generateOrderNumber = generateOrderNumber;
exports.extractPartnerId = extractPartnerId;
exports.removeUndefined = removeUndefined;
const node_crypto_1 = require("node:crypto");
const zodError = (error) => {
    let errors = {};
    error.issues.map((issue) => {
        const path = issue.path?.[0];
        if (path)
            errors[path] = issue.message;
    });
    return errors;
};
exports.zodError = zodError;
// Function to parse cookies from Cookie header
const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (!cookieHeader)
        return cookies;
    cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.split("=").map((part) => part.trim());
        if (key && value)
            cookies[key] = value;
    });
    return cookies;
};
exports.parseCookies = parseCookies;
function parseToDecimal(price) {
    if (!price)
        return 0;
    if (typeof price === 'number')
        return price;
    const high = price.d?.[0] ?? 0;
    const low = price.d?.[1] ?? 0;
    return (high + low / 1e7) * (price.s ?? 1);
}
const getDateRange = (date) => {
    if (!date)
        return undefined;
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};
exports.getDateRange = getDateRange;
function generateOrderNumber() {
    const dateStr = new Date().toISOString().split("T")[0]?.replace(/-/g, "") ?? "00000000";
    const uniquePart = (0, node_crypto_1.randomUUID)().slice(0, 6).toUpperCase();
    return `ORD-${dateStr}-${uniquePart}`;
}
function extractPartnerId(memberName) {
    const match = memberName.match(/^partner:(\d+)$/);
    if (!match)
        throw new Error(`Invalid member name format: ${memberName}`);
    return Number(match[1]);
}
function removeUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}
//# sourceMappingURL=utils.js.map