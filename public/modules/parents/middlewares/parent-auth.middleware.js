"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateParent = void 0;
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const jwt_util_1 = require("../../../utils/jwt.util");
/**
 * Middleware to authenticate parent via JWT token
 */
const authenticateParent = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = (0, jwt_util_1.verifyToken)(token);
        if (decoded instanceof Error) {
            throw new response_util_1.ErrorResponse("Invalid or expired token", types_1.statusCode.Unauthorized);
        }
        const payload = decoded;
        // Verify user type is parent
        if (payload.userType !== "parent") {
            throw new response_util_1.ErrorResponse("Invalid user type", types_1.statusCode.Forbidden);
        }
        req.parent = payload;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticateParent = authenticateParent;
//# sourceMappingURL=parent-auth.middleware.js.map