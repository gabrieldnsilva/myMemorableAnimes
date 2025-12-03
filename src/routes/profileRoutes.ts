import { Router } from "express";
import {
	getProfile,
	updateProfile,
	updatePassword,
	deleteAccount,
} from "../controllers/ProfileController";
import {
	updateProfileValidator,
	updatePasswordValidator,
} from "../middlewares/validators/profileValidator";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/profile
 * @desc    Get user profile with statistics
 * @access  Private
 */
router.get("/", getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile (name, email, bio, avatar)
 * @access  Private
 */
router.put("/", updateProfileValidator, updateProfile);

/**
 * @route   PUT /api/profile/password
 * @desc    Change user password
 * @access  Private
 */
router.put("/password", updatePasswordValidator, updatePassword);

/**
 * @route   DELETE /api/profile
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete("/", deleteAccount);

export default router;
