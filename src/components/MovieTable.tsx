import React from 'react';
import type { Movie, UserId } from '../models/types';

export function MovieTable({
  movies,
  userId,
  showOwner,
  showDelete,
  onToggleSeen,
  onToggleFav,
  onPickTier,
  onDelete,
  userNameById,
}: {
  movies: Movie[];
  userId: UserId;
  showOwner: boolean;
  showDelete: boolean;
  onToggleSeen: (movieId: string) => void;
  onToggleFav: (movieId: string) => void;
  onPickTier: (movieId: string) => void;
  onDelete?: (movieId: string) => void;
  userNameById: (userId: string) => string;
}) {
  return (
    <div className="table">
      <div className="table-header">
        <div>Título</div>
        <div>Vista</div>
        <div>Fav</div>
        <div>Tier</div>
        <div style={{ textAlign: 'right' }}>Acciones</div>
      </div>
      {movies.map((m) => (
        <MovieRow
          key={m.id}
          movie={m}
          userId={userId}
          showOwner={showOwner}
          showDelete={showDelete}
          onToggleSeen={onToggleSeen}
          onToggleFav={onToggleFav}
          onPickTier={onPickTier}
          onDelete={onDelete}
          userNameById={userNameById}
        />
      ))}
    </div>
  );
}

function MovieRow({
  movie,
  userId,
  showOwner,
  showDelete,
  onToggleSeen,
  onToggleFav,
  onPickTier,
  onDelete,
  userNameById,
}: {
  movie: Movie;
  userId: UserId;
  showOwner: boolean;
  showDelete: boolean;
  onToggleSeen: (movieId: string) => void;
  onToggleFav: (movieId: string) => void;
  onPickTier: (movieId: string) => void;
  onDelete?: (movieId: string) => void;
  userNameById: (userId: string) => string;
}) {
  const pu = movie.perUser[userId] || { seen: false, favorite: false, tier: '' };
  const addedByName = userNameById(movie.addedBy);

  const sub = [
    movie.year ? String(movie.year) : null,
    movie.director ? movie.director : null,
    showOwner ? `Agregó: ${addedByName}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="row">
      <div className="title">
        <strong>{movie.title}</strong>
        <div className="meta">{sub}</div>
      </div>

      <div data-label="Vista">
        {pu.seen ? <span className="badge ok">Vista</span> : <span className="badge muted">Pendiente</span>}
      </div>

      <div data-label="Fav">
        {pu.favorite ? <span className="badge warn">Favorita</span> : <span className="badge muted">—</span>}
      </div>

      <div data-label="Tier">
        {pu.tier ? <span className={`tier ${pu.tier}`}>{pu.tier}</span> : <span className="tier">—</span>}
      </div>

      <div className="actions">
        <button className="btn btn-small" onClick={() => onToggleSeen(movie.id)}>
          {pu.seen ? 'Marcar no vista' : 'Marcar vista'}
        </button>
        <button className="btn btn-small" onClick={() => onToggleFav(movie.id)}>
          {pu.favorite ? 'Quitar fav' : 'Favorita'}
        </button>
        <button className="btn btn-small" onClick={() => onPickTier(movie.id)}>
          Cambiar tier
        </button>
        {showDelete && (
          <button className="btn btn-small btn-danger" onClick={() => onDelete?.(movie.id)}>
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
