"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const coursePurchaseController_1 = require("../controllers/coursePurchaseController");
const router = express_1.default.Router();
router.route("/checkout/create-checkout-session").post(isAuthenticated_1.isAuthenticated, coursePurchaseController_1.createCheckoutSession);
router.route("/webhook").post(express_1.default.raw({ type: "application/json" }), coursePurchaseController_1.stripeWebhook);
router.route("/detail-with-status/:courseId").get(isAuthenticated_1.isAuthenticated, coursePurchaseController_1.getCourseDetailWithStatusQuery);
router.route("/getAllPurchasedCourse").get(isAuthenticated_1.isAuthenticated, coursePurchaseController_1.getAllPurchasedCourse);
router.route("/enroll-free-course/:courseId").post(isAuthenticated_1.isAuthenticated, coursePurchaseController_1.enrollFreeCourse);
// router.route("/getDashboardMetrics").get(isAuthenticated, isAdmin, getDashboardMetrics);
exports.default = router;
