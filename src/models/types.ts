export type UserId = string;
export type MovieId = string;

export interface User {
  id: UserId;
  name: string;
  initial: string;
}

export type Tier = '' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface MoviePerUser {
  seen: boolean;
  favorite: boolean;
  tier: Tier;
}

export interface Movie {
  id: MovieId;
  title: string;
  year: number | null;
  director: string;
  notes: string;
  addedBy: UserId;
  createdAt: number;
  shared: boolean;
  perUser: Record<UserId, MoviePerUser>;
}

export interface CreateMovieInput {
  title: string;
  year?: number | string | null;
  director?: string;
  notes?: string;
  tier?: Tier;
  favorite?: boolean;
  seen?: boolean;
}

export interface UpdatePerUserInput {
  seen?: boolean;
  favorite?: boolean;
  tier?: Tier;
}

export interface Stats {
  total: number;
  fav: number;
  seen: number;
  seenPct: number;
  tierS: number;
}
