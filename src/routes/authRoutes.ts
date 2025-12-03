import { Router } from "express";
import {
	register,
	login,
	getProfile,
	logout,
} from "../controllers/AuthController";
import {
	registerValidator,
	loginValidator,
} from "../middlewares/validators/authValidator";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", registerValidator, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post("/login", loginValidator, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get("/profile", authenticateToken, getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post("/logout", logout);

export default router;
