import React, { useMemo } from 'react';
import { MovieTable } from '../components/MovieTable';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAppState, useFilteredMovies } from '../state/appState';
import { useTierModal } from '../utils/useTierModal';

function FavoritesView({
  userId,
  title,
  subtitle,
  allowEdit,
}: {
  userId: string;
  title: string;
  subtitle: string;
  allowEdit: boolean;
}) {
  const { state, updatePerUser } = useAppState();
  const allMovies = useFilteredMovies();
  const { toast } = useToast();
  const tierModal = useTierModal();

  const movies = useMemo(() => allMovies.filter((m) => m.perUser[userId]?.favorite), [allMovies, userId]);
  const userNameById = (id: string) => state.users.find((u) => u.id === id)?.name || id;

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      {tierModal.ui}

      {movies.length ? (
        <MovieTable
          movies={movies}
          userId={userId}
          showOwner={false}
          showDelete={false}
          userNameById={userNameById}
          onToggleSeen={async (movieId) => {
            if (!allowEdit) return;
            const m = movies.find((x) => x.id === movieId)!;
            const cur = m.perUser[userId]?.seen ?? false;
            await updatePerUser(movieId, userId, { seen: !cur });
          }}
          onToggleFav={async (movieId) => {
            if (!allowEdit) return;
            const m = movies.find((x) => x.id === movieId)!;
            const cur = m.perUser[userId]?.favorite ?? false;
            await updatePerUser(movieId, userId, { favorite: !cur });
          }}
          onPickTier={(movieId) => {
            if (!allowEdit) return;
            const m = movies.find((x) => x.id === movieId)!;
            const curTier = m.perUser[userId]?.tier || '';
            tierModal.openFor(movieId, curTier, async (tier) => {
              await updatePerUser(movieId, userId, { tier });
              toast('Tier actualizado');
            });
          }}
        />
      ) : (
        <div className="badge muted">No hay favoritas</div>
      )}
    </div>
  );
}

export function MyFavoritesPage() {
  const { state } = useAppState();
  return (
    <FavoritesView
      userId={state.currentUserId}
      title="Mis favoritas"
      subtitle="Marcadas como favoritas para tu perfil"
      allowEdit={true}
    />
  );
}

export function PartnerFavoritesPage() {
  const { partnerUserId, partner } = useAppState();
  return (
    <FavoritesView
      userId={partnerUserId}
      title="Favoritas de mi pareja"
      subtitle={`Marcadas como favoritas para ${partner?.name ?? 'tu pareja'}`}
      allowEdit={false}
    />
  );
}
