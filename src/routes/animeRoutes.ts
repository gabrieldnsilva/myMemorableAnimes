import { Router } from "express";
import {
	listAnimes,
	getAnime,
	addToMyList,
	removeFromMyList,
	getMyList,
	updateAnimeEntry,
	toggleFavorite,
	updateRating,
} from "../controllers/AnimeController";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
	addToListValidator,
	updateAnimeValidator,
	updateRatingValidator,
} from "../middlewares/validators/animeValidator";

const router = Router();

// Public routes
router.get("/", listAnimes);
router.get("/:id", getAnime);

// Protected routes - require authentication
router.post("/:id/list", authenticateToken, addToListValidator, addToMyList);
router.delete("/:id/list", authenticateToken, removeFromMyList);
router.get("/mylist/all", authenticateToken, getMyList);
router.put(
	"/:id/list",
	authenticateToken,
	updateAnimeValidator,
	updateAnimeEntry
);
router.patch("/:id/favorite", authenticateToken, toggleFavorite);
router.patch(
	"/:id/rating",
	authenticateToken,
	updateRatingValidator,
	updateRating
);

export default router;
