import express, { Request, Response, NextFunction } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/isAuthenticated";
import { createCheckoutSession, enrollFreeCourse, getAllPurchasedCourse, getCourseDetailWithStatusQuery, stripeWebhook } from "../controllers/coursePurchaseController";

const router = express.Router();

router.route("/checkout/create-checkout-session").post(isAuthenticated, createCheckoutSession);
router.route("/webhook").post(express.raw({ type: "application/json" }), stripeWebhook);
router.route("/detail-with-status/:courseId").get(isAuthenticated, getCourseDetailWithStatusQuery);
router.route("/getAllPurchasedCourse").get(isAuthenticated, getAllPurchasedCourse);
router.route("/enroll-free-course/:courseId").post(isAuthenticated, enrollFreeCourse);
// router.route("/getDashboardMetrics").get(isAuthenticated, isAdmin, getDashboardMetrics);

export default router;