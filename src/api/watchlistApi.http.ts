import { createHttpClient } from './http';
import { endpoints } from './endpoints';
import type { WatchlistApi, WatchlistSnapshot } from './watchlistApi';
import type { CreateMovieInput, Movie, Stats, UpdatePerUserInput, UserId } from '../models/types';

/**
 * Implementación REAL.
 *
 * Conecta con tu backend. Si mañana movés el backend a otro repo, este es el único módulo
 * que debería saber URLs/endpoints.
 */
export function createHttpWatchlistApi(baseUrl: string): WatchlistApi {
  const http = createHttpClient({
    baseUrl,
    getAuthToken: () => localStorage.getItem('accessToken')
  });

  return {
    async getSnapshot(): Promise<WatchlistSnapshot> {
      return await http.get<WatchlistSnapshot>(endpoints.me);
    },

    async switchUser(): Promise<WatchlistSnapshot> {
      // Si tu auth no tiene "switch", podés eliminar este método.
      // Lo dejamos porque tu demo lo usa.
      return await http.post<WatchlistSnapshot>(`${endpoints.me}/switch`);
    },

    async createMovie(input: CreateMovieInput): Promise<Movie> {
      return await http.post<Movie>(endpoints.movies, input);
    },

    async updatePerUser(movieId: string, userId: string, patch: UpdatePerUserInput): Promise<Movie> {
      return await http.patch<Movie>(endpoints.moviePerUser(movieId, userId), patch);
    },

    async deleteMovie(movieId: string): Promise<void> {
      await http.del<void>(endpoints.movie(movieId));
    },

    async statsFor(userId: UserId): Promise<Stats> {
      return await http.get<Stats>(`${endpoints.users}/${userId}/stats`);
    },
  };
}
