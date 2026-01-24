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
 * Middleware to authenticate parent via JWT token
 */
export const authenticateParent = async (
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
    
    if (decoded instanceof Error) {
      throw new ErrorResponse("Invalid or expired token", statusCode.Unauthorized);
    }
    
    const payload = decoded as JwtPayload;
    
    // Verify user type is parent
    if (payload.userType !== "parent") {
      throw new ErrorResponse("Invalid user type", statusCode.Forbidden);
    }
    
    (req as any).parent = payload;
    
    next();
  } catch (error) {
    next(error);
  }
};
