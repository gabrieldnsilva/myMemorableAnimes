import { Router } from "express";
import { ViewController } from "../controllers/ViewController";

const router = Router();

// Public routes
router.get("/", ViewController.home);
router.get("/login", ViewController.loginPage);
router.post("/login", ViewController.loginSubmit);
router.get("/register", ViewController.registerPage);
router.post("/register", ViewController.registerSubmit);
router.get("/search", ViewController.searchPage);
router.get("/anime/:id", ViewController.animeDetailsPage);

// Protected routes (middleware será adicionado posteriormente)
router.get("/profile", ViewController.profilePage);
router.get("/animes", ViewController.animeListPage);

// Logout
router.get("/logout", ViewController.logout);

// 404 - deve ser a última rota
router.use(ViewController.notFound);

export default router;
