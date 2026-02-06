"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectLeaveRoutes = void 0;
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const jwt_util_1 = require("../../../utils/jwt.util");
const protectLeaveRoutes = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = "";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        else if (req.cookies && (req.cookies.school_token || req.cookies.token)) {
            token = req.cookies.school_token || req.cookies.token;
        }
        else {
            throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
        }
        const decoded = (0, jwt_util_1.verifyToken)(token);
        if (decoded instanceof Error) {
            throw new response_util_1.ErrorResponse("Invalid or expired token", types_1.statusCode.Unauthorized);
        }
        const payload = decoded;
        let role = "";
        let userId = "";
        // Check if it's a School/Admin token (has schoolId but might lack userType)
        if (!payload.userType && payload.schoolId) {
            role = "ADMIN"; // Or "SCHOOL"
            userId = payload.schoolId; // Use School ID as the user ID for admins
        }
        else if (payload.userType) {
            // Student or Teacher
            role = payload.userType.toUpperCase();
            userId = payload.userId;
        }
        else {
            throw new response_util_1.ErrorResponse("Invalid token payload", types_1.statusCode.Unauthorized);
        }
        req.user = {
            id: userId,
            role: role,
            schoolId: payload.schoolId,
            email: payload.email
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.protectLeaveRoutes = protectLeaveRoutes;
//# sourceMappingURL=leave.middleware.js.map