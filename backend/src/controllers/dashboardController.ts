import { Response } from "express";
import { AuthenticatedRequest } from "../types/types";
import { DashboardModel } from "../models/dashboardModel";

export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await DashboardModel.getDashboardMetrics();
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard metrics"
    });
  }
};