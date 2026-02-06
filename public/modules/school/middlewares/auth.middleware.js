"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSchool = void 0;
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const jwt_util_1 = require("../../../utils/jwt.util");
const error_middleware_1 = require("../../../middlewares/error.middleware");
const utils_1 = require("../../../utils/utils");
const prisma_1 = require("../../../config/prisma");
const COOKIE_NAME = "school_token";
exports.authenticateSchool = (0, error_middleware_1.asyncHandler)(async (req, _res, next) => {
    // Extract token from Authorization header (Bearer)
    const tokenFromHeader = req.headers["authorization"]?.startsWith("Bearer ")
        ? req.headers["authorization"].split("Bearer ")[1]?.trim()
        : undefined;
    // Extract token from cookies
    const cookies = (0, utils_1.parseCookies)(req.headers.cookie);
    const tokenFromCookie = cookies["school_token"];
    // Choose the available token
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) {
        return next(new response_util_1.ErrorResponse("Not authorized, token missing", types_1.statusCode.Unauthorized));
    }
    let decoded;
    try {
        decoded = (0, jwt_util_1.verifyToken)(token);
    }
    catch (error) {
        return next(new response_util_1.ErrorResponse("Invalid or expired token", types_1.statusCode.Unauthorized));
    }
    // Validate decoded payload
    if (!decoded?.id) {
        return next(new response_util_1.ErrorResponse("Invalid token payload", types_1.statusCode.Unauthorized));
    }
    const school = await prisma_1.prisma.school.findUnique({
        where: {
            id: decoded.id,
        },
    });
    if (!school) {
        return next(new response_util_1.ErrorResponse("school not found", types_1.statusCode.Unauthorized));
    }
    req.school = school;
    next();
});
//# sourceMappingURL=auth.middleware.js.map