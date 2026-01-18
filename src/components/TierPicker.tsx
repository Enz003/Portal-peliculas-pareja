import React from 'react';
import type { Tier } from '../models/types';

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', ''];

export function TierPicker({
  value,
  onChange,
}: {
  value: Tier;
  onChange: (tier: Tier) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {TIERS.map((t) => (
        <button
          key={t || '_none'}
          type="button"
          className={`btn ${value === t ? 'btn-primary' : ''}`}
          onClick={() => onChange(t)}
        >
          {t || '—'}
        </button>
      ))}
    </div>
  );
}
