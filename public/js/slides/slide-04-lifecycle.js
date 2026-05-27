/* slide-04-lifecycle.js — Flutter AppLifecycleState · Ciclo de vida */
(function () {

  const diagramEl  = document.getElementById('lifecycle-diagram');
  const logEl      = document.getElementById('log-lifecycle');
  const hwStateEl  = document.getElementById('hw-state');
  const hwDetailEl = document.getElementById('hw-detail');
  const hwIconEl   = document.getElementById('hw-icon');
  const hwPulseEl  = document.getElementById('hw-pulse');

  /* Flutter lifecycle states (en orden de flujo) */
  const STATES = [
    {
      id: 'inactive',
      label: 'AppLifecycleState.inactive',
      desc: 'Transición — App perdiendo foco de entrada',
      color: '#eab308',
      cam: null,
    },
    {
      id: 'resumed',
      label: 'AppLifecycleState.resumed',
      desc: 'App en primer plano — CameraController activo y transmitiendo',
      color: '#22c55e',
      cam: { state: 'SESIÓN ACTIVA', detail: 'CameraController.initialize() completado', active: true },
    },
    {
      id: 'paused',
      label: 'AppLifecycleState.paused',
      desc: 'App en segundo plano — Hardware de cámara liberado',
      color: '#ef4444',
      cam: { state: 'HARDWARE LIBERADO', detail: 'CameraController.dispose() ejecutado', active: false },
    },
    {
      id: 'detached',
      label: 'AppLifecycleState.detached',
      desc: 'App destruida — Recursos completamente liberados del proceso',
      color: '#475569',
      cam: { state: 'DESTRUIDO', detail: 'dispose() + GC limpieza de recursos', active: false },
    },
  ];

  let currentState = 'resumed';
  let simTimer = null;
  let simRunning = false; // B-8: guard contra doble ejecución de la simulación

  /* ── Build diagram ─────────────────────────────────────── */
  function buildDiagram() {
    if (!diagramEl) return;
    diagramEl.innerHTML = '';

    STATES.forEach((s, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'lc-node-wrap';
      wrap.style.width = '100%';

      const node = document.createElement('div');
      node.className = 'lc-node';
      node.id = `lc-node-${s.id}`;
      node.style.setProperty('--node-color', s.color);
      node.innerHTML = `
        <div class="lc-dot" style="--node-color:${s.color}"></div>
        <div class="lc-info">
          <div class="lc-state-name">${s.label}</div>
          <div class="lc-state-desc">${s.desc}</div>
        </div>
      `;
      node.addEventListener('click', () => setLifecycleState(s.id, true));
      wrap.appendChild(node);

      if (i < STATES.length - 1) {
        const conn = document.createElement('div');
        conn.className = 'lc-connector';
        conn.id = `lc-conn-${i}`;
        wrap.appendChild(conn);
      }

      diagramEl.appendChild(wrap);
    });

    setLifecycleState('resumed', false);
  }

  /* ── Set state ─────────────────────────────────────────── */
  function setLifecycleState(id, log = true) {
    const state = STATES.find(s => s.id === id);
    if (!state) return;
    currentState = id;

    /* Update nodes */
    STATES.forEach(s => {
      const node = document.getElementById(`lc-node-${s.id}`);
      if (node) node.classList.toggle('active', s.id === id);
    });

    /* Animate connector above active node */
    const idx = STATES.findIndex(s => s.id === id);
    document.querySelectorAll('.lc-connector').forEach((c, i) => {
      c.classList.remove('flowing');
      if (i === idx - 1) {
        void c.offsetWidth; // reflow to restart animation
        c.classList.add('flowing');
        c.style.setProperty('--node-color', state.color);
      }
    });

    /* Camera hardware status */
    if (state.cam) {
      if (hwStateEl) {
        hwStateEl.textContent = state.cam.state;
        hwStateEl.className   = 'hw-state ' + (state.cam.active ? '' : 'paused-state');
      }
      if (hwDetailEl) hwDetailEl.textContent = state.cam.detail;
      if (hwPulseEl)  hwPulseEl.className    = 'hw-pulse ' + (state.cam.active ? '' : 'paused');
      if (hwIconEl)   hwIconEl.textContent   = state.cam.active ? '📷' : '🔒';
    }

    if (log) addLog(`${state.label} → ${state.desc}`, id === 'resumed' ? 'ok' : id === 'paused' ? 'warn' : 'info');
  }

  /* ── Simulate lock/unlock ──────────────────────────────── */
  function runSimulation() {
    if (simRunning) return; // B-8: evitar solapamiento si tab_change y slide enter llegan juntos
    simRunning = true;
    addLog('Simulación: secuencia de bloqueo/desbloqueo', 'dim');

    setTimeout(() => { setLifecycleState('resumed');  addLog('Cámara transmitiendo en tiempo real...', 'ok'); }, 500);
    setTimeout(() => { addLog('◆ Botón de bloqueo presionado — OS envía inactive', 'warn'); }, 2500);
    setTimeout(() => { setLifecycleState('inactive'); }, 2800);
    setTimeout(() => { setLifecycleState('paused');   addLog('Hardware de cámara liberado · RAM desocupada', 'warn'); }, 3200);
    setTimeout(() => { addLog('◆ Pantalla desbloqueada — OS envía resumed', 'ok'); }, 5500);
    setTimeout(() => { setLifecycleState('resumed');  addLog('Sesión de cámara reestablecida · Stream activo ✓', 'ok'); simRunning = false; }, 5900);
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

  /* ── Socket events ─────────────────────────────────────── */
  SOCKET.on('lifecycle_event', (data) => {
    const d = data.data || data;
    const raw = (d.estado || d.state || '').toLowerCase();

    /* Map Android/Flutter state names */
    const map = {
      onresume: 'resumed', resumed: 'resumed',
      onpause:  'paused',  paused:  'paused',
      oncreate: 'inactive', inactive: 'inactive',
      ondestroy:'detached', detached: 'detached',
    };
    const normalized = map[raw] || raw;
    if (normalized) {
      setLifecycleState(normalized);
      SOCKET.log('lifecycle', `Evento: ${normalized}`);
    }
  });

  SOCKET.on('tab_change', (data) => {
    if ((data.data || data).tab === 4) {
      addLog('Pestaña Lifecycle activa en el dispositivo móvil', 'info');
      runSimulation();
    }
  });

  /* ── Slide enter ───────────────────────────────────────── */
  document.addEventListener('caminside:slide', ({ detail }) => {
    if (detail.index === 4) {
      logEl.innerHTML = '';
      runSimulation();
    }
  });

  /* ── Init ──────────────────────────────────────────────── */
  buildDiagram();

})();
