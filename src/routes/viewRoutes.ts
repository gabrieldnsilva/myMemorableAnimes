import { Router } from "express";
import { ViewController } from "../controllers/ViewController";

const router = Router();

// Public routes
router.get("/", ViewController.home);
router.get("/login", ViewController.loginPage);
router.get("/register", ViewController.registerPage);
router.get("/search", ViewController.searchPage);

// Protected routes (middleware será adicionado posteriormente)
router.get("/profile", ViewController.profilePage);
router.get("/animes", ViewController.animeListPage);

// Logout
router.get("/logout", ViewController.logout);

// 404 - deve ser a última rota
router.use(ViewController.notFound);

export default router;
