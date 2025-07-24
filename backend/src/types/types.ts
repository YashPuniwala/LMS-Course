import { Request } from "express";
import { UserType } from "../models/userModel";

export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export interface AuthenticatedRequest extends Request {
  user?: { _id: string };
}

export interface CreateCourseCustomRequest extends Request {
  user?: UserType
  id?: string; // Make it optional if it might not always be present
}




// Review Types

