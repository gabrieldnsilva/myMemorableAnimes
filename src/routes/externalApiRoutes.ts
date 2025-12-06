import { Router } from "express";
import {
	searchAnime,
	searchAnimesHTMX,
	getAnimeById,
	getTopAnime,
	getRecentAnimeRecommendations,
	getRandomAnime,
	importAndAddFromJikanHTMX,
} from "../controllers/ExternalApiController";
import { authenticateSession } from "../middlewares/authMiddleware";

const router = Router();

// HTMX endpoint (renders partial)
router.get("/search", searchAnimesHTMX);
router.post(
	"/import-and-add/:malId/htmx",
	authenticateSession,
	importAndAddFromJikanHTMX
);

// JSON API endpoints
router.get("/search-json", searchAnime);
router.get("/anime/:id", getAnimeById);
router.get("/top", getTopAnime);
router.get("/recommendations", getRecentAnimeRecommendations);
router.get("/random", getRandomAnime);

export default router;
