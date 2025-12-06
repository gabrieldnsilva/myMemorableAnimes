import Anime from '../models/Anime';
import UserAnimeList, { WatchStatus } from '../models/UserAnimeList';
import { Op } from 'sequelize';

interface GetAllAnimesOptions {
  page?: number;
  limit?: number;
  genre?: string;
  year?: number;
  minRating?: number;
  sortBy?: 'title' | 'year' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
}

interface GetUserAnimeListOptions {
  status?: WatchStatus;
  favorite?: boolean;
  sortBy?: 'title' | 'addedAt' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  withPagination?: boolean;
}

interface AddToListData {
  status?: WatchStatus;
  isFavorite?: boolean;
  rating?: number;
  watchedEpisodes?: number;
  notes?: string;
}

interface UpdateAnimeData {
  status?: WatchStatus;
  isFavorite?: boolean;
  rating?: number;
  watchedEpisodes?: number;
  notes?: string;
}

export class AnimeService {
  /**
   * Get all animes with optional filters and pagination
   */
  async getAllAnimes(options: GetAllAnimesOptions = {}) {
    const {
      page = 1,
      limit = 20,
      genre,
      year,
      minRating,
      sortBy = 'title',
      sortOrder = 'ASC',
    } = options;

    const offset = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (genre) {
      where.genre = { [Op.like]: `%${genre}%` };
    }

    if (year) {
      where.year = year;
    }

    if (minRating) {
      where.rating = { [Op.gte]: minRating };
    }

    const { count, rows } = await Anime.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      animes: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get a single anime by ID
   */
  async getAnimeById(animeId: number) {
    const anime = await Anime.findByPk(animeId);

    if (!anime) {
      throw new Error('Anime not found');
    }

    return anime;
  }

  /**
   * Add an anime to user's list
   */
  async addAnimeToUserList(userId: number, animeId: number, data: AddToListData = {}) {
    // Check if anime exists
    const anime = await Anime.findByPk(animeId);
    if (!anime) {
      throw new Error('Anime not found');
    }

    // Check if already in user's list
    const existingEntry = await UserAnimeList.findOne({
      where: { userId, animeId },
    });

    if (existingEntry) {
      throw new Error('Anime already in your list');
    }

    // Add to list
    const userAnime = await UserAnimeList.create({
      userId,
      animeId,
      status: data.status || WatchStatus.PLAN_TO_WATCH,
      isFavorite: data.isFavorite || false,
      rating: data.rating,
      watchedEpisodes: data.watchedEpisodes || 0,
      notes: data.notes,
    });

    // Return with anime details
    return await UserAnimeList.findByPk(userAnime.id, {
      include: [{ model: Anime, as: 'anime' }],
    });
  }

  /**
   * Remove an anime from user's list
   */
  async removeAnimeFromUserList(userId: number, animeId: number) {
    const userAnime = await UserAnimeList.findOne({
      where: { userId, animeId },
    });

    if (!userAnime) {
      throw new Error('Anime not in your list');
    }

    await userAnime.destroy();
    return { message: 'Anime removed from your list' };
  }

  /**
   * Get user's anime list with optional filters
   */
  async getUserAnimeList(userId: number, options: GetUserAnimeListOptions = {}) {
    const {
      status,
      favorite,
      sortBy = 'addedAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 12,
      withPagination = false,
    } = options;

    const where: Record<string, unknown> = { userId };

    if (status) {
      where.status = status;
    }

    if (favorite !== undefined) {
      where.isFavorite = favorite;
    }

    if (!withPagination) {
      return await UserAnimeList.findAll({
        where,
        include: [{ model: Anime, as: 'anime' }],
        order: [[sortBy, sortOrder]],
      });
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await UserAnimeList.findAndCountAll({
      where,
      include: [{ model: Anime, as: 'anime' }],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    return {
      entries: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(count / limit)),
      },
    };

  }

  /**
   * Update user's anime entry
   */
  async updateUserAnime(userId: number, animeId: number, data: UpdateAnimeData) {
    const userAnime = await UserAnimeList.findOne({
      where: { userId, animeId },
    });

    if (!userAnime) {
      throw new Error('Anime not in your list');
    }

    // Update fields
    if (data.status !== undefined) {
      userAnime.status = data.status;
    }

    if (data.isFavorite !== undefined) {
      userAnime.isFavorite = data.isFavorite;
    }

    if (data.rating !== undefined) {
      userAnime.rating = data.rating;
    }

    if (data.watchedEpisodes !== undefined) {
      userAnime.watchedEpisodes = data.watchedEpisodes;
    }

    if (data.notes !== undefined) {
      userAnime.notes = data.notes;
    }

    await userAnime.save();

    // Return with anime details
    return await UserAnimeList.findByPk(userAnime.id, {
      include: [{ model: Anime, as: 'anime' }],
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId: number, animeId: number) {
    const userAnime = await UserAnimeList.findOne({
      where: { userId, animeId },
    });

    if (!userAnime) {
      throw new Error('Anime not in your list');
    }

    userAnime.isFavorite = !userAnime.isFavorite;
    await userAnime.save();

    return await UserAnimeList.findByPk(userAnime.id, {
      include: [{ model: Anime, as: 'anime' }],
    });
  }

  /**
   * Update rating
   */
  async updateRating(userId: number, animeId: number, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return await this.updateUserAnime(userId, animeId, { rating });
  }

  /**
   * Update watched episodes
   */
  async updateWatchedEpisodes(userId: number, animeId: number, watchedEpisodes: number) {
    if (watchedEpisodes < 0) {
      throw new Error('Watched episodes cannot be negative');
    }

    return await this.updateUserAnime(userId, animeId, { watchedEpisodes });
  }

  /**
   * Get anime entry for a specific user (check if in list)
   */
  async getUserAnimeEntry(userId: number, animeId: number) {
    return await UserAnimeList.findOne({
      where: { userId, animeId },
      include: [{ model: Anime, as: 'anime' }],
    });
  }
}

export default new AnimeService();
