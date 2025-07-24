"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const dashboardController_1 = require("../controllers/dashboardController");
const router = express_1.default.Router();
router.route("/get-dashboard-metrice").get(isAuthenticated_1.isAuthenticated, isAuthenticated_1.isAdmin, dashboardController_1.getDashboardMetrics);
exports.default = router;
