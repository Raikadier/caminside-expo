/* slide-01-hal.js — Arquitectura de Capas HAL */
(function () {

  const LAYERS = [
    {
      id: 'app', icon: '🔷', color: '#a855f7',
      name: 'Application Layer',
      desc: 'Flutter · Widget Tree · CameraPreview · pub.dev packages',
    },
    {
      id: 'framework', icon: '⚙️', color: '#3b82f6',
      name: 'Framework / SDK Layer',
      desc: 'camera: ^0.10.5 · Platform Channel · Dart FFI bridge',
    },
    {
      id: 'hal', icon: '🔌', color: '#00f0ff',
      name: 'Hardware Abstraction Layer (HAL)',
      desc: 'android.hardware.camera.provider@2.7 · Interfaz unificada entre SW y HW',
    },
    {
      id: 'driver', icon: '💾', color: '#f97316',
      name: 'Kernel Driver Layer',
      desc: 'V4L2 · DMA Buffers · IRQ Handlers · Camera Subsystem',
    },
    {
      id: 'kernel', icon: '🔩', color: '#22c55e',
      name: 'Linux Kernel · Hardware',
      desc: 'CMOS Sensor · ISP · MIPI CSI-2 · Memory Controller',
    },
  ];

  const DETAILS = {
    app:       'El código Flutter llama a CameraController.initialize(). Esta llamada atraviesa el árbol de widgets hasta el canal de plataforma.',
    framework: 'El Plugin Camera para Flutter actúa como puente entre Dart y el código nativo Android via MethodChannel y EventChannel.',
    hal:       'La HAL normaliza la comunicación con sensores de Sony, Samsung u OmniVision. Garantiza que el mismo código funcione en miles de dispositivos.',
    driver:    'El driver de kernel traduce las peticiones de la HAL en interrupciones de hardware y buffers DMA de memoria mapeada directamente del sensor.',
    kernel:    'El sensor CMOS convierte fotones en carga eléctrica. La señal pasa por el ISP y llega a la RAM como buffer YUV_420_888 en microsegundos.',
  };

  let activeLayer = null;
  const stack = document.getElementById('hal-stack');
  const logEl  = document.getElementById('log-hal');
  const hapName = document.getElementById('hap-name');
  const hapDesc = document.getElementById('hap-desc');

  /* ── Build stack DOM ───────────────────────────────────── */
  function buildStack() {
    if (!stack) return;
    stack.innerHTML = '';
    LAYERS.forEach((l, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'lc-node-wrap'; // reuse lifecycle wrap for connector

      const node = document.createElement('div');
      node.className = 'hal-layer';
      node.dataset.id = l.id;
      node.style.setProperty('--layer-color', l.color);
      node.innerHTML = `
        <span class="layer-icon">${l.icon}</span>
        <span class="layer-text">
          <span class="layer-name">${l.name}</span>
          <span class="layer-desc">${l.desc}</span>
        </span>
        <span class="data-packet"></span>
      `;
      node.addEventListener('click', () => activateLayer(l.id));
      wrap.appendChild(node);

      if (i < LAYERS.length - 1) {
        const conn = document.createElement('div');
        conn.style.cssText = 'width:2px;height:6px;background:rgba(255,255,255,0.07);margin:0 auto;';
        wrap.appendChild(conn);
      }

      stack.appendChild(wrap);
    });
  }

  /* ── Activate layer ────────────────────────────────────── */
  function activateLayer(id) {
    if (!stack) return;
    activeLayer = id;
    const layer = LAYERS.find(l => l.id === id);
    if (!layer) return;

    stack.querySelectorAll('.hal-layer').forEach(el => el.classList.remove('active'));
    const target = stack.querySelector(`[data-id="${id}"]`);
    if (target) target.classList.add('active');

    if (hapName) hapName.textContent = layer.name;
    if (hapName) hapName.style.color = layer.color;
    if (hapDesc) hapDesc.textContent = DETAILS[id] || layer.desc;

    addLog(`Capa activa: ${layer.name}`, 'ok');
  }

  /* ── Auto-flow animation ───────────────────────────────── */
  const FLOW_SEQUENCE = ['app', 'framework', 'hal', 'driver', 'kernel'];
  let flowIndex = 0;
  let flowTimer = null;

  function startFlow() {
    flowTimer = setInterval(() => {
      activateLayer(FLOW_SEQUENCE[flowIndex]);
      flowIndex = (flowIndex + 1) % FLOW_SEQUENCE.length;
    }, 1800);
  }

  function stopFlow() {
    if (flowTimer) { clearInterval(flowTimer); flowTimer = null; }
  }

  /* ── Logging ───────────────────────────────────────────── */
  function addLog(msg, type = 'info') {
    if (!logEl) return;
    const ts = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `tl ${type}`;
    line.textContent = `[${ts}] ${msg}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  /* ── Socket events ─────────────────────────────────────── */
  SOCKET.on('hal_info', (data) => {
    const d = data.data || data;
    stopFlow();
    if (d.capa)               activateLayer(d.capa);
    if (d.nivel_soporte)      addLog(`HAL Level: ${d.nivel_soporte}`, 'ok');
    if (d.focal_length)       addLog(`Focal length: ${d.focal_length}mm`, 'ok');
    if (d.aperture)           addLog(`Apertura: f/${d.aperture}`, 'ok');
    // C-5: campos que antes se ignoraban
    if (d.camera_count !== undefined) addLog(`Cámaras detectadas: ${d.camera_count}`, 'info');
    if (d.lens_direction)     addLog(`Lente: ${d.lens_direction}`, 'info');
    if (d.sensor_orientation !== undefined) addLog(`Orientación del sensor: ${d.sensor_orientation}°`, 'info');
    if (d.preview_size)       addLog(`Resolución de preview: ${d.preview_size}`, 'info');
    SOCKET.log('hal', `Datos HAL recibidos: ${JSON.stringify(d)}`);
  });

  SOCKET.on('tab_change', (data) => {
    if ((data.data || data).tab === 1) {
      addLog('Pestaña HAL activa en el dispositivo móvil', 'info');
    }
  });

  /* ── Slide enter / leave ───────────────────────────────── */
  document.addEventListener('caminside:slide', ({ detail }) => {
    if (detail.index === 1) {
      stopFlow();
      activateLayer('app');
      addLog('Sistema de capas inicializado — flujo automático', 'info');
      setTimeout(startFlow, 800);
    } else {
      stopFlow();
    }
  });

  /* ── Init ──────────────────────────────────────────────── */
  buildStack();
  activateLayer('hal');

})();
