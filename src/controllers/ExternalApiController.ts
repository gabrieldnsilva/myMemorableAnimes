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
import Anime from "../models/Anime";
import UserAnimeList from "../models/UserAnimeList";
import AnimeService from "../services/AnimeService";
import { AuthenticatedRequest } from "../types/auth";

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

/**
 * Importa um anime do Jikan, faz upsert no banco local e adiciona à lista do usuário (HTMX + sessão)
 */
export const importAndAddFromJikanHTMX = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const malId = parseInt(req.params.malId);
		const userId = req.user?.id;

		if (!userId) {
			return res
				.status(401)
				.send(
					'<span class="text-red-600 text-sm">Faça login para favoritar</span>'
				);
		}

		if (isNaN(malId)) {
			return res
				.status(400)
				.send('<span class="text-red-600 text-sm">ID inválido</span>');
		}

		// Busca dados no Jikan
		const apiResponse = await JikanService.getAnimeById(malId);
		const data = apiResponse?.data;

		if (!data) {
			return res
				.status(404)
				.send(
					'<span class="text-red-600 text-sm">Anime não encontrado</span>'
				);
		}

		// Mapear campos para o modelo local
		const poster =
			data.images?.webp?.large_image_url ||
			data.images?.webp?.image_url ||
			data.images?.jpg?.large_image_url ||
			data.images?.jpg?.image_url ||
			"/images/posters/default-poster.svg";

		// Não guardamos background remoto para não poluir o carrossel da home
		const backgroundImage = "";

		const mapped = {
			id: malId, // usamos o mal_id como PK para alinhar buscas futuras
			title:
				data.title ||
				data.title_english ||
				data.title_japanese ||
				"Título desconhecido",
			synopsis: data.synopsis || "Sinopse não disponível.",
			genre: (data.genres || []).map((g: any) => g.name).join(", ") || "",
			year:
				data.year?.toString() ||
				data.aired?.prop?.from?.year?.toString() ||
				"N/A",
			rating: data.rating || (data.score ? `${data.score}` : "N/A"),
			duration: data.duration || "N/A",
			imageUrl: poster,
			backgroundImage,
			poster,
		};

		// Upsert no banco local
		await Anime.upsert(mapped);

		// Adiciona à lista do usuário (marca como favorito) - cria ou atualiza existente
		const existing = await UserAnimeList.findOne({
			where: { userId, animeId: malId },
		});

		if (existing) {
			existing.isFavorite = true;
			await existing.save();
		} else {
			const animeService = new AnimeService();
			await animeService.addAnimeToUserList(userId, malId, {
				isFavorite: true,
			});
		}

		// Retorna botão atualizado para HTMX (troca para estado favoritado)
		return res.send(
			'<div class="flex-1 flex items-center gap-2 text-sm">' +
				'<button class="px-4 py-2 bg-green-600 text-white rounded font-semibold" disabled>✅ Favoritado</button>' +
				'<span class="text-green-500">Adicionado à sua lista</span>' +
				"</div>"
		);
	} catch (error) {
		console.error("Error importing anime from Jikan:", error);
		const message =
			error instanceof Error ? error.message : "Erro ao favoritar anime";
		return res
			.status(500)
			.send(`<span class="text-red-600 text-sm">${message}</span>`);
	}
};
