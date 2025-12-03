import { Response } from 'express';
import { validationResult } from 'express-validator';
import AuthService from '../services/AuthService';
import { AuthenticatedRequest } from '../types/auth';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    // Create user
    const user = await AuthService.createUser({ name, email, password });

    // Generate token
    const token = AuthService.generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Validate credentials
    const user = await AuthService.validateCredentials({ email, password });

    // Generate token
    const token = AuthService.generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(401).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 * Protected route - requires authentication
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // User is attached to req by authMiddleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const user = await AuthService.getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  // JWT is stateless, so logout is handled client-side by removing the token
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove the token from client-side storage.',
  });
};
