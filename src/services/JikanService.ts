import axios from 'axios';

export class JikanService {
  private static BASE_URL = 'https://api.jikan.moe/v4';

  static async searchAnime(title: string) {
    const response = await axios.get(`${this.BASE_URL}/anime`, {
      params: { q: title, limit: 10 },
    });
    return response.data;
  }

  static async getAnimeById(id: number) {
    const response = await axios.get(`${this.BASE_URL}/anime/${id}`);
    return response.data;
  }

  static async getTopAnime() {
    const response = await axios.get(`${this.BASE_URL}/top/anime`, {
      params: { limit: 10 },
    });
    return response.data;
  }

  static async getRecentAnimeRecommendations() {
    const response = await axios.get(`${this.BASE_URL}/recommendations/anime`, {
      params: { limit: 10 },
    });
    return response.data;
  }

  static async getRandomAnime() {
    const response = await axios.get(`${this.BASE_URL}/random/anime`);
    return response.data;
  }
}

export default JikanService;
