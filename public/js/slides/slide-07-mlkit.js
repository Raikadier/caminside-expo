/* slide-07-mlkit.js — Google ML Kit · YUV_420_888 · Edge AI */
(function () {

  const termEl  = document.getElementById('terminal-mlkit');
  const fpsEl   = document.getElementById('mlkit-fps');
  const MKS     = [1, 2, 3, 4].map(i => document.getElementById(`mks-${i}`));

  let fpsInterval = null;
  let stepTimer   = null;
  let fakeFrame   = 0;
  let pipeStep    = 0;

  /* ── Build YUV grids ───────────────────────────────────── */
  function buildYuvGrids() {
    buildGrid('yuv-y-grid', 8, 8, (r, c) => {
      const v = Math.round(40 + Math.random() * 160);
      return `rgb(${v},${v},${v})`;
    });
    buildGrid('yuv-u-grid', 4, 4, () => {
      const v = Math.round(100 + Math.random() * 80);
      return `rgb(40,${Math.round(v*0.4)},${v})`;
    });
    buildGrid('yuv-v-grid', 4, 4, () => {
      const v = Math.round(100 + Math.random() * 80);
      return `rgb(${v},${Math.round(v*0.4)},40)`;
    });
  }

  function buildGrid(id, rows, cols, colorFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'yuv-cell';
        cell.style.background = colorFn(r, c);
        cell.style.aspectRatio = '1';
        el.appendChild(cell);
      }
    }
  }

  /* Animate Y-plane to simulate frame updates */
  function animateYPlane() {
    const yGrid = document.getElementById('yuv-y-grid');
    if (!yGrid) return;
    yGrid.querySelectorAll('.yuv-cell').forEach(cell => {
      const v = Math.round(30 + Math.random() * 180);
      cell.style.background = `rgb(${v},${v},${v})`;
    });
  }

  /* ── Pipeline step highlight cycle ────────────────────── */
  function startPipeline() {
    pipeStep = 0;
    stepTimer = setInterval(() => {
      MKS.forEach((el, i) => el?.classList.toggle('active', i === pipeStep));
      pipeStep = (pipeStep + 1) % MKS.length;
      if (pipeStep === 0) animateYPlane();
    }, 600);
  }

  function stopPipeline() {
    if (stepTimer) { clearInterval(stepTimer); stepTimer = null; }
    MKS.forEach(el => el?.classList.remove('active'));
  }

  /* ── FPS counter simulation ─────────────────────────────── */
  function startFPS() {
    fpsInterval = setInterval(() => {
      fakeFrame++;
      const fps = 28 + Math.round(Math.random() * 5);
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
    }, 200);
  }

  function stopFPS() {
    if (fpsInterval) { clearInterval(fpsInterval); fpsInterval = null; }
    if (fpsEl) fpsEl.textContent = '— FPS';
  }

  /* ── Add terminal line ─────────────────────────────────── */
  function addLine(text, cls = '') {
    if (!termEl) return;
    const ts   = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `mlt-line ${cls}`;
    line.textContent = `[${ts}] ${text}`;
    termEl.appendChild(line);
    requestAnimationFrame(() => { termEl.scrollTop = termEl.scrollHeight; });

    /* Keep max 40 lines */
    while (termEl.children.length > 40) termEl.removeChild(termEl.firstChild);
  }

  /* ── Display ML Kit detection result ──────────────────── */
  function showDetection(result) {
    const tipo   = result.tipo  || result.type  || 'QR_CODE';
    const valor  = result.valor || result.text  || '---';
    const coords = result.coordenadas || result.coords || {};
    const format = result.formato || result.format || 'QR_CODE';
    const conf   = result.confianza || result.confidence || (0.92 + Math.random() * 0.07).toFixed(3);

    addLine('─────────────────────────────────────────────', 'dim');
    addLine(`>>> ${tipo} DETECTADO`, 'hi');
    addLine(`  Valor    : "${valor}"`, 'det');
    addLine(`  Formato  : ${format}`, '');
    if (coords.x !== undefined) addLine(`  Coords  : (${coords.x}px, ${coords.y}px)`, 'dim');
    addLine(`  Confianza: ${conf}`, '');
    addLine(`  Canal    : YUV_420_888 planes[0] — Luminancia`, 'dim');
    addLine(`  Hilo     : analysis-executor (background)`, 'dim');
    addLine(`  Latencia : ${Math.round(8 + Math.random() * 12)}ms por frame`, 'dim');
    addLine('─────────────────────────────────────────────', 'dim');

    /* Flash pipeline step 3 (ML Kit) */
    MKS[2]?.classList.add('active');
    setTimeout(() => pipeStep !== 3 && MKS[2]?.classList.remove('active'), 800);

    SOCKET.log('mlkit', `${tipo} detectado: ${valor}`);
  }

  /* ── Demo QR detection ─────────────────────────────────── */
  function demoDetection() {
    addLine('Apuntando cámara hacia código QR...', 'dim');
    setTimeout(() => {
      addLine('Frame capturado en YUV_420_888 · plano Y extraído', 'dim');
      setTimeout(() => {
        showDetection({
          tipo: 'QR_CODE', valor: 'https://caminside.upc.edu.co',
          formato: 'QR_CODE', confianza: '0.987',
          coordenadas: { x: 312, y: 418 },
        });
      }, 600);
    }, 800);
  }

  /* ── Socket events ─────────────────────────────────────── */
  SOCKET.on('mlkit_result', (data) => {
    showDetection(data.data || data);
  });

  /* Guard against old '*' listener pattern — not needed with typed events */

  SOCKET.on('tab_change', (data) => {
    if ((data.data || data).tab === 7) {
      addLine('Pestaña ML Kit activa en el dispositivo móvil', 'hi');
      addLine('Iniciando ImageAnalysis pipeline...', '');
    }
  });

  /* ── Slide enter / leave ───────────────────────────────── */
  document.addEventListener('caminside:slide', ({ detail }) => {
    if (detail.index === 7) {
      startPipeline();
      startFPS();
      addLine('Slide ML Kit cargado — sistema listo', 'hi');
      setTimeout(demoDetection, 1200);
    } else {
      stopPipeline();
      stopFPS();
    }
  });

  /* ── Init ──────────────────────────────────────────────── */
  buildYuvGrids();

})();
