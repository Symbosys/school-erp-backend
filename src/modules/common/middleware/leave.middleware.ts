import type { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { verifyToken } from "../../../utils/jwt.util";

interface JwtPayload {
  userId: string;
  userType: string;
  email?: string;
  schoolId: string;
  // Add other fields from your token payload if needed
}

export const protectLeaveRoutes = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Check for cookie as well?
      // const token = req.cookies.token;
      // if (!token) ...
      throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (decoded instanceof Error) {
      throw new ErrorResponse("Invalid or expired token", statusCode.Unauthorized);
    }

    const payload = decoded as JwtPayload;

    let role = "";
    let userId = "";

    // Check if it's a School/Admin token (has schoolId but might lack userType)
    if (!payload.userType && payload.schoolId) {
      role = "ADMIN"; // Or "SCHOOL"
      userId = payload.schoolId; // Use School ID as the user ID for admins
    } else if (payload.userType) {
      // Student or Teacher
      role = payload.userType.toUpperCase();
      userId = payload.userId;
    } else {
       throw new ErrorResponse("Invalid token payload", statusCode.Unauthorized);
    }
    
    (req as any).user = {
      id: userId,
      role: role,
      schoolId: payload.schoolId,
      email: payload.email
    };

    next();
  } catch (error) {
    next(error);
  }
};
