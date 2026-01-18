import type { WatchlistApi } from './watchlistApi';
import { createMockWatchlistApi } from './watchlistApi.mock';
import { createHttpWatchlistApi } from './watchlistApi.http';

/**
 * Si VITE_API_BASE_URL existe => usa backend real.
 * Si no existe => usa mock con localStorage (demo / offline).
 */
export function createApi(): WatchlistApi {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (baseUrl && baseUrl.trim()) return createHttpWatchlistApi(baseUrl.trim());
  return createMockWatchlistApi();
}
