import { Router } from "express";
import {
	searchAnime,
	getAnimeById,
	getTopAnime,
	getRecentAnimeRecommendations,
	getRandomAnime,
} from "../controllers/ExternalApiController";

const router = Router();

router.get("/search", searchAnime);
router.get("/anime/:id", getAnimeById);
router.get("/top", getTopAnime);
router.get("/recommendations", getRecentAnimeRecommendations);
router.get("/random", getRandomAnime);

export default router;
