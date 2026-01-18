import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAppState, useFilteredMovies } from '../state/appState';

export function DashboardPage() {
  const { state, me, statsFor } = useAppState();
  const movies = useFilteredMovies();
  const [stats, setStats] = useState({ total: 0, fav: 0, seen: 0, seenPct: 0, tierS: 0 });

  useEffect(() => {
    statsFor(state.currentUserId).then(setStats).catch(() => {});
  }, [state.currentUserId, state.movies.length]);

  const recent = useMemo(() => {
    return [...movies].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  }, [movies]);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Hola ${me?.name ?? ''}. Resumen rápido de tu watchlist.`} />

      <div className="grid">
        <div className="card col-4">
          <h3>Total</h3>
          <div className="big">{stats.total}</div>
          <div className="sub">Películas en tu catálogo</div>
        </div>
        <div className="card col-4">
          <h3>Favoritas</h3>
          <div className="big">{stats.fav}</div>
          <div className="sub">Marcadas como favoritas</div>
        </div>
        <div className="card col-4">
          <h3>Vistas</h3>
          <div className="big">{stats.seenPct}%</div>
          <div className="sub">{stats.seen} vistas</div>
        </div>

        <div className="card col-12">
          <h3>Agregadas recientemente</h3>
          {recent.length ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {recent.map((m) => (
                <span key={m.id} className="badge">
                  {m.title}
                </span>
              ))}
            </div>
          ) : (
            <div className="badge muted">No hay películas aún</div>
          )}
        </div>
      </div>
    </div>
  );
}
