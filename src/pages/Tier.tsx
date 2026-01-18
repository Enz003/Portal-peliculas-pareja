import React, { useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { TierBoard } from '../components/TierBoard';
import { useToast } from '../components/Toast';
import { useAppState, useFilteredMovies } from '../state/appState';
import { useTierModal } from '../utils/useTierModal';

function TierView({
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
  const { updatePerUser } = useAppState();
  const movies = useFilteredMovies();
  const { toast } = useToast();
  const tierModal = useTierModal();

  // ensure movies have perUser userId - mock does, backend should too
  // Update: allow defaults so new movies appear in 'No Tier' lane
  const ready = movies; // useMemo(() => movies.filter((m) => m.perUser[userId]), [movies, userId]);

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      {tierModal.ui}

      {ready.length ? (
        <TierBoard
          movies={ready}
          userId={userId}
          onPickTier={(movieId) => {
            if (!allowEdit) return;
            const m = ready.find((x) => x.id === movieId)!;
            tierModal.openFor(movieId, m.perUser[userId].tier, async (tier) => {
              await updatePerUser(movieId, userId, { tier });
              toast('Tier actualizado');
            });
          }}
          onToggleFav={async (movieId) => {
            if (!allowEdit) return;
            const m = ready.find((x) => x.id === movieId)!;
            const cur = m.perUser[userId].favorite;
            await updatePerUser(movieId, userId, { favorite: !cur });
          }}
          onToggleSeen={async (movieId) => {
            if (!allowEdit) return;
            const m = ready.find((x) => x.id === movieId)!;
            const cur = m.perUser[userId].seen;
            await updatePerUser(movieId, userId, { seen: !cur });
          }}
        />
      ) : (
        <div className="badge muted">No hay datos</div>
      )}
    </div>
  );
}

export function MyTierPage() {
  const { state } = useAppState();
  return <TierView userId={state.currentUserId} title="Mi tierlist" subtitle="Tu clasificación" allowEdit={true} />;
}

export function PartnerTierPage() {
  const { partnerUserId, partner } = useAppState();
  return (
    <TierView
      userId={partnerUserId}
      title="Tier de mi pareja"
      subtitle={`Clasificación de ${partner?.name ?? 'tu pareja'}`}
      allowEdit={false}
    />
  );
}
