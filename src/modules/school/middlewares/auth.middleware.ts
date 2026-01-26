import type { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { verifyToken } from "../../../utils/jwt.util";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { parseCookies } from "../../../utils/utils";
import { prisma } from "../../../config/prisma";

const COOKIE_NAME = "school_token";

interface JwtPayload {
  schoolId: string;
  email: string;
}

export const authenticateSchool = asyncHandler(async (req, _res, next) => {
  // Extract token from Authorization header (Bearer)
  const tokenFromHeader = req.headers["authorization"]?.startsWith("Bearer ")
    ? req.headers["authorization"].split("Bearer ")[1]?.trim()
    : undefined;

  // Extract token from cookies
  const cookies = parseCookies(req.headers.cookie);
  const tokenFromCookie = cookies["school_token"]; 
  
  // Choose the available token
  const token = tokenFromHeader || tokenFromCookie;
  
  if (!token) {
    return next(
      new ErrorResponse("Not authorized, token missing", statusCode.Unauthorized)
    );
  }

  let decoded;
  try {
    decoded = verifyToken(token) as { id: string };
  } catch (error) {
    return next(
      new ErrorResponse("Invalid or expired token", statusCode.Unauthorized)
    );
  }

  // Validate decoded payload
  if (!decoded?.id) {
    return next(
      new ErrorResponse("Invalid token payload", statusCode.Unauthorized)
    );
  }

  const school = await prisma.school.findUnique({
    where: {
      id: decoded.id,
    },
  });

  if (!school) {
    return next(
      new ErrorResponse("school not found", statusCode.Unauthorized)
    );
  }

  req.school = school;
  next(); 
});
