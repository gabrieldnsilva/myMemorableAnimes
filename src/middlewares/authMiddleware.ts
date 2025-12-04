import { Response, NextFunction } from "express";
import AuthService from "../services/AuthService";
import { AuthenticatedRequest } from "../types/auth";

export type { AuthenticatedRequest };

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Get token from Authorization header
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

		if (!token) {
			res.status(401).json({
				success: false,
				error: "Access token required",
			});
			return;
		}

		// Verify token
		const payload = AuthService.verifyToken(token);

		// Attach user payload to request
		req.user = payload;

		next();
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Invalid token";
		res.status(403).json({
			success: false,
			error: errorMessage,
		});
	}
};

/**
 * Middleware to verify session-based authentication (for EJS views and HTMX)
 */
export const authenticateSession = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void => {
	if (req.session?.user) {
		req.user = req.session.user;
		next();
	} else {
		// For HTMX requests, return HTML error
		if (req.headers["hx-request"]) {
			res.render("partials/htmx/error", {
				error: "Você precisa fazer login para realizar esta ação",
			});
		} else {
			req.flash("error", "Você precisa fazer login");
			res.redirect("/login");
		}
	}
};
