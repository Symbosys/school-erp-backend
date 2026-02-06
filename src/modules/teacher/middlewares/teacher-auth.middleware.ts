import type { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { verifyToken } from "../../../utils/jwt.util";

interface JwtPayload {
  userId: string;
  userType: string;
  email: string;
  schoolId: string;
}

/**
 * Middleware to authenticate teacher via JWT token
 */
export const authenticateTeacher = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = verifyToken(token);
    
    if (!decoded) {
      throw new ErrorResponse("Invalid or expired token", statusCode.Unauthorized);
    }
    
    const payload = decoded as JwtPayload;
    
    // Verify user type is teacher
    if (payload.userType !== "teacher") {
      throw new ErrorResponse("Invalid user type", statusCode.Forbidden);
    }
    
    (req as any).teacher = payload;
    
    next();
  } catch (error) {
    next(error);
  }
};
