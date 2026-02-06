"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const types_js_1 = require("../types/types.js");
const utils_js_1 = require("../utils/utils.js");
const errorMiddleware = (err, req, res, next) => {
    console.log({ err });
    err.message || (err.message = "Internal Server Error");
    err.statusCode || (err.statusCode = 500);
    if (err.name === "CastError")
        err.message = "Invalid ID";
    if ("code" in err && err.code === "P2025") {
        err.message = "Item not found";
    }
    // ✅ Handle Zod error
    if (err instanceof zod_1.ZodError) {
        const errors = (0, utils_js_1.zodError)(err);
        // get first zod error message
        const firstErrorMessage = err.issues.length > 0 ? err?.issues?.[0]?.message : "Validation Error";
        return res.status(types_js_1.statusCode.Bad_Request).json({
            success: false,
            message: firstErrorMessage,
            errors,
        });
    }
    // Final Error Response
    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};
exports.errorMiddleware = errorMiddleware;
exports.default = exports.errorMiddleware;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map