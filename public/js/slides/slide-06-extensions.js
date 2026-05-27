/* slide-06-extensions.js — API de Extensiones CameraX */
(function () {

  const logEl  = document.getElementById('log-ext');
  const oldCard = document.getElementById('ext-old');
  const newCard = document.getElementById('ext-new');

  let currentMode = null;

  /* ── Set mode ──────────────────────────────────────────── */
  function setMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    if (mode === 'old') {
      highlight(oldCard, '#ef4444', true);
      highlight(newCard, null, false);
      addLog('MODO ACTIVO: Screenshot del Preview — Sin procesamiento ISP', 'warn');
      addLog('ExtensionMode: NONE · Ruta genérica sin acceso a HAL', 'warn');
    } else {
      highlight(newCard, '#22c55e', true);
      highlight(oldCard, null, false);
      addLog('MODO ACTIVO: Extensión Nativa — Pipeline ISP completo', 'ok');
      addLog('ExtensionMode: NIGHT / HDR / BOKEH disponibles ✓', 'ok');
      animateMeterFill();
    }
  }

  function highlight(card, color, on) {
    if (!card) return;
    if (on && color) {
      card.style.borderColor  = color;
      card.style.boxShadow    = `0 0 25px ${color}33, inset 0 0 20px ${color}0a`;
      card.style.transform    = 'scale(1.02)';
    } else {
      card.style.borderColor  = '';
      card.style.boxShadow    = '';
      card.style.transform    = '';
    }
  }

  /* Animate meter fill when native mode is selected */
  function animateMeterFill() {
    const fill = newCard?.querySelector('.ext-mfill');
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.width = '0%';
    requestAnimationFrame(() => {
      fill.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
      fill.style.width      = '94%';
    });
  }

  /* ── Card click events ─────────────────────────────────── */
  oldCard?.addEventListener('click', () => {
    setMode('old');
    SOCKET.log('ext-ui', 'Modo seleccionado: Screenshot del Preview');
  });

  newCard?.addEventListener('click', () => {
    setMode('new');
    SOCKET.log('ext-ui', 'Modo seleccionado: Extensión Nativa');
  });

  /* ── Logging ───────────────────────────────────────────── */
  function addLog(msg, type = 'info') {
    if (!logEl) return;
    const ts   = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `tl ${type}`;
    line.textContent = `[${ts}] ${msg}`;
    logEl.appendChild(line);
    requestAnimationFrame(() => { logEl.scrollTop = logEl.scrollHeight; });
  }

  /* ── Socket events ─────────────────────────────────────── */
  SOCKET.on('extension_mode', (data) => {
    const d = data.data || data;
    setMode(['nativa', 'extension', 'new'].includes(d.modo) ? 'new' : 'old');
    SOCKET.log('ext', `Modo extensión desde móvil: ${d.modo}`);
  });

  SOCKET.on('tab_change', (data) => {
    if ((data.data || data).tab === 6) {
      addLog('Pestaña Extensiones activa en el dispositivo móvil', 'info');
    }
  });

  /* ── Slide enter ───────────────────────────────────────── */
  document.addEventListener('caminside:slide', ({ detail }) => {
    if (detail.index === 6) {
      addLog('Haz clic en una tarjeta o activa el modo desde el móvil', 'dim');
      /* Auto-demo: show old first, then switch to new */
      setTimeout(() => setMode('old'), 600);
      setTimeout(() => setMode('new'), 2200);
    }
  });

  /* ── Init ──────────────────────────────────────────────── */
  addLog('Toca una tarjeta para comparar los modos', 'dim');

})();
