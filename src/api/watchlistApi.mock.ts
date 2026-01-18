import type { WatchlistApi, WatchlistSnapshot } from './watchlistApi';
import type { CreateMovieInput, Movie, Stats, Tier, UpdatePerUserInput, User, UserId } from '../models/types';

type Persisted = {
  users: User[];
  currentUserId: UserId;
  movies: Movie[];
};

const STORAGE_KEY = 'watchlist_portal_v2';

function nowMinusDays(days: number) {
  return Date.now() - 86400000 * days;
}

function seed(): Persisted {
  const users: User[] = [
    { id: 'u1', name: 'Enzo', initial: 'E' },
    { id: 'u2', name: 'Partner', initial: 'P' },
  ];

  const movies: Movie[] = [
    {
      id: 'm1',
      title: 'Dune',
      year: 2021,
      director: 'Denis Villeneuve',
      notes: 'IMAX recomendado',
      addedBy: 'u1',
      createdAt: nowMinusDays(6),
      shared: true,
      perUser: {
        u1: { seen: true, favorite: true, tier: 'A' },
        u2: { seen: false, favorite: false, tier: '' },
      },
    },
    {
      id: 'm2',
      title: 'The Dark Knight',
      year: 2008,
      director: 'Christopher Nolan',
      notes: '',
      addedBy: 'u2',
      createdAt: nowMinusDays(2),
      shared: true,
      perUser: {
        u1: { seen: false, favorite: false, tier: '' },
        u2: { seen: true, favorite: true, tier: 'S' },
      },
    },
  ];

  return { users, currentUserId: 'u1', movies };
}

function read(): Persisted {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seed();
  try {
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed.users?.length) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

function write(state: Persisted) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensurePerUser(users: User[], movie: Movie) {
  movie.perUser ||= {} as any;
  for (const u of users) {
    if (!movie.perUser[u.id]) movie.perUser[u.id] = { seen: false, favorite: false, tier: '' };
  }
}

function normalizeYear(y?: number | string | null): number | null {
  if (y == null || y === '') return null;
  const n = typeof y === 'number' ? y : Number(String(y).trim());
  return Number.isFinite(n) ? n : null;
}

function computeStats(users: User[], movies: Movie[], userId: UserId): Stats {
  let fav = 0;
  let seen = 0;
  let tierS = 0;

  for (const m of movies) {
    ensurePerUser(users, m);
    const pu = m.perUser[userId];
    if (pu.favorite) fav++;
    if (pu.seen) seen++;
    if (pu.tier === 'S') tierS++;
  }

  const total = movies.length;
  const seenPct = total ? Math.round((seen / total) * 100) : 0;
  return { total, fav, seen, seenPct, tierS };
}

function randomId(prefix: string) {
  return `${prefix}${Math.random().toString(16).slice(2, 9)}`;
}

export function createMockWatchlistApi(): WatchlistApi {
  return {
    async getSnapshot(): Promise<WatchlistSnapshot> {
      const s = read();
      return { users: s.users, currentUserId: s.currentUserId, movies: s.movies };
    },

    async switchUser(): Promise<WatchlistSnapshot> {
      const s = read();
      const next = s.currentUserId === 'u1' ? 'u2' : 'u1';
      const updated = { ...s, currentUserId: next };
      write(updated);
      return { users: updated.users, currentUserId: updated.currentUserId, movies: updated.movies };
    },

    async createMovie(input: CreateMovieInput): Promise<Movie> {
      const s = read();
      const id = randomId('m');
      const movie: Movie = {
        id,
        title: input.title.trim(),
        year: normalizeYear(input.year),
        director: (input.director ?? '').trim(),
        notes: (input.notes ?? '').trim(),
        addedBy: s.currentUserId,
        createdAt: Date.now(),
        shared: true,
        perUser: {} as any,
      };

      ensurePerUser(s.users, movie);

      // apply initial values for creator
      const tier = (input.tier ?? '') as Tier;
      movie.perUser[s.currentUserId] = {
        seen: Boolean(input.seen),
        favorite: Boolean(input.favorite),
        tier,
      };

      const movies = [movie, ...s.movies];
      const updated = { ...s, movies };
      write(updated);
      return movie;
    },

    async updatePerUser(movieId: string, userId: string, patch: UpdatePerUserInput): Promise<Movie> {
      const s = read();
      const idx = s.movies.findIndex((m) => m.id === movieId);
      if (idx < 0) throw new Error('Movie not found');

      const movie = { ...s.movies[idx] };
      ensurePerUser(s.users, movie);

      movie.perUser = { ...movie.perUser, [userId]: { ...movie.perUser[userId], ...patch } };

      const movies = s.movies.slice();
      movies[idx] = movie;
      write({ ...s, movies });
      return movie;
    },

    async deleteMovie(movieId: string): Promise<void> {
      const s = read();
      const movies = s.movies.filter((m) => m.id !== movieId);
      write({ ...s, movies });
    },

    async statsFor(userId: UserId): Promise<Stats> {
      const s = read();
      return computeStats(s.users, s.movies, userId);
    },
  };
}
