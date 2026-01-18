import React, { useMemo, useState } from 'react';
import type { CreateMovieInput, Tier } from '../models/types';

export function AddMovieForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Partial<CreateMovieInput>;
  onCancel: () => void;
  onSubmit: (input: CreateMovieInput) => Promise<void> | void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [year, setYear] = useState<string>(initial?.year ? String(initial.year) : '');
  const [director, setDirector] = useState(initial?.director ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tier, setTier] = useState<Tier>((initial?.tier ?? '') as Tier);
  const [seen, setSeen] = useState(Boolean(initial?.seen));
  const [favorite, setFavorite] = useState(Boolean(initial?.favorite));
  const [submitting, setSubmitting] = useState(false);

  const valid = useMemo(() => title.trim().length > 0, [title]);

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        year: year.trim(),
        director: director.trim(),
        notes: notes.trim(),
        tier,
        favorite,
        seen,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid">
      <div className="col-8">
        <label>Título</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: The Prestige" />
      </div>
      <div className="col-4">
        <label>Año</label>
        <input className="input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ej: 2006" />
      </div>

      <div className="col-6">
        <label>Director</label>
        <input className="input" value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Ej: Christopher Nolan" />
      </div>
      <div className="col-6">
        <label>Tier (tu perfil)</label>
        <select value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
          <option value="">—</option>
          <option value="S">S</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
        </select>
      </div>

      <div className="col-12">
        <label>Notas</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contexto, recomendación, versión, etc." />
      </div>

      <div className="col-12">
        <label>Preferencias (tu perfil)</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className={`btn ${seen ? 'btn-primary' : ''}`} onClick={() => setSeen((x) => !x)}>
            {seen ? 'Vista' : 'Pendiente'}
          </button>
          <button type="button" className={`btn ${favorite ? 'btn-primary' : ''}`} onClick={() => setFavorite((x) => !x)}>
            {favorite ? 'Favorita' : 'No favorita'}
          </button>
        </div>
      </div>

      <div className="col-12" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" disabled={!valid || submitting} onClick={submit}>
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
