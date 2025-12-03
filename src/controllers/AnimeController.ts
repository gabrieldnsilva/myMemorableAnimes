import { Response } from 'express';
import { validationResult } from 'express-validator';
import AnimeService from '../services/AnimeService';
import { AuthenticatedRequest } from '../types/auth';
import { WatchStatus } from '../models/UserAnimeList';

export const listAnimes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const genre = req.query.genre as string;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
    const sortBy = (req.query.sortBy as 'title' | 'year' | 'rating') || 'title';
    const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC';

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
      error: error instanceof Error ? error.message : 'Failed to fetch animes',
    });
  }
};

export const getAnime = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const animeId = parseInt(req.params.id);
    if (isNaN(animeId)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    const anime = await AnimeService.getAnimeById(animeId);
    let userEntry = null;
    if (req.user) {
      userEntry = await AnimeService.getUserAnimeEntry(req.user.id, animeId);
    }

    res.status(200).json({ success: true, data: { anime, userEntry } });
  } catch (error) {
    if (error instanceof Error && error.message === 'Anime not found') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch anime',
    });
  }
};

export const addToMyList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const animeId = parseInt(req.params.id);
    if (isNaN(animeId)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    const userId = req.user!.id;
    const { status, isFavorite, rating, watchedEpisodes, notes } = req.body;

    const userAnime = await AnimeService.addAnimeToUserList(userId, animeId, {
      status,
      isFavorite,
      rating,
      watchedEpisodes,
      notes,
    });

    res.status(201).json({ success: true, data: userAnime });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Anime not found' || error.message === 'Anime already in your list')
    ) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add anime to list',
    });
  }
};

export const removeFromMyList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const animeId = parseInt(req.params.id);
    if (isNaN(animeId)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    const userId = req.user!.id;
    const result = await AnimeService.removeAnimeFromUserList(userId, animeId);

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    if (error instanceof Error && error.message === 'Anime not in your list') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove anime from list',
    });
  }
};

export const getMyList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const status = req.query.status as WatchStatus | undefined;
    const favorite =
      req.query.favorite === 'true' ? true : req.query.favorite === 'false' ? false : undefined;
    const sortBy = (req.query.sortBy as 'title' | 'addedAt' | 'rating') || 'addedAt';
    const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';

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
      error: error instanceof Error ? error.message : 'Failed to fetch your anime list',
    });
  }
};

export const updateAnimeEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const animeId = parseInt(req.params.id);
    if (isNaN(animeId)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
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
    if (error instanceof Error && error.message === 'Anime not in your list') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update anime entry',
    });
  }
};

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const animeId = parseInt(req.params.id);
    if (isNaN(animeId)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    const userId = req.user!.id;
    const userAnime = await AnimeService.toggleFavorite(userId, animeId);

    res.status(200).json({ success: true, data: userAnime });
  } catch (error) {
    if (error instanceof Error && error.message === 'Anime not in your list') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle favorite',
    });
  }
};

export const updateRating = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const animeId = parseInt(req.params.id);
    if (isNaN(animeId)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    const userId = req.user!.id;
    const { rating } = req.body;

    const userAnime = await AnimeService.updateRating(userId, animeId, rating);

    res.status(200).json({ success: true, data: userAnime });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Anime not in your list' ||
        error.message === 'Rating must be between 1 and 5')
    ) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rating',
    });
  }
};
