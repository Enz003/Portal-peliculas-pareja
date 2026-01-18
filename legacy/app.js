/**
 * Watchlist Portal (frontend-only)
 * - SPA hash router
 * - 2 usuarios (demo)
 * - Lista compartida + favoritos y tier personal por usuario
 * - Vista de pareja (perfil espejo)
 * - Modal agregar
 * - Búsqueda global
 *
 * Backend: reemplazar store.* por fetch() a tu API
 */

const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

/* ---------------------------
   Demo data / Store
--------------------------- */

const store = {
  users: [
    { id: "u1", name: "Enzo", initial: "E" },
    { id: "u2", name: "Partner", initial: "P" },
  ],
  currentUserId: "u1",
  partnerUserId() {
    return this.currentUserId === "u1" ? "u2" : "u1";
  },

  // shared movies
  movies: [
    {
      id: "m1",
      title: "Dune",
      year: 2021,
      director: "Denis Villeneuve",
      notes: "IMAX recomendado",
      addedBy: "u1",
      createdAt: Date.now() - 86400000 * 6,
      // shared flag
      shared: true,
      // per-user fields
      perUser: {
        u1: { seen: true, favorite: true, tier: "A" },
        u2: { seen: false, favorite: false, tier: "" },
      },
    },
    {
      id: "m2",
      title: "The Dark Knight",
      year: 2008,
      director: "Christopher Nolan",
      notes: "",
      addedBy: "u2",
      createdAt: Date.now() - 86400000 * 2,
      shared: true,
      perUser: {
        u1: { seen: false, favorite: false, tier: "" },
        u2: { seen: true, favorite: true, tier: "S" },
      },
    },
  ],

  get me() {
    return this.users.find((u) => u.id === this.currentUserId);
  },
  get partner() {
    return this.users.find((u) => u.id === this.partnerUserId());
  },

  ensurePerUser(movie) {
    if (!movie.perUser) movie.perUser = {};
    for (const u of this.users) {
      if (!movie.perUser[u.id]) movie.perUser[u.id] = { seen: false, favorite: false, tier: "" };
    }
  },

  createMovie(payload) {
    const id = "m" + Math.random().toString(16).slice(2, 9);
    const m = {
      id,
      title: payload.title.trim(),
      year: payload.year ? Number(payload.year) : null,
      director: payload.director?.trim() || "",
      notes: payload.notes?.trim() || "",
      addedBy: this.currentUserId,
      createdAt: Date.now(),
      shared: true,
      perUser: {},
    };
    this.ensurePerUser(m);

    // apply initial per-user values for creator
    m.perUser[this.currentUserId].tier = payload.tier || "";
    m.perUser[this.currentUserId].favorite = !!payload.favorite;
    m.perUser[this.currentUserId].seen = !!payload.seen;

    this.movies.unshift(m);
    return m;
  },

  updateMovie(id, updater) {
    const m = this.movies.find((x) => x.id === id);
    if (!m) return null;
    this.ensurePerUser(m);
    updater(m);
    return m;
  },

  deleteMovie(id) {
    const idx = this.movies.findIndex((x) => x.id === id);
    if (idx >= 0) this.movies.splice(idx, 1);
  },

  statsFor(userId) {
    const all = this.movies.slice();
    const total = all.length;
    let fav = 0, seen = 0, tierS = 0;
    for (const m of all) {
      this.ensurePerUser(m);
      const pu = m.perUser[userId];
      if (pu.favorite) fav++;
      if (pu.seen) seen++;
      if (pu.tier === "S") tierS++;
    }
    const seenPct = total ? Math.round((seen / total) * 100) : 0;
    return { total, fav, seen, seenPct, tierS };
  },
};

/* ---------------------------
   UI Elements
--------------------------- */

const els = {
  view: $("#view"),
  navItems: $$(".nav-item"),
  globalSearch: $("#globalSearch"),

  avatar: $("#avatar"),
  profileName: $("#profileName"),
  kpiFav: $("#kpiFav"),
  kpiSeen: $("#kpiSeen"),
  kpiTierS: $("#kpiTierS"),

  btnSwitchUser: $("#btnSwitchUser"),
  openAddModal: $("#openAddModal"),

  modalBackdrop: $("#modalBackdrop"),
  modalTitle: $("#modalTitle"),
  modalBody: $("#modalBody"),
  modalFooter: $("#modalFooter"),
  closeModal: $("#closeModal"),
};

function mountToasts() {
  if ($("#toastWrap")) return;
  const wrap = document.createElement("div");
  wrap.className = "toast-wrap";
  wrap.id = "toastWrap";
  document.body.appendChild(wrap);
}
function toast(title, subtitle = "") {
  mountToasts();
  const wrap = $("#toastWrap");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<div class="t-title">${escapeHtml(title)}</div><div class="t-sub">${escapeHtml(subtitle)}</div>`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------
   Router
--------------------------- */

const routes = {
  "/dashboard": renderDashboard,
  "/shared": renderSharedList,
  "/movie/new": renderAddMoviePage,
  "/me/tier": () => renderTierView(store.currentUserId, "Mi tierlist"),
  "/me/favorites": () => renderFavoritesView(store.currentUserId, "Mis favoritas"),
  "/partner/tier": () => renderTierView(store.partnerUserId(), "Tier de mi pareja"),
  "/partner/favorites": () => renderFavoritesView(store.partnerUserId(), "Favoritas de mi pareja"),
  "/settings": renderSettings,
};

function getRoute() {
  const h = location.hash || "#/dashboard";
  const path = h.replace(/^#/, "");
  return routes[path] ? path : "/dashboard";
}

function navigate(path) {
  location.hash = "#" + path;
}

function setActiveNav(path) {
  els.navItems.forEach((a) => {
    const route = a.getAttribute("href")?.replace("#", "");
    a.classList.toggle("active", route === path);
  });
}

function render() {
  const path = getRoute();
  setActiveNav(path);
  routes[path]();
  syncSidebar();
}

/* ---------------------------
   Sidebar Sync
--------------------------- */

function syncSidebar() {
  const me = store.me;
  els.avatar.textContent = me.initial;
  els.profileName.textContent = me.name;

  const st = store.statsFor(me.id);
  els.kpiFav.textContent = String(st.fav);
  els.kpiSeen.textContent = String(st.seenPct) + "%";
  els.kpiTierS.textContent = String(st.tierS);
}

/* ---------------------------
   Global Search (client-side)
--------------------------- */

let globalQuery = "";
els.globalSearch.addEventListener("input", (e) => {
  globalQuery = e.target.value.trim().toLowerCase();
  // re-render current view with filter applied
  render();
});

/* ---------------------------
   Modal Helpers
--------------------------- */

function openModal(title, bodyHtml, footerHtml) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHtml;
  els.modalFooter.innerHTML = footerHtml || "";
  els.modalBackdrop.classList.remove("hidden");
}
function closeModal() {
  els.modalBackdrop.classList.add("hidden");
  els.modalBody.innerHTML = "";
  els.modalFooter.innerHTML = "";
}
els.closeModal.addEventListener("click", closeModal);
els.modalBackdrop.addEventListener("click", (e) => {
  if (e.target === els.modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ---------------------------
   Actions: switch user (demo)
--------------------------- */

els.btnSwitchUser.addEventListener("click", () => {
  store.currentUserId = store.partnerUserId(); // swap
  toast("Usuario cambiado", `Ahora estás como: ${store.me.name}`);
  render();
});

/* ---------------------------
   Add Modal button
--------------------------- */

els.openAddModal.addEventListener("click", () => {
  openAddMovieModal();
});

/* ---------------------------
   Components
--------------------------- */

function pageHeader(title, subtitle, rightHtml = "") {
  return `
    <div class="view-title">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(subtitle || "")}</p>
      </div>
      <div>${rightHtml || ""}</div>
    </div>
  `;
}

function renderTable(movies, opts = {}) {
  const { userId = store.currentUserId, showOwner = true, context = "shared" } = opts;

  const header = `
    <div class="table">
      <div class="table-header">
        <div>Título</div>
        <div>Vista</div>
        <div>Fav</div>
        <div>Tier</div>
        <div style="text-align:right">Acciones</div>
      </div>
      ${movies.map((m) => renderRow(m, { userId, showOwner, context })).join("")}
    </div>
  `;
  return header;
}

function renderRow(movie, { userId, showOwner, context }) {
  store.ensurePerUser(movie);
  const pu = movie.perUser[userId];
  const addedByName = store.users.find((u) => u.id === movie.addedBy)?.name || "—";
  const seenBadge = pu.seen ? `<span class="badge ok">Vista</span>` : `<span class="badge muted">Pendiente</span>`;
  const favBadge = pu.favorite ? `<span class="badge warn">Favorita</span>` : `<span class="badge muted">—</span>`;
  const tier = pu.tier || "";
  const tierHtml = tier ? `<span class="tier ${tier}">${tier}</span>` : `<span class="tier">—</span>`;

  const sub = [
    movie.year ? String(movie.year) : null,
    movie.director ? movie.director : null,
    showOwner ? `Agregó: ${addedByName}` : null,
  ].filter(Boolean).join(" • ");

  // action buttons: per-user toggles
  const actions = `
    <div class="actions">
      <button class="btn btn-small" data-act="seen" data-id="${movie.id}" data-user="${userId}">
        ${pu.seen ? "Marcar no vista" : "Marcar vista"}
      </button>
      <button class="btn btn-small" data-act="fav" data-id="${movie.id}" data-user="${userId}">
        ${pu.favorite ? "Quitar fav" : "Favorita"}
      </button>
      <button class="btn btn-small" data-act="tier" data-id="${movie.id}" data-user="${userId}">
        Cambiar tier
      </button>
      ${
        context === "shared"
          ? `<button class="btn btn-small btn-danger" data-act="delete" data-id="${movie.id}">Eliminar</button>`
          : ""
      }
    </div>
  `;

  return `
    <div class="row">
      <div class="title">
        <strong>${escapeHtml(movie.title)}</strong>
        <div class="meta">${escapeHtml(sub)}</div>
      </div>
      <div>${seenBadge}</div>
      <div>${favBadge}</div>
      <div>${tierHtml}</div>
      <div>${actions}</div>
    </div>
  `;
}

function attachTableHandlers() {
  // delegated handlers in view
  els.view.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;
    const id = btn.dataset.id;
    const userId = btn.dataset.user;

    if (act === "seen") {
      store.updateMovie(id, (m) => {
        m.perUser[userId].seen = !m.perUser[userId].seen;
      });
      toast("Estado actualizado", "Marcado de vista actualizado.");
      render();
    }

    if (act === "fav") {
      store.updateMovie(id, (m) => {
        m.perUser[userId].favorite = !m.perUser[userId].favorite;
      });
      toast("Favoritas", "Se actualizó tu lista de favoritas.");
      render();
    }

    if (act === "tier") {
      openTierPicker(id, userId);
    }

    if (act === "delete") {
      openModal(
        "Eliminar película",
        `<p class="sub" style="color: var(--muted); margin-top:0">
          Esto borra la película de la lista compartida (no solo de tu perfil).
        </p>`,
        `
          <button class="btn btn-ghost" id="cancelDel">Cancelar</button>
          <button class="btn btn-danger" id="confirmDel">Eliminar</button>
        `
      );
      $("#cancelDel").addEventListener("click", closeModal);
      $("#confirmDel").addEventListener("click", () => {
        store.deleteMovie(id);
        closeModal();
        toast("Eliminada", "Se quitó de la lista compartida.");
        render();
      });
    }
  }, { once: true }); // attach once per render call
}

/* ---------------------------
   Views
--------------------------- */

function filterByGlobalQuery(movies) {
  if (!globalQuery) return movies;
  return movies.filter((m) => {
    const hay = [
      m.title,
      m.director,
      m.notes,
      String(m.year || ""),
    ].join(" ").toLowerCase();
    return hay.includes(globalQuery);
  });
}

function renderDashboard() {
  const meId = store.currentUserId;
  const partnerId = store.partnerUserId();

  const all = filterByGlobalQuery(store.movies);
  const me = store.statsFor(meId);
  const partner = store.statsFor(partnerId);

  const meTop = topTierTitles(meId);
  const partnerTop = topTierTitles(partnerId);

  els.view.innerHTML = `
    ${pageHeader(
      "Dashboard",
      "Resumen rápido de tu catálogo compartido y preferencias individuales.",
      `<button class="btn btn-primary" id="dashAdd">+ Agregar película</button>`
    )}

    <div class="grid">
      <div class="card col-4">
        <h3>Catálogo compartido</h3>
        <div class="big">${all.length}</div>
        <div class="sub">Películas registradas</div>
      </div>

      <div class="card col-4">
        <h3>${escapeHtml(store.me.name)} • Vistas</h3>
        <div class="big">${me.seenPct}%</div>
        <div class="sub">${me.seen} vistas • ${me.fav} favoritas</div>
      </div>

      <div class="card col-4">
        <h3>${escapeHtml(store.partner.name)} • Vistas</h3>
        <div class="big">${partner.seenPct}%</div>
        <div class="sub">${partner.seen} vistas • ${partner.fav} favoritas</div>
      </div>

      <div class="card col-6">
        <h3>${escapeHtml(store.me.name)} • Top tiers</h3>
        ${renderMiniList(meTop, "No tenés tiers aún.")}
      </div>

      <div class="card col-6">
        <h3>${escapeHtml(store.partner.name)} • Top tiers</h3>
        ${renderMiniList(partnerTop, "Tu pareja aún no asignó tiers.")}
      </div>

      <div class="card col-12">
        <h3>Acciones rápidas</h3>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" id="goShared">Ir a lista compartida</button>
          <button class="btn" id="goMyTier">Mi tierlist</button>
          <button class="btn" id="goMyFavs">Mis favoritas</button>
          <button class="btn btn-ghost" id="goSettings">Ajustes</button>
        </div>
      </div>
    </div>
  `;

  $("#dashAdd").addEventListener("click", openAddMovieModal);
  $("#goShared").addEventListener("click", () => navigate("/shared"));
  $("#goMyTier").addEventListener("click", () => navigate("/me/tier"));
  $("#goMyFavs").addEventListener("click", () => navigate("/me/favorites"));
  $("#goSettings").addEventListener("click", () => navigate("/settings"));
}

function renderSharedList() {
  const movies = filterByGlobalQuery(store.movies);

  els.view.innerHTML = `
    ${pageHeader(
      "Lista compartida",
      "Todo lo agregado al catálogo. Cada usuario tiene su visto/favorito/tier independiente.",
      `<button class="btn btn-primary" id="addShared">+ Agregar</button>`
    )}
    ${renderTable(movies, { userId: store.currentUserId, showOwner: true, context: "shared" })}
  `;

  $("#addShared").addEventListener("click", openAddMovieModal);
  attachTableHandlers();
}

function renderAddMoviePage() {
  els.view.innerHTML = `
    ${pageHeader(
      "Agregar película",
      "Cargá una película al catálogo compartido. Podés marcarla como vista/favorita y asignarle un tier para tu perfil."
    )}

    <div class="card">
      <div class="grid">
        <div class="col-6">
          <label>Título</label>
          <input class="input" id="fTitle" placeholder="Ej: Blade Runner 2049" />
        </div>
        <div class="col-3">
          <label>Año (opcional)</label>
          <input class="input" id="fYear" placeholder="Ej: 2017" />
        </div>
        <div class="col-3">
          <label>Tier inicial (tu perfil)</label>
          <select id="fTier">
            <option value="">—</option>
            <option>S</option><option>A</option><option>B</option><option>C</option><option>D</option>
          </select>
        </div>

        <div class="col-6">
          <label>Director (opcional)</label>
          <input class="input" id="fDirector" placeholder="Ej: Denis Villeneuve" />
        </div>

        <div class="col-6">
          <label>Notas (opcional)</label>
          <textarea id="fNotes" placeholder="Por qué la agregaste, versión recomendada, etc."></textarea>
        </div>

        <div class="col-6">
          <label>Preferencias iniciales (tu perfil)</label>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn" id="fSeen">Pendiente</button>
            <button class="btn" id="fFav">No favorita</button>
          </div>
          <p class="sub" style="color:var(--muted); margin:10px 0 0;">
            Esto solo afecta tu perfil. Tu pareja decide lo suyo.
          </p>
        </div>

        <div class="col-12" style="display:flex; justify-content:flex-end; gap:10px;">
          <button class="btn btn-ghost" id="goBack">Cancelar</button>
          <button class="btn btn-primary" id="saveMovie">Guardar</button>
        </div>
      </div>
    </div>
  `;

  let seen = false;
  let fav = false;

  const sync = () => {
    $("#fSeen").textContent = seen ? "Vista" : "Pendiente";
    $("#fSeen").classList.toggle("btn-primary", seen);

    $("#fFav").textContent = fav ? "Favorita" : "No favorita";
    $("#fFav").classList.toggle("btn-primary", fav);
  };
  sync();

  $("#fSeen").addEventListener("click", () => { seen = !seen; sync(); });
  $("#fFav").addEventListener("click", () => { fav = !fav; sync(); });

  $("#goBack").addEventListener("click", () => navigate("/shared"));
  $("#saveMovie").addEventListener("click", () => {
    const title = $("#fTitle").value.trim();
    if (!title) return toast("Falta título", "Escribí el nombre de la película.");

    store.createMovie({
      title,
      year: $("#fYear").value.trim(),
      director: $("#fDirector").value.trim(),
      notes: $("#fNotes").value.trim(),
      tier: $("#fTier").value,
      favorite: fav,
      seen,
    });

    toast("Agregada", "Se cargó en la lista compartida.");
    navigate("/shared");
  });
}

function renderFavoritesView(userId, title) {
  const movies = filterByGlobalQuery(store.movies).filter((m) => {
    store.ensurePerUser(m);
    return m.perUser[userId].favorite;
  });

  const subtitle =
    userId === store.currentUserId
      ? "Tus favoritas (solo tu perfil)."
      : "Favoritas de tu pareja (solo su perfil).";

  els.view.innerHTML = `
    ${pageHeader(title, subtitle, `<button class="btn btn-primary" id="addFavs">+ Agregar</button>`)}
    ${movies.length ? renderTable(movies, { userId, showOwner: true, context: "personal" }) : emptyState("No hay favoritas todavía.", "Agregá películas y marcá tus favoritas.")}
  `;

  $("#addFavs")?.addEventListener("click", openAddMovieModal);
  if (movies.length) attachTableHandlers();
}

function renderTierView(userId, title) {
  const subtitle =
    userId === store.currentUserId
      ? "Tu tierlist personal. Cambiá tiers sin afectar el perfil de tu pareja."
      : "Tierlist de tu pareja (solo lectura, salvo que cambies a su usuario en modo demo).";

  // lanes
  const lanes = ["S", "A", "B", "C", "D", ""];
  const laneLabel = (t) => (t ? `Tier ${t}` : "Sin tier");

  const filtered = filterByGlobalQuery(store.movies);
  for (const m of filtered) store.ensurePerUser(m);

  const byLane = {};
  for (const t of lanes) byLane[t] = [];
  for (const m of filtered) {
    const t = m.perUser[userId].tier || "";
    byLane[t].push(m);
  }

  els.view.innerHTML = `
    ${pageHeader(title, subtitle, `<button class="btn btn-primary" id="addTier">+ Agregar</button>`)}
    <div class="tierboard">
      ${lanes.map((t) => `
        <div class="tier-lane">
          <div class="tier-lane-header">
            <div class="tier-lane-title">
              ${t ? `<span class="tier ${t}">${t}</span>` : `<span class="tier">—</span>`}
              <span>${escapeHtml(laneLabel(t))}</span>
            </div>
            <span class="badge muted">${byLane[t].length}</span>
          </div>
          <div class="tier-lane-body">
            ${
              byLane[t].length
                ? byLane[t].map((m) => tierChip(m, userId)).join("")
                : `<div class="badge muted" style="justify-content:center;">Vacío</div>`
            }
          </div>
        </div>
      `).join("")}
    </div>
  `;

  $("#addTier").addEventListener("click", openAddMovieModal);

  // chip handlers (tier / fav / seen quick)
  els.view.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;
    const id = btn.dataset.id;
    const uid = btn.dataset.user;

    if (act === "tier") openTierPicker(id, uid);
    if (act === "fav") {
      store.updateMovie(id, (m) => (m.perUser[uid].favorite = !m.perUser[uid].favorite));
      render();
    }
    if (act === "seen") {
      store.updateMovie(id, (m) => (m.perUser[uid].seen = !m.perUser[uid].seen));
      render();
    }
  });
}

function tierChip(m, userId) {
  const pu = m.perUser[userId];
  const flags = [
    pu.favorite ? `<span class="badge warn">Fav</span>` : `<span class="badge muted">—</span>`,
    pu.seen ? `<span class="badge ok">Vista</span>` : `<span class="badge muted">Pend</span>`,
  ].join(" ");

  return `
    <div class="chip">
      <div style="min-width:0">
        <strong title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</strong>
        <div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap;">${flags}</div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
        <button class="btn btn-small" data-act="tier" data-id="${m.id}" data-user="${userId}">Tier</button>
        <button class="btn btn-small" data-act="fav" data-id="${m.id}" data-user="${userId}">Fav</button>
        <button class="btn btn-small" data-act="seen" data-id="${m.id}" data-user="${userId}">Vista</button>
      </div>
    </div>
  `;
}

function renderSettings() {
  els.view.innerHTML = `
    ${pageHeader("Ajustes", "Preferencias del portal (demo). En tu backend esto se guarda por usuario.")}

    <div class="grid">
      <div class="card col-6">
        <h3>Modo demo</h3>
        <p class="sub" style="color:var(--muted); margin:0 0 12px;">
          Cambiá rápidamente entre usuarios para ver el portal como pareja.
        </p>
        <button class="btn btn-primary" id="switchSettings">Cambiar usuario</button>
      </div>

      <div class="card col-6">
        <h3>Integración de backend</h3>
        <p class="sub" style="color:var(--muted); margin:0 0 12px;">
          Cuando conectes tu API, reemplazá el store local por fetch() y persistencia real.
        </p>
        <button class="btn" id="seedData">Cargar datos demo</button>
      </div>

      <div class="card col-12">
        <h3>Checklist para venderlo “premium”</h3>
        <div class="sub" style="color:var(--muted); line-height:1.6;">
          • Auth real + refresh tokens • Sync multi-dispositivo • Roles por lista • Invitación por link • Auditoría de cambios • Export/Import • Integración TMDb • PWA (offline) • Realtime (WS)
        </div>
      </div>
    </div>
  `;

  $("#switchSettings").addEventListener("click", () => {
    store.currentUserId = store.partnerUserId();
    toast("Usuario cambiado", `Ahora estás como: ${store.me.name}`);
    render();
  });

  $("#seedData").addEventListener("click", () => {
    toast("Listo", "Datos demo ya cargados (este portal ya trae ejemplos).");
  });
}

/* ---------------------------
   Modal: Add Movie
--------------------------- */

function openAddMovieModal() {
  const body = `
    <div class="grid">
      <div class="col-8">
        <label>Título</label>
        <input class="input" id="mTitle" placeholder="Ej: The Prestige" />
      </div>
      <div class="col-4">
        <label>Año</label>
        <input class="input" id="mYear" placeholder="Ej: 2006" />
      </div>
      <div class="col-6">
        <label>Director</label>
        <input class="input" id="mDirector" placeholder="Ej: Christopher Nolan" />
      </div>
      <div class="col-6">
        <label>Tier (tu perfil)</label>
        <select id="mTier">
          <option value="">—</option>
          <option>S</option><option>A</option><option>B</option><option>C</option><option>D</option>
        </select>
      </div>
      <div class="col-12">
        <label>Notas</label>
        <textarea id="mNotes" placeholder="Contexto, recomendación, versión, etc."></textarea>
      </div>
      <div class="col-12">
        <label>Preferencias (tu perfil)</label>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" id="mSeen">Pendiente</button>
          <button class="btn" id="mFav">No favorita</button>
        </div>
        <p class="sub" style="color:var(--muted); margin:10px 0 0;">
          Esto se guarda solo para <b>${escapeHtml(store.me.name)}</b>.
        </p>
      </div>
    </div>
  `;

  const footer = `
    <button class="btn btn-ghost" id="mCancel">Cancelar</button>
    <button class="btn btn-primary" id="mSave">Guardar</button>
  `;

  openModal("Agregar película", body, footer);

  let seen = false, fav = false;
  const sync = () => {
    $("#mSeen").textContent = seen ? "Vista" : "Pendiente";
    $("#mSeen").classList.toggle("btn-primary", seen);
    $("#mFav").textContent = fav ? "Favorita" : "No favorita";
    $("#mFav").classList.toggle("btn-primary", fav);
  };
  sync();

  $("#mSeen").addEventListener("click", () => { seen = !seen; sync(); });
  $("#mFav").addEventListener("click", () => { fav = !fav; sync(); });

  $("#mCancel").addEventListener("click", closeModal);
  $("#mSave").addEventListener("click", () => {
    const title = $("#mTitle").value.trim();
    if (!title) return toast("Falta título", "Escribí el nombre de la película.");

    store.createMovie({
      title,
      year: $("#mYear").value.trim(),
      director: $("#mDirector").value.trim(),
      notes: $("#mNotes").value.trim(),
      tier: $("#mTier").value,
      favorite: fav,
      seen,
    });

    closeModal();
    toast("Agregada", "Se cargó en la lista compartida.");
    render();
  });
}

/* ---------------------------
   Modal: Tier Picker
--------------------------- */

function openTierPicker(movieId, userId) {
  const movie = store.movies.find((m) => m.id === movieId);
  if (!movie) return;
  store.ensurePerUser(movie);

  const current = movie.perUser[userId].tier || "";
  const who = store.users.find((u) => u.id === userId)?.name || "Usuario";

  const body = `
    <p class="sub" style="color:var(--muted); margin-top:0;">
      Cambiar tier para <b>${escapeHtml(who)}</b>: <b>${escapeHtml(movie.title)}</b>
    </p>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      ${["S","A","B","C","D",""].map((t) => `
        <button class="btn ${t && t === current ? "btn-primary" : ""}" data-tier="${t}">
          ${t ? `Tier ${t}` : "Sin tier"}
        </button>
      `).join("")}
    </div>
  `;

  const footer = `
    <button class="btn btn-ghost" id="tCancel">Cancelar</button>
    <button class="btn btn-primary" id="tApply">Aplicar</button>
  `;

  openModal("Tier", body, footer);

  let selected = current;

  $$("#modalBody button[data-tier]").forEach((b) => {
    b.addEventListener("click", () => {
      selected = b.dataset.tier || "";
      $$("#modalBody button[data-tier]").forEach((x) => x.classList.remove("btn-primary"));
      b.classList.add("btn-primary");
    });
  });

  $("#tCancel").addEventListener("click", closeModal);
  $("#tApply").addEventListener("click", () => {
    store.updateMovie(movieId, (m) => {
      m.perUser[userId].tier = selected;
    });
    closeModal();
    toast("Tier actualizado", "Se guardó tu preferencia.");
    render();
  });
}

/* ---------------------------
   Utils
--------------------------- */

function topTierTitles(userId) {
  const order = { S: 5, A: 4, B: 3, C: 2, D: 1, "": 0 };
  const list = store.movies
    .map((m) => {
      store.ensurePerUser(m);
      return { m, pu: m.perUser[userId] };
    })
    .filter(({ pu }) => pu.tier)
    .sort((a, b) => (order[b.pu.tier] - order[a.pu.tier]) || (b.m.createdAt - a.m.createdAt))
    .slice(0, 5)
    .map(({ m, pu }) => `${m.title} (${pu.tier})`);
  return list;
}

function renderMiniList(items, emptyText) {
  if (!items.length) return `<div class="badge muted" style="justify-content:center;">${escapeHtml(emptyText)}</div>`;
  return `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${items.map((x) => `<div class="badge">${escapeHtml(x)}</div>`).join("")}
    </div>
  `;
}

function emptyState(title, subtitle) {
  return `
    <div class="card">
      <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-start;">
        <div class="big" style="font-size:22px;">${escapeHtml(title)}</div>
        <div class="sub" style="color:var(--muted)">${escapeHtml(subtitle)}</div>
        <button class="btn btn-primary" id="emptyAdd">+ Agregar película</button>
      </div>
    </div>
  `;
}



/* ---------------------------
   Init
--------------------------- */

window.addEventListener("hashchange", render);

document.addEventListener("click", (e) => {
  // empty state add handler (delegated)
  if (e.target?.id === "emptyAdd") openAddMovieModal();
});

render();

/* ===============================
   MOBILE SIDEBAR CONTROL
   =============================== */

const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar');

if (openSidebarBtn && sidebar) {
  openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Cerrar sidebar al navegar (mobile UX)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  });
}
