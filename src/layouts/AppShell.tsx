import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../state/appState';
import { Modal } from '../components/Modal';
import { AddMovieForm } from '../components/AddMovieForm';
import { useToast } from '../components/Toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/shared', label: 'Lista compartida' },
  { to: '/movie/new', label: 'Agregar película' },
  { section: 'Personal' as const },
  { to: '/me/tier', label: 'Mi tierlist' },
  { to: '/me/favorites', label: 'Mis favoritas' },
  { section: 'Pareja' as const },
  { to: '/partner/tier', label: 'Tier de mi par' },
  { to: '/partner/favorites', label: 'Favoritas de mi par' },
  { section: 'Sistema' as const },
  { to: '/settings', label: 'Ajustes' },
];

export function AppShell() {
  const { state, me, setGlobalQuery, createMovie } = useAppState();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const avatar = useMemo(() => me?.initial ?? 'U', [me]);
  const profileName = useMemo(() => me?.name ?? 'Usuario', [me]);

  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    // If swipe left is more than 50px, close sidebar
    if (diff > 50) {
      setSidebarOpen(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  return (
    <div id="app" className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        id="sidebar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="brand">
          <div className="logo">WL</div>
          <div className="brand-text">
            <div className="brand-title">Watchlist</div>
            <div className="brand-subtitle">Shared portal</div>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-row">
            <div className="avatar" id="avatar">
              {avatar}
            </div>
            <div className="profile-meta">
              <div className="profile-name" id="profileName">
                {profileName}
              </div>
              <div className="profile-role">Cuenta personal</div>
            </div>
          </div>

          <div className="kpis">
            <Kpis />
          </div>

          <div className="quick-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((it, idx) => {
            if ('section' in it) {
              return (
                <div key={`s-${idx}`} className="nav-section">
                  {it.section}
                </div>
              );
            }
            return (
              <NavLink
                key={it.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                to={it.to}
                onClick={(e) => {
                  if (it.to === '/movie/new') {
                    e.preventDefault();
                    setAddOpen(true);
                  }
                }}
              >
                {it.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="muted">v2.0 • Version en desarrollo </div>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <button className="btn btn-ghost mobile-menu-btn" id="openSidebar" onClick={() => setSidebarOpen((v) => !v)}>
            ☰
          </button>

          <div className="search">
            <input
              id="globalSearch"
              placeholder="Buscar en tu catálogo..."
              value={state.globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
            />
          </div>

          <div className="topbar-actions">
            <button
              className="btn btn-primary"
              id="openAddModal"
              onClick={() => setAddOpen(true)}
            >
              + Agregar
            </button>
          </div>
        </header>

        <main className="content">
          {state.loading ? <div className="badge muted">Cargando...</div> : <Outlet />}
        </main>
      </section>

      <Modal
        open={addOpen}
        title="Agregar película"
        onClose={() => setAddOpen(false)}
        footer={<div className="badge muted">Se guarda usando el módulo API centralizado.</div>}
      >
        <AddMovieForm
          onCancel={() => setAddOpen(false)}
          onSubmit={async (input) => {
            await createMovie(input);
            setAddOpen(false);
            toast('Guardado', 'Película agregada');
            navigate('/shared');
          }}
        />
      </Modal>
    </div>
  );
}

function Kpis() {
  const { state, statsFor } = useAppState();
  const [fav, setFav] = useState(0);
  const [seenPct, setSeenPct] = useState(0);
  const [tierS, setTierS] = useState(0);

  useEffect(() => {
    let alive = true;
    statsFor(state.currentUserId).then((s) => {
      if (!alive) return;
      setFav(s.fav);
      setSeenPct(s.seenPct);
      setTierS(s.tierS);
    });
    return () => {
      alive = false;
    };
  }, [state.currentUserId, state.movies.length]);

  return (
    <>
      <div className="kpi">
        <div className="kpi-label">Favoritas</div>
        <div className="kpi-value" id="kpiFav">
          {fav}
        </div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Vistas</div>
        <div className="kpi-value" id="kpiSeen">
          {seenPct}%
        </div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Tier S</div>
        <div className="kpi-value" id="kpiTierS">
          {tierS}
        </div>
      </div>
    </>
  );
}
