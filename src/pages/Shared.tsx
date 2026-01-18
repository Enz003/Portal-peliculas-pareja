import React from 'react';
import { MovieTable } from '../components/MovieTable';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAppState, useFilteredMovies } from '../state/appState';
import { useTierModal } from '../utils/useTierModal';

export function SharedPage() {
  const { state, updatePerUser, deleteMovie } = useAppState();
  const movies = useFilteredMovies();
  const { toast } = useToast();
  const tierModal = useTierModal();

  const userNameById = (id: string) => state.users.find((u) => u.id === id)?.name || id;

  return (
    <div>
      <PageHeader title="Lista compartida" subtitle="Vas a ver todas las películas. La búsqueda global filtra aquí también." />

      {tierModal.ui}

      {movies.length ? (
        <MovieTable
          movies={movies}
          userId={state.currentUserId}
          showOwner={true}
          showDelete={true}
          userNameById={userNameById}
          onToggleSeen={async (movieId) => {
            const m = movies.find((x) => x.id === movieId)!;
            const cur = m.perUser[state.currentUserId]?.seen ?? false;
            await updatePerUser(movieId, state.currentUserId, { seen: !cur });
          }}
          onToggleFav={async (movieId) => {
            const m = movies.find((x) => x.id === movieId)!;
            const cur = m.perUser[state.currentUserId]?.favorite ?? false;
            await updatePerUser(movieId, state.currentUserId, { favorite: !cur });
          }}
          onPickTier={(movieId) => {
            const m = movies.find((x) => x.id === movieId)!;
            const curTier = m.perUser[state.currentUserId]?.tier || '';
            tierModal.openFor(movieId, curTier, async (tier) => {
              await updatePerUser(movieId, state.currentUserId, { tier });
              toast('Tier actualizado');
            });
          }}
          onDelete={async (movieId) => {
            await deleteMovie(movieId);
            toast('Eliminado');
          }}
        />
      ) : (
        <div className="badge muted">No hay resultados</div>
      )}
    </div>
  );
}
