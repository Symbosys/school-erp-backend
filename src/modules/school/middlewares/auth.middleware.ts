import type { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { verifyToken } from "../../../utils/jwt.util";

const COOKIE_NAME = "school_token";

interface JwtPayload {
  schoolId: string;
  email: string;
}

/**
 * Middleware to authenticate school via JWT cookie
 */
export const authenticateSchool = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
    }

    const decoded = verifyToken(token);
    
    if (decoded instanceof Error) {
      throw new ErrorResponse("Invalid or expired token", statusCode.Unauthorized);
    }
    
    (req as any).school = decoded as JwtPayload;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't throw if no token
 */
export const optionalSchoolAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (token) {
      const decoded = verifyToken(token);
      if (!(decoded instanceof Error)) {
        (req as any).school = decoded as JwtPayload;
      }
    }
    
    next();
  } catch {
    next();
  }
};
