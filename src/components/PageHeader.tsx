import React from 'react';

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="view-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle ?? ''}</p>
      </div>
      <div>{right}</div>
    </div>
  );
}
