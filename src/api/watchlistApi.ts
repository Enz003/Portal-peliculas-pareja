import type { CreateMovieInput, Movie, Stats, UpdatePerUserInput, User, UserId } from '../models/types';

export interface WatchlistSnapshot {
  users: User[];
  currentUserId: UserId;
  movies: Movie[];
}

export interface WatchlistApi {
  // Session / identity
  getSnapshot(): Promise<WatchlistSnapshot>;
  switchUser(): Promise<WatchlistSnapshot>;

  // Movies
  createMovie(input: CreateMovieInput): Promise<Movie>;
  updatePerUser(movieId: string, userId: string, patch: UpdatePerUserInput): Promise<Movie>;
  deleteMovie(movieId: string): Promise<void>;

  // Convenience
  statsFor(userId: UserId): Promise<Stats>;
}
