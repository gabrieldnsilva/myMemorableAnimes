import { Request, Response, NextFunction } from "express";

/**
 * Middleware to set local variables for all views
 * Makes commonly used data available to all EJS templates
 */
export const viewLocals = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Set user from session (if authenticated)
	res.locals.user = req.session?.user || null;

	// Set flash messages (if using connect-flash)
	if (req.flash) {
		res.locals.success = req.flash("success");
		res.locals.error = req.flash("error");
		res.locals.info = req.flash("info");
	}

	// Set current path for active menu highlighting
	res.locals.currentPath = req.path;

	next();
};
