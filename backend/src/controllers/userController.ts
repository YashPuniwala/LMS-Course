import { NextFunction, Request, Response } from "express";
import { User, UserType } from "../models/userModel";
import bcrypt from "bcryptjs"
import { generateToken } from "../utils/generateToken";
import { AuthenticatedRequest, RegisterBody } from "../types/types";
import ErrorHandler from "../utils/errorHandler";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary";

export const register = async (
    req: Request<{}, {}, RegisterBody>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, email, password } = req.body;

        // Check for missing fields
        if (!name || !email || !password) {
            res.status(400).json({ message: "Please enter all fields" });
            return; // Prevent further execution
        }

        // Check if the user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ success: false, message: "User already exists" });
            return; // Prevent further execution
        }

        // Create the user if validation passes
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        if (user) {
            generateToken(res, user, user._id, "Registered Successfully", 201);
            res.status(200).json({ userId: user._id });
        } else {
            // Handle case where user creation fails
            return next(
                new ErrorHandler("An error occurred in creating the user", 400)
            );
        }
    } catch (error) {
        // Pass any unexpected errors to the error handler
        next(error);
    }
};

export const login = async (
    req: Request<{}, {}, { email: string; password: string }>, // Typing request body
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "All fields are required",
            });
            return;
        }

        const user = await User.findOne({ email }) as UserType | null;

        if (!user) {
            res.status(400).json({
                success: false,
                message: "Incorrect email or password",
            });
            return;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            res.status(400).json({
                success: false,
                message: "Incorrect email or password",
            });
            return;
        }

        generateToken(res, user, user._id.toString(), `Welcome back ${user.name}`, 201);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("token", "", {
            expires: new Date(0),
            httpOnly: true,
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully!",
        });
    } catch (error) {
        console.error("Logout Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to log out. Please try again.",
        });
    }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user; // Get user ID from req.user
        console.log(userId, "userId")
        console.log(req.user, "req.user")
        if (!userId) {
            res.status(404).json({ message: "User ID not found in request" })
        }
        console.log(userId, "userId")
        const user = await User.findById(userId).select("-password").populate("enrolledCourses");
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" })
        }
        console.log(user, "user")

        res.json(user);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        })
    }
}

export const updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user;
      const { name } = req.body;
      const profilePhoto = req.file;
  
      if (!userId) {
         res.status(401).json({
          success: false,
          message: "Unauthorized: No user ID found",
        });
        return
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
         res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }
  
      if (user && user.photoUrl) {
        const publicId = user.photoUrl.split("/").pop()?.split(".")[0];
  
        if (publicId) {
          await deleteMediaFromCloudinary(publicId);
        }
      }
  
      let photoUrl;
      if (profilePhoto && profilePhoto.path) {
        const cloudResponse = await uploadMedia(profilePhoto.path);
        photoUrl = cloudResponse?.secure_url;
      }
  
      const updatedData = {
        name: name || user.name,
        photoUrl: photoUrl || user.photoUrl,
      };
  
      const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
        new: true,
      }).select("-password");
  
       res.status(200).json({
        success: true,
        user: updatedUser,
        message: "Profile updated successfully.",
      });
      return;
    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update the profile.",
      });
    }
  };