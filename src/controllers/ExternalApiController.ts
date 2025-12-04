export const getTopAnime = async (_req: Request, res: Response) => {
	try {
		const data = await JikanService.getTopAnime();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to fetch top anime from Jikan API",
		});
	}
};

export const getRecentAnimeRecommendations = async (
	_req: Request,
	res: Response
) => {
	try {
		const data = await JikanService.getRecentAnimeRecommendations();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to fetch recommendations from Jikan API",
		});
	}
};

export const getRandomAnime = async (_req: Request, res: Response) => {
	try {
		const data = await JikanService.getRandomAnime();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to fetch random anime from Jikan API",
		});
	}
};
import { Request, Response } from "express";
import JikanService from "../services/JikanService";

export const searchAnime = async (req: Request, res: Response) => {
	try {
		const { title } = req.query;
		if (!title || typeof title !== "string") {
			return res.status(400).json({
				success: false,
				error: "Missing or invalid title parameter",
			});
		}
		const data = await JikanService.searchAnime(title);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to fetch from Jikan API",
		});
	}
};

export const getAnimeById = async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id);
		if (isNaN(id)) {
			return res
				.status(400)
				.json({ success: false, error: "Invalid anime ID" });
		}
		const data = await JikanService.getAnimeById(id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: "Failed to fetch anime details from Jikan API",
		});
	}
};

/**
 * Search animes and render partial for HTMX
 */
export const searchAnimesHTMX = async (req: Request, res: Response) => {
	try {
		const query = req.query.q;
		if (!query || typeof query !== "string" || query.length < 3) {
			return res.render("partials/searchResults", { animes: [] });
		}

		const result = await JikanService.searchAnime(query);
		const animes = result.data || [];

		return res.render("partials/searchResults", { animes });
	} catch (error) {
		console.error("Error searching animes:", error);
		return res.render("partials/searchResults", { animes: [] });
	}
};
