/* app.js — Controlador principal · Reveal.js init + orquestación global */
(function () {

  /* ── Reveal.js ─────────────────────────────────────────── */
  Reveal.initialize({
    hash: true,
    controls: true,
    progress: true,
    transition: 'slide',
    transitionSpeed: 'default',
    backgroundTransition: 'fade',
    plugins: [RevealHighlight],
    width: 1200,
    height: 700,
    margin: 0,
    minScale: 0.4,
    maxScale: 1.5,
  });

  /* ── Estado de diapositiva ─────────────────────────────── */
  const STATE_MAP = {
    0: 's-cover',
    1: 's-hal',
    2: 's-isp',
    3: 's-apis',
    4: 's-lifecycle',
    5: 's-pipeline',
    6: 's-extensions',
    7: 's-mlkit',
  };

  /* ── FIX ⑤: badge global flotante (un solo nodo, fuera de las secciones) ── */
  const badge = document.createElement('div');
  badge.id = 'global-int-badge';
  badge.className = 'slide-int-badge';
  document.body.appendChild(badge);

  const BADGE_LABELS = {
    1: 'INT. 1', 2: 'INT. 2', 3: 'INT. 3', 4: 'INT. 4',
    5: 'INT. 5', 6: 'INT. 6', 7: 'INT. 7',
  };

  function updateBadge(idx) {
    if (BADGE_LABELS[idx]) {
      badge.textContent = BADGE_LABELS[idx];
      badge.className = 'slide-int-badge visible' + (idx === 7 ? ' accent-badge' : '');
    } else {
      badge.className = 'slide-int-badge'; /* oculto en portada */
    }
  }

  /* ── Slide-change dispatcher ───────────────────────────── */
  Reveal.on('slidechanged', ({ indexh }) => {
    /* Three.js: init lazy cuando se llega al slide ISP (índice 2) */
    if (indexh === 2) {
      const container = document.getElementById('three-isp');
      if (container && !CamInsideThree.isReady()) {
        CamInsideThree.init(container);
      }
    }

    updateBadge(indexh);

    /* Notificar a cada módulo de slide */
    const event = new CustomEvent('caminside:slide', { detail: { index: indexh } });
    document.dispatchEvent(event);

    /* Sincronizar tab del móvil con el slide actual */
    SOCKET.emit('slide_changed', { index: indexh });
  });

  /* Badge inicial */
  updateBadge(Reveal.getIndices ? Reveal.getIndices().h : 0);

  /* ── Navegar desde el móvil ────────────────────────────── */
  SOCKET.on('navigate', (data) => {
    const d = data.data || data;
    if (d.slide !== undefined) Reveal.slide(d.slide);
  });

  /* ── Log global en consola de portada ─────────────────── */
  SOCKET.on('__log', (entry) => {
    const body = document.getElementById('cover-log');
    if (!body) return;
    const line = document.createElement('div');
    line.className = 'cc-line' + (entry.type === 'warn' ? ' dim' : '');
    line.textContent = `[${entry.ts}] ${entry.msg}`;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  });

  SOCKET.on('__connected', () => {
    const body = document.getElementById('cover-log');
    if (!body) return;
    const line = document.createElement('div');
    line.className = 'cc-line';
    line.textContent = '> Dispositivo móvil conectado — sistema listo ✓';
    body.appendChild(line);
  });

})();
