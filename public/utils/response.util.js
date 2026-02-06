"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessResponse = exports.ErrorResponse = void 0;
exports.normalizeBigInt = normalizeBigInt;
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ErrorResponse = ErrorResponse;
const SuccessResponse = (res, message, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data: normalizeBigInt(data),
    });
};
exports.SuccessResponse = SuccessResponse;
function normalizeBigInt(obj) {
    if (obj instanceof Date) {
        return obj.toISOString(); // ✅ serialize Date properly
    }
    else if (typeof obj === "bigint") {
        return obj.toString(); // ✅ BigInt -> string
    }
    else if (Array.isArray(obj)) {
        return obj.map(normalizeBigInt);
    }
    else if (obj && typeof obj === "object") {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, normalizeBigInt(v)]));
    }
    return obj;
}
//# sourceMappingURL=response.util.js.map