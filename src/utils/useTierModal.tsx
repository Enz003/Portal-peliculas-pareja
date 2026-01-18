import React, { useMemo, useState } from 'react';
import type { Tier } from '../models/types';
import { Modal } from '../components/Modal';
import { TierPicker } from '../components/TierPicker';

export function useTierModal() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Tier>('');
  const [movieId, setMovieId] = useState<string | null>(null);
  const [onApply, setOnApply] = useState<((tier: Tier) => void) | null>(null);

  const ui = useMemo(() => {
    return (
      <Modal open={open} title="Elegir tier" onClose={() => setOpen(false)} footer={<div />}> 
        <TierPicker value={value} onChange={setValue} />
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onApply?.(value);
              setOpen(false);
            }}
          >
            Aplicar
          </button>
        </div>
      </Modal>
    );
  }, [open, value, onApply]);

  return {
    ui,
    openFor: (id: string, current: Tier, apply: (tier: Tier) => void) => {
      setMovieId(id);
      setValue(current);
      setOnApply(() => apply);
      setOpen(true);
    },
    selectedMovieId: movieId,
  };
}
