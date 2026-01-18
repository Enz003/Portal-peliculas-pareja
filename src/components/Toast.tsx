import React, { createContext, useContext, useMemo, useState } from 'react';

type ToastItem = { id: string; title: string; subtitle?: string };

type ToastCtx = {
  toast: (title: string, subtitle?: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

function randomId() {
  return Math.random().toString(16).slice(2, 9);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const api = useMemo<ToastCtx>(() => {
    return {
      toast: (title, subtitle) => {
        const id = randomId();
        const t: ToastItem = { id, title, subtitle };
        setItems((cur) => [...cur, t]);
        window.setTimeout(() => {
          setItems((cur) => cur.filter((x) => x.id !== id));
        }, 2800);
      },
    };
  }, []);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <div className="t-title">{t.title}</div>
            <div className="t-sub">{t.subtitle ?? ''}</div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
