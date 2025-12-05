import { Response } from "express";
import { validationResult } from "express-validator";
import AnimeService from "../services/AnimeService";
import { AuthenticatedRequest } from "../types/auth";
import { WatchStatus } from "../models/UserAnimeList";

export const listAnimes = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const genre = req.query.genre as string;
		const year = req.query.year
			? parseInt(req.query.year as string)
			: undefined;
		const minRating = req.query.minRating
			? parseFloat(req.query.minRating as string)
			: undefined;
		const sortBy =
			(req.query.sortBy as "title" | "year" | "rating") || "title";
		const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "ASC";

		const result = await AnimeService.getAllAnimes({
			page,
			limit,
			genre,
			year,
			minRating,
			sortBy,
			sortOrder,
		});

		res.status(200).json({ success: true, data: result });
	} catch (error) {
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to fetch animes",
		});
	}
};

export const getAnime = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			res.status(400).json({ success: false, error: "Invalid anime ID" });
			return;
		}

		const anime = await AnimeService.getAnimeById(animeId);
		let userEntry = null;
		if (req.user) {
			userEntry = await AnimeService.getUserAnimeEntry(
				req.user.id,
				animeId
			);
		}

		res.status(200).json({ success: true, data: { anime, userEntry } });
	} catch (error) {
		if (error instanceof Error && error.message === "Anime not found") {
			res.status(404).json({ success: false, error: error.message });
			return;
		}
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to fetch anime",
		});
	}
};

export const addToMyList = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: false, errors: errors.array() });
			return;
		}

		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			res.status(400).json({ success: false, error: "Invalid anime ID" });
			return;
		}

		const userId = req.user!.id;
		const { status, isFavorite, rating, watchedEpisodes, notes } = req.body;

		const userAnime = await AnimeService.addAnimeToUserList(
			userId,
			animeId,
			{
				status,
				isFavorite,
				rating,
				watchedEpisodes,
				notes,
			}
		);

		res.status(201).json({ success: true, data: userAnime });
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message === "Anime not found" ||
				error.message === "Anime already in your list")
		) {
			res.status(400).json({ success: false, error: error.message });
			return;
		}
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to add anime to list",
		});
	}
};

export const removeFromMyList = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			res.status(400).json({ success: false, error: "Invalid anime ID" });
			return;
		}

		const userId = req.user!.id;
		const result = await AnimeService.removeAnimeFromUserList(
			userId,
			animeId
		);

		res.status(200).json({ success: true, message: result.message });
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "Anime not in your list"
		) {
			res.status(404).json({ success: false, error: error.message });
			return;
		}
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to remove anime from list",
		});
	}
};

export const getMyList = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const userId = req.user!.id;
		const status = req.query.status as WatchStatus | undefined;
		const favorite =
			req.query.favorite === "true"
				? true
				: req.query.favorite === "false"
				? false
				: undefined;
		const sortBy =
			(req.query.sortBy as "title" | "addedAt" | "rating") || "addedAt";
		const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

		const userAnimes = await AnimeService.getUserAnimeList(userId, {
			status,
			favorite,
			sortBy,
			sortOrder,
		});

		res.status(200).json({ success: true, data: userAnimes });
	} catch (error) {
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to fetch your anime list",
		});
	}
};

export const updateAnimeEntry = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: false, errors: errors.array() });
			return;
		}

		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			res.status(400).json({ success: false, error: "Invalid anime ID" });
			return;
		}

		const userId = req.user!.id;
		const { status, isFavorite, rating, watchedEpisodes, notes } = req.body;

		const userAnime = await AnimeService.updateUserAnime(userId, animeId, {
			status,
			isFavorite,
			rating,
			watchedEpisodes,
			notes,
		});

		res.status(200).json({ success: true, data: userAnime });
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "Anime not in your list"
		) {
			res.status(404).json({ success: false, error: error.message });
			return;
		}
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to update anime entry",
		});
	}
};

export const toggleFavorite = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			res.status(400).json({ success: false, error: "Invalid anime ID" });
			return;
		}

		const userId = req.user!.id;
		const userAnime = await AnimeService.toggleFavorite(userId, animeId);

		res.status(200).json({ success: true, data: userAnime });
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "Anime not in your list"
		) {
			res.status(404).json({ success: false, error: error.message });
			return;
		}
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to toggle favorite",
		});
	}
};

export const updateRating = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ success: false, errors: errors.array() });
			return;
		}

		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			res.status(400).json({ success: false, error: "Invalid anime ID" });
			return;
		}

		const userId = req.user!.id;
		const { rating } = req.body;

		const userAnime = await AnimeService.updateRating(
			userId,
			animeId,
			rating
		);

		res.status(200).json({ success: true, data: userAnime });
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message === "Anime not in your list" ||
				error.message === "Rating must be between 1 and 5")
		) {
			res.status(400).json({ success: false, error: error.message });
			return;
		}
		res.status(500).json({
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to update rating",
		});
	}
};

/**
 * HTMX-specific endpoints (return HTML partials)
 */

export const addToMyListHTMX = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			return res.render("partials/htmx/error", {
				error: "ID de anime inválido",
			});
		}

		const userId = req.user!.id;
		const status = req.body.status || "plan_to_watch";

		await AnimeService.addAnimeToUserList(userId, animeId, { status });
		const anime = await AnimeService.getAnimeById(animeId);

		res.render("partials/htmx/addToListSuccess", { anime });
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === "Anime already in your list"
		) {
			return res.render("partials/htmx/error", {
				error: "Anime já está na sua lista",
			});
		}
		res.render("partials/htmx/error", {
			error:
				error instanceof Error
					? error.message
					: "Erro ao adicionar anime",
		});
	}
};

export const toggleFavoriteHTMX = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			return res.render("partials/htmx/error", {
				error: "ID de anime inválido",
			});
		}

		const userId = req.user!.id;

		// Check if anime is already in user's list
		let userAnime = await AnimeService.getUserAnimeEntry(userId, animeId);

		// If not in list, add it first with plan_to_watch status
		if (!userAnime) {
			await AnimeService.addAnimeToUserList(userId, animeId, {
				status: WatchStatus.PLAN_TO_WATCH,
				isFavorite: true,
			});
			userAnime = await AnimeService.getUserAnimeEntry(userId, animeId);
		} else {
			// Otherwise toggle the favorite status
			userAnime = await AnimeService.toggleFavorite(userId, animeId);
		}

		const anime = await AnimeService.getAnimeById(animeId);

		res.render("partials/htmx/favoriteButton", {
			anime,
			isFavorite: userAnime?.isFavorite,
		});
	} catch (error) {
		res.render("partials/htmx/error", {
			error:
				error instanceof Error
					? error.message
					: "Erro ao favoritar anime",
		});
	}
};

export const removeFromListHTMX = async (
	req: AuthenticatedRequest,
	res: Response
): Promise<void> => {
	try {
		const animeId = parseInt(req.params.id);
		if (isNaN(animeId)) {
			return res.render("partials/htmx/error", {
				error: "ID de anime inválido",
			});
		}

		const userId = req.user!.id;
		await AnimeService.removeAnimeFromUserList(userId, animeId);

		// Return empty response to remove the card
		res.send("");
	} catch (error) {
		res.render("partials/htmx/error", {
			error:
				error instanceof Error
					? error.message
					: "Erro ao remover anime",
		});
	}
};
