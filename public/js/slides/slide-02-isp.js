/* slide-02-isp.js — ISP Pipeline · Bayer Matrix · White Balance */
(function () {

  const wbSlider  = document.getElementById('wb-slider');
  const wbValEl   = document.getElementById('wb-value');
  const rgbSwatch = document.getElementById('rgb-swatch');
  const rgbLabel  = document.getElementById('rgb-temp-label');
  const logEl     = document.getElementById('log-isp');
  const bayerGrid = document.getElementById('bayer-grid');

  const STEPS = ['step-demo', 'step-nr', 'step-wb', 'step-tone'];
  let stepTimer  = null;
  let currentStep = 0;

  /* ── Build Bayer Grid (8×8) ────────────────────────────── */
  const BAYER_8 = [
    'R','G','R','G','R','G','R','G',
    'G','B','G','B','G','B','G','B',
    'R','G','R','G','R','G','R','G',
    'G','B','G','B','G','B','G','B',
    'R','G','R','G','R','G','R','G',
    'G','B','G','B','G','B','G','B',
    'R','G','R','G','R','G','R','G',
    'G','B','G','B','G','B','G','B',
  ];

  function buildBayerGrid() {
    if (!bayerGrid) return;
    bayerGrid.innerHTML = '';
    BAYER_8.forEach(ch => {
      const cell = document.createElement('div');
      cell.className = `bc bc-${ch.toLowerCase()}`;
      cell.dataset.ch = ch;
      bayerGrid.appendChild(cell);
    });
    applyWB(5500);
  }

  /* ── Apply White Balance ───────────────────────────────── */
  function applyWB(temp) {
    const t = (temp - 2500) / (8000 - 2500); // 0 = frío, 1 = cálido

    /* Colores para cada canal con temperatura */
    const rR = Math.round(180 + t * 60);
    const rG = 50;
    const rB = Math.round(50 + (1 - t) * 30);

    const gR = Math.round(30 + t * 20);
    const gG = 150;
    const gB = Math.round(30 + (1 - t) * 20);

    const bR = Math.round(30 + t * 30);
    const bG = 40;
    const bB = Math.round(160 + (1 - t) * 70);

    document.querySelectorAll('.bc-r').forEach(c => c.style.background = `rgb(${rR},${rG},${rB})`);
    document.querySelectorAll('.bc-g').forEach(c => c.style.background = `rgb(${gR},${gG},${gB})`);
    document.querySelectorAll('.bc-b').forEach(c => c.style.background = `rgb(${bR},${bG},${bB})`);

    /* RGB swatch output */
    const outR = Math.round(100 + t * 155);
    const outG = Math.round(120 + t * 30);
    const outB = Math.round(220 - t * 155);
    if (rgbSwatch) rgbSwatch.style.background = `rgb(${outR},${outG},${outB})`;

    /* Label */
    let desc = temp < 3500 ? 'Frío · Luz de tungsteno' :
               temp < 5000 ? 'Neutro-frío · Nublado'   :
               temp < 6000 ? 'Neutro · Luz día'         :
               temp < 7000 ? 'Cálido · Luz solar'       :
                             'Muy cálido · Cielo abierto';
    if (rgbLabel) rgbLabel.textContent = `${temp}K · ${desc}`;
    if (wbValEl)  wbValEl.textContent  = `${temp}K`;

    /* Three.js color temperature */
    if (typeof CamInsideThree !== 'undefined' && CamInsideThree.isReady()) {
      CamInsideThree.setWB(temp);
    }

    addLog(`WB ajustado: ${temp}K — ${desc}`, 'info');
  }

  /* ── Cycle ISP Pipeline Steps ──────────────────────────── */
  function startStepCycle() {
    STEPS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    stepTimer = setInterval(() => {
      STEPS.forEach(id => document.getElementById(id)?.classList.remove('active'));
      document.getElementById(STEPS[currentStep])?.classList.add('active');
      currentStep = (currentStep + 1) % STEPS.length;
      if (typeof CamInsideThree !== 'undefined') CamInsideThree.setISP(true);
    }, 900);
  }

  function stopStepCycle() {
    if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
    if (typeof CamInsideThree !== 'undefined') CamInsideThree.setISP(false);
  }

  /* ── Logging ───────────────────────────────────────────── */
  function addLog(msg, type = 'info') {
    if (!logEl) return;
    const ts = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `tl ${type}`;
    line.textContent = `[${ts}] ${msg}`;
    logEl.appendChild(line);
    requestAnimationFrame(() => { logEl.scrollTop = logEl.scrollHeight; });
  }

  /* ── WB Slider interaction ─────────────────────────────── */
  if (wbSlider) {
    wbSlider.addEventListener('input', function () {
      applyWB(parseInt(this.value));
      SOCKET.log('isp-ui', `Balance de blancos ajustado: ${this.value}K`);
    });
  }

  /* ── Socket events ─────────────────────────────────────── */
  SOCKET.on('isp_white_balance', (data) => {
    const d = data.data || data;
    const temp = d.temperatura || d.value || 5500;
    if (wbSlider) wbSlider.value = temp;
    applyWB(temp);
    addLog(`WB recibido desde móvil: ${temp}K`, 'ok');
  });

  SOCKET.on('tab_change', (data) => {
    if ((data.data || data).tab === 2) {
      addLog('Pestaña ISP activa en el dispositivo móvil', 'info');
      // D-7: guard typeof para evitar crash si Three.js no cargó (CDN caído)
      if (typeof CamInsideThree !== 'undefined' && CamInsideThree.isReady()) {
        CamInsideThree.setISP(true);
      }
    }
  });

  /* ── Etiquetas didácticas 3D ───────────────────────────── */
  const CAM_PARTS = [
    { id: 'optica', title: 'Sistema Óptico',  sub: 'Conjunto de lentes',        side: 'r' },
    { id: 'sensor', title: 'Sensor CMOS',     sub: 'Fotones → carga eléctrica', side: 'l' },
    { id: 'isp',    title: 'ISP · SoC',       sub: 'Procesamiento digital',      side: 'r' },
    { id: 'pcb',    title: 'PCB',             sub: 'I²C · MIPI CSI-2',           side: 'l' },
  ];
  /* Y fija de cada etiqueta como fracción de la altura del canvas */
  const LBL_Y_FRAC = [0.17, 0.41, 0.61, 0.80];

  let labelOverlay = null, labelRaf = null;
  const labelDots = {}, labelBadges = {}, labelLines = {};

  function buildLabelOverlay() {
    const container = document.getElementById('three-isp');
    if (!container || labelOverlay) return;

    labelOverlay = document.createElement('div');
    labelOverlay.id = 'cam3d-overlay';
    container.appendChild(labelOverlay);

    /* SVG capa para las líneas de conexión */
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'cam3d-svg';
    labelOverlay.appendChild(svg);

    CAM_PARTS.forEach(({ id, title, sub }) => {
      /* Línea punteada anchor → badge */
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(ln);
      labelLines[id] = ln;

      /* Punto de anclaje 3D (se mueve con la rotación) */
      const dot = document.createElement('div');
      dot.className = 'cam3d-dot';
      labelOverlay.appendChild(dot);
      labelDots[id] = dot;

      /* Badge de texto fijo a la derecha */
      const badge = document.createElement('div');
      badge.className = 'cam3d-badge';
      badge.innerHTML =
        `<span class="c3b-title">${title}</span>` +
        `<span class="c3b-sub">${sub}</span>`;
      labelOverlay.appendChild(badge);
      labelBadges[id] = badge;
    });
  }

  function updateLabelPositions() {
    const container = document.getElementById('three-isp');
    if (!container || !labelOverlay ||
        typeof CamInsideThree === 'undefined' || !CamInsideThree.isReady()) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    const pos = CamInsideThree.getLabelPositions(container);

    CAM_PARTS.forEach(({ id }, i) => {
      const p     = pos[id];
      const dot   = labelDots[id];
      const badge = labelBadges[id];
      const line  = labelLines[id];
      if (!p || !dot || !badge || !line) return;

      const visible = !p.hidden;
      const alpha   = visible ? 1 : 0;

      /* Dot: centrado en la proyección 3D */
      dot.style.left    = `${p.x - 4}px`;
      dot.style.top     = `${p.y - 4}px`;
      dot.style.opacity = alpha;

      /* Badge: Y fija, lado alternado (r/l) */
      const side   = CAM_PARTS[i].side;
      const MARGIN = 10;
      const lblY   = H * LBL_Y_FRAC[i];
      const badgeW = badge.offsetWidth || 110;

      badge.style.top = `${lblY}px`;     /* CSS translateY(-50%) centra verticalmente */
      badge.style.opacity = visible ? 1 : 0;

      if (side === 'r') {
        badge.style.right = `${MARGIN}px`;
        badge.style.left  = '';
      } else {
        badge.style.left  = `${MARGIN}px`;
        badge.style.right = '';
      }

      /* Línea: dot → borde del badge (lado del que sale la línea) */
      const lineEndX = side === 'r'
        ? W - MARGIN - badgeW - 6    /* borde izq. del badge derecho */
        : MARGIN + badgeW + 6;       /* borde der. del badge izquierdo */
      const lineEndY = lblY;
      line.setAttribute('x1', p.x);
      line.setAttribute('y1', p.y);
      line.setAttribute('x2', lineEndX);
      line.setAttribute('y2', lineEndY);
      line.setAttribute('stroke', visible ? 'rgba(0,240,255,0.45)' : 'none');
      line.setAttribute('stroke-width', '1');
    });
  }

  function startLabelLoop() {
    if (labelRaf) return;
    (function tick() { updateLabelPositions(); labelRaf = requestAnimationFrame(tick); })();
  }
  function stopLabelLoop() {
    if (labelRaf) { cancelAnimationFrame(labelRaf); labelRaf = null; }
  }

  /* ── Slide enter / leave ───────────────────────────────── */
  document.addEventListener('caminside:slide', ({ detail }) => {
    if (detail.index === 2) {
      /* Three.js init ocurre en app.js; aquí solo arrancamos efectos */
      addLog('ISP Pipeline activo — analizando flujo de datos', 'info');
      startStepCycle();
      /* Crear overlay la primera vez; arrancar loop de proyección */
      if (typeof CamInsideThree !== 'undefined' && CamInsideThree.isReady()) {
        buildLabelOverlay();
        startLabelLoop();
      }
    } else {
      stopStepCycle();
      stopLabelLoop();
    }
  });

  /* ── Init ──────────────────────────────────────────────── */
  buildBayerGrid();

})();
