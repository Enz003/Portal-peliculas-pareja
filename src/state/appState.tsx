import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { createApi } from '../api';
import type { Movie, MovieId, Stats, User, UserId } from '../models/types';

type State = {
  loading: boolean;
  users: User[];
  currentUserId: UserId;
  movies: Movie[];
  globalQuery: string;
};

type Action =
  | { type: 'INIT_START' }
  | { type: 'INIT_OK'; payload: { users: User[]; currentUserId: UserId; movies: Movie[] } }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_SNAPSHOT'; payload: { users: User[]; currentUserId: UserId; movies: Movie[] } }
  | { type: 'UPSERT_MOVIE'; payload: Movie }
  | { type: 'REMOVE_MOVIE'; payload: { movieId: MovieId } };

const initialState: State = {
  loading: true,
  users: [],
  currentUserId: 'u1',
  movies: [],
  globalQuery: '',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, loading: true };
    case 'INIT_OK':
      return { ...state, loading: false, ...action.payload };
    case 'SET_QUERY':
      return { ...state, globalQuery: action.payload };
    case 'SET_SNAPSHOT':
      return { ...state, ...action.payload };
    case 'UPSERT_MOVIE': {
      const idx = state.movies.findIndex((m) => m.id === action.payload.id);
      if (idx < 0) return { ...state, movies: [action.payload, ...state.movies] };
      const next = state.movies.slice();
      next[idx] = action.payload;
      return { ...state, movies: next };
    }
    case 'REMOVE_MOVIE':
      return { ...state, movies: state.movies.filter((m) => m.id !== action.payload.movieId) };
    default:
      return state;
  }
}

type Ctx = {
  state: State;
  api: ReturnType<typeof createApi>;
  me: User | undefined;
  partner: User | undefined;
  partnerUserId: UserId;
  init: () => Promise<void>;
  setGlobalQuery: (q: string) => void;
  switchUser: () => Promise<void>;
  createMovie: (input: any) => Promise<void>;
  updatePerUser: (movieId: string, userId: string, patch: any) => Promise<void>;
  deleteMovie: (movieId: string) => Promise<void>;
  statsFor: (userId: UserId) => Promise<Stats>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const api = useMemo(() => createApi(), []);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Encontrar al otro usuario (partner) - el que NO sea yo
  const me = state.users.find((u) => u.id === state.currentUserId);
  const partner = state.users.find((u) => u.id !== state.currentUserId);
  const partnerUserId = partner?.id || state.currentUserId; // Fallback a mi mismo si no hay partner

  async function init() {
    dispatch({ type: 'INIT_START' });
    try {
      const snap = await api.getSnapshot();
      dispatch({ type: 'INIT_OK', payload: snap });
    } catch (err) {
      console.error('Init failed', err);
      // Si falla (ej 401), redirigir a login si no estamos ya ahi
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
  }

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: Ctx = {
    state,
    api,
    me,
    partner,
    partnerUserId,

    init,
    setGlobalQuery: (q) => dispatch({ type: 'SET_QUERY', payload: q }),

    switchUser: async () => {
      const snap = await api.switchUser();
      dispatch({ type: 'SET_SNAPSHOT', payload: snap });
    },

    createMovie: async (input) => {
      const movie = await api.createMovie(input);
      dispatch({ type: 'UPSERT_MOVIE', payload: movie });
    },

    updatePerUser: async (movieId, userId, patch) => {
      const movie = await api.updatePerUser(movieId, userId, patch);
      dispatch({ type: 'UPSERT_MOVIE', payload: movie });
    },

    deleteMovie: async (movieId) => {
      await api.deleteMovie(movieId);
      dispatch({ type: 'REMOVE_MOVIE', payload: { movieId } });
    },

    statsFor: (userId) => api.statsFor(userId),
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}

export function useFilteredMovies(): Movie[] {
  const {
    state: { movies, globalQuery },
  } = useAppState();

  const q = globalQuery.trim().toLowerCase();
  if (!q) return movies;

  return movies.filter((m) => {
    const hay = [m.title, m.director, m.notes, String(m.year ?? '')].join(' ').toLowerCase();
    return hay.includes(q);
  });
}
