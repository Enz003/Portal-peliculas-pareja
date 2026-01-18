import React from 'react';
import type { Movie, Tier, UserId } from '../models/types';

const LANES: Tier[] = ['S', 'A', 'B', 'C', 'D', ''];

function laneLabel(t: Tier) {
  return t ? `Tier ${t}` : 'Sin tier';
}

export function TierBoard({
  movies,
  userId,
  onPickTier,
  onToggleFav,
  onToggleSeen,
}: {
  movies: Movie[];
  userId: UserId;
  onPickTier: (movieId: string) => void;
  onToggleFav: (movieId: string) => void;
  onToggleSeen: (movieId: string) => void;
}) {
  const byLane: Record<string, Movie[]> = {};
  for (const t of LANES) byLane[t] = [];
  for (const m of movies) {
    const t = m.perUser[userId]?.tier || '';
    byLane[t].push(m);
  }

  return (
    <div className="tierboard">
      {LANES.map((t) => (
        <div key={t || '_none'} className="tier-lane">
          <div className="tier-lane-header">
            <div className="tier-lane-title">
              {t ? <span className={`tier ${t}`}>{t}</span> : <span className="tier">—</span>}
              <span>{laneLabel(t)}</span>
            </div>
            <span className="badge muted">{byLane[t].length}</span>
          </div>
          <div className="tier-lane-body">
            {byLane[t].length ? (
              byLane[t].map((m) => (
                <TierChip
                  key={m.id}
                  movie={m}
                  userId={userId}
                  onPickTier={onPickTier}
                  onToggleFav={onToggleFav}
                  onToggleSeen={onToggleSeen}
                />
              ))
            ) : (
              <div className="badge muted" style={{ justifyContent: 'center' }}>
                Vacío
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TierChip({
  movie,
  userId,
  onPickTier,
  onToggleFav,
  onToggleSeen,
}: {
  movie: Movie;
  userId: UserId;
  onPickTier: (movieId: string) => void;
  onToggleFav: (movieId: string) => void;
  onToggleSeen: (movieId: string) => void;
}) {
  const pu = movie.perUser[userId] || { seen: false, favorite: false };
  return (
    <div className="chip">
      <div style={{ minWidth: 0 }}>
        <strong title={movie.title}>{movie.title}</strong>
        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pu.favorite ? <span className="badge warn">Fav</span> : <span className="badge muted">—</span>}
          {pu.seen ? <span className="badge ok">Vista</span> : <span className="badge muted">Pend</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button className="btn btn-small" onClick={() => onPickTier(movie.id)}>
          Tier
        </button>
        <button className="btn btn-small" onClick={() => onToggleFav(movie.id)}>
          Fav
        </button>
        <button className="btn btn-small" onClick={() => onToggleSeen(movie.id)}>
          Vista
        </button>
      </div>
    </div>
  );
}
