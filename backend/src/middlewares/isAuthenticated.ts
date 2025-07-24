import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { User, UserType } from "../models/userModel";
import ErrorHandler from "../utils/errorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: UserType;
}

export const isAuthenticated = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let token = req.cookies.token;
      console.log(token, "token authenticate");
      console.log(req.cookies, "req.cookies authenticate");

      if (!token) {
        return next(new ErrorHandler("Token not found", 400));
      }

      const jwtSecret = process.env.JWT_SECRET_KEY || "";
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      if (!decoded || !decoded.userId) {
        return next(new ErrorHandler("UserId not found", 401));
      }

      const user = await User.findById(decoded.userId).select(
        "_id name email role photoUrl enrolledCourses"
      );

      if (!user) {
        return next(new ErrorHandler("User not found", 401));
      }

      // Set req.user to the full user object
      req.user = user;

      console.log(req.user, "req.user in isAuthenticated");
      next();
    } catch (e) {
      res.status(401).json({ message: "Invalid Token" });
      next(e);
    }
  }
);


export const isAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("req.user.admin:", req.user); // Debug log
  console.log("req.user.admin:", req.user?.role); // Debug log

  if (!req.user || req.user.role !== "instructor") {
    return next(new ErrorHandler("Unauthorized access", 400));
  }
  console.log(req.user);
  console.log(req.user.role);
  next();
};
