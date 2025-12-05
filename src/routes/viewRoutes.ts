import { Router } from "express";
import { ViewController } from "../controllers/ViewController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.get("/", ViewController.home);
router.get("/login", ViewController.loginPage);
router.post("/login", ViewController.loginSubmit);
router.get("/register", ViewController.registerPage);
router.post("/register", ViewController.registerSubmit);
router.get("/search", ViewController.searchPage);
router.get("/anime/:id", ViewController.animeDetailsPage);

// Protected routes (require authentication)
router.get("/profile", requireAuth, ViewController.profilePage);
router.get("/animes", requireAuth, ViewController.animeListPage);

// Logout
router.get("/logout", ViewController.logout);

export default router;
