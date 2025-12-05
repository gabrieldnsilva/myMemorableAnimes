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
	addToMyListHTMX,
	toggleFavoriteHTMX,
	removeFromListHTMX,
} from "../controllers/AnimeController";
import {
	authenticateToken,
	authenticateSession,
} from "../middlewares/authMiddleware";
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

// HTMX-specific routes (return HTML partials, use session auth)
router.post("/:id/add/htmx", authenticateSession, addToMyListHTMX);
router.patch("/:id/favorite/htmx", authenticateSession, toggleFavoriteHTMX);
router.delete("/:id/list/htmx", authenticateSession, removeFromListHTMX);

export default router;
