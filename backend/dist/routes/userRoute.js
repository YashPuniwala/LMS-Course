"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const isAuthenticated_1 = require("../middlewares/isAuthenticated");
const multer_1 = __importDefault(require("../utils/multer"));
const router = express_1.default.Router();
router.route("/register").post(userController_1.register);
router.route("/login").post(userController_1.login);
router.route("/logout").post(userController_1.logout);
router.route("/me").get(isAuthenticated_1.isAuthenticated, userController_1.getUserProfile);
router.route("/profile/update").put(isAuthenticated_1.isAuthenticated, multer_1.default.single("profilePhoto"), userController_1.updateProfile);
exports.default = router;
