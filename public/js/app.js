/* app.js — Controlador principal · Reveal.js init + orquestación global */
(function () {

  /* ── Reveal.js ─────────────────────────────────────────── */
  Reveal.initialize({
    hash: true,
    controls: true,
    progress: true,
    transition: 'none',          /* CONF: transición la hace el iris, no Reveal */
    transitionSpeed: 'fast',
    backgroundTransition: 'none',
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

  /* ── Badge global de integrante ────────────────────────── */
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
      badge.className = 'slide-int-badge';
    }
  }

  /* ════════════════════════════════════════════════════════
     CONF-1 · IRIS TRANSITION
     ════════════════════════════════════════════════════════ */
  const irisEl   = document.getElementById('iris-overlay');
  const irisRing = document.getElementById('iris-ring');

  function triggerIris() {
    if (!irisEl) return;
    irisEl.classList.remove('iris-open');
    irisRing.classList.remove('iris-open');
    void irisEl.offsetWidth; /* force reflow para reiniciar animación */
    irisEl.classList.add('iris-open');
    irisRing.classList.add('iris-open');
  }

  /* ════════════════════════════════════════════════════════
     CONF-2 · STAT CARDS — una por sección
     ════════════════════════════════════════════════════════ */
  const CONF_STATS = {
    1: { n: '5',    l: 'capas de software entre tu\ncódigo y el silicio',   c: '#a78bfa', s: 'HAL · Kernel Driver · Linux · Hardware' },
    2: { n: '47',   l: 'algoritmos ejecutados\npor cada foto que tomas',    c: '#00f0ff', s: 'Demosaicing · NR · WB · Tonemapping · ...' },
    3: { n: '−87%', l: 'menos código: Camera2\nversus CameraX',             c: '#22c55e', s: '280 líneas → 35 líneas · 13.7× más rápido' },
    4: { n: '4',    l: 'estados que controlan\nsi la cámara vive o muere', c: '#f59e0b', s: 'resumed · inactive · paused · detached' },
    5: { n: '3',    l: 'hilos simultáneos\ncero conflictos de memoria',    c: '#f97316', s: 'Preview · Capture · Analysis — en paralelo' },
    6: { n: '3.4×', l: 'mejora de calidad\ncon la API nativa',              c: '#22c55e', s: '28% screenshot → 94% extensión ISP nativa' },
    7: { n: '50ms', l: 'latencia de IA on-device\nsin internet · sin nube', c: '#4ade80', s: 'YUV_420_888 · Google ML Kit · On-Device' },
  };

  const statOverlay  = document.getElementById('conf-stat-overlay');
  const statNumber   = document.getElementById('cso-number');
  const statLabel    = document.getElementById('cso-label');
  const statSub      = document.getElementById('cso-sub');
  const statDots     = document.getElementById('cso-dots');
  let   statTimer    = null;

  function buildStatDots(active) {
    if (!statDots) return;
    statDots.innerHTML = '';
    for (let i = 1; i <= 7; i++) {
      const d = document.createElement('span');
      d.className = 'cso-dot' + (i === active ? ' cso-dot-active' : '');
      statDots.appendChild(d);
    }
  }

  function showStat(idx) {
    const s = CONF_STATS[idx];
    if (!s || !statOverlay) return;
    if (statTimer) clearTimeout(statTimer);

    statNumber.textContent = s.n;
    statNumber.style.color = s.c;
    statNumber.style.textShadow =
      `0 0 60px ${s.c}99, 0 0 120px ${s.c}44, 0 0 200px ${s.c}22`;
    statLabel.innerHTML = s.l.replace('\n', '<br>');
    statSub.textContent = s.s;
    buildStatDots(idx);

    statOverlay.classList.remove('cso-hide');
    statOverlay.classList.add('cso-show');

    statTimer = setTimeout(() => {
      statOverlay.classList.replace('cso-show', 'cso-hide');
    }, 2500);
  }

  /* ════════════════════════════════════════════════════════
     CONF-3 · QR CODE — slide 0, modo audiencia
     ════════════════════════════════════════════════════════ */
  function initAudienceQR() {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => {
        const wrap  = document.getElementById('cover-qr-wrap');
        const qrEl  = document.getElementById('cover-qr');
        const urlEl = document.getElementById('cover-qr-url');
        if (!qrEl) return;

        /* qrcodejs — colorDark es el módulo, colorLight el fondo */
        new QRCode(qrEl, {
          text: cfg.audienceUrl,
          width: 110, height: 110,
          colorDark:  '#00f0ff',
          colorLight: '#03030f',
          correctLevel: QRCode.CorrectLevel.M,
        });
        if (urlEl) urlEl.textContent = cfg.audienceUrl;
        if (wrap)  wrap.style.opacity = '1';
      })
      .catch(() => { /* sin servidor local (Vercel) — ocultar QR silenciosamente */ });
  }

  /* ════════════════════════════════════════════════════════
     SLIDE-CHANGE DISPATCHER
     ════════════════════════════════════════════════════════ */
  Reveal.on('slidechanged', ({ indexh }) => {

    /* Three.js: init lazy al llegar al slide ISP */
    if (indexh === 2) {
      const container = document.getElementById('three-isp');
      if (container && !CamInsideThree.isReady()) CamInsideThree.init(container);
    }

    updateBadge(indexh);

    /* Notificar a cada módulo de slide */
    document.dispatchEvent(
      new CustomEvent('caminside:slide', { detail: { index: indexh } })
    );

    /* Sincronizar tab del móvil */
    SOCKET.emit('slide_changed', { index: indexh });

    /* Conference effects */
    triggerIris();
    if (indexh > 0) showStat(indexh);
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

  /* ── Init conferencia ──────────────────────────────────── */
  initAudienceQR();

  /* Iris de bienvenida al cargar la página */
  setTimeout(triggerIris, 300);

})();
