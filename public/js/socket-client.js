/* socket-client.js — WebSocket bridge para la diapositiva web */
const SOCKET = (() => {
  let socket = null;
  const handlers = {};

  function connect() {
    // En Vercel (serverless) no hay socket server — intentamos conectar pero
    // limitamos los reintentos para no saturar la consola.
    const isVercel = window.location.hostname.endsWith('.vercel.app');

    socket = io(window.location.origin, {
      reconnection: !isVercel,
      reconnectionDelay: 2000,
      reconnectionAttempts: isVercel ? 0 : Infinity,
      timeout: 5000,
    });

    // ── Al conectar: identificarse como cliente web ──────────────────────
    socket.on('connect', () => {
      socket.emit('identify', 'web');
      setHUD(true);
      dispatch('__connected', {});
      log('sistema', 'WebSocket conectado — telemetría activa');
    });

    socket.on('connect_error', () => {
      if (isVercel) setHUD(false, 'Modo presentación');
    });

    socket.on('disconnect', () => {
      setHUD(false);
      log('sistema', 'WebSocket desconectado — reintentando...', 'warn');
    });

    // ── Telemetría del móvil → despachar por evento ──────────────────────
    socket.on('cambio_diapositiva', (data) => {
      const ev = data.evento;
      if (handlers[ev])  handlers[ev].forEach(fn => fn(data));
      if (handlers['*']) handlers['*'].forEach(fn => fn(data));
    });

    // ── Contador de dispositivos conectados ──────────────────────────────
    socket.on('device_counts', ({ web, mobile }) => {
      const label = document.getElementById('ws-label');
      if (!label) return;
      if (mobile > 0) {
        label.textContent = `${mobile} móvil${mobile > 1 ? 'es' : ''} conectado${mobile > 1 ? 's' : ''}`;
      } else {
        label.textContent = 'Esperando móvil...';
      }
    });
  }

  // ── API pública ──────────────────────────────────────────────────────────

  /** Registra un handler para un evento de telemetría. */
  function on(evento, cb) {
    if (!handlers[evento]) handlers[evento] = [];
    handlers[evento].push(cb);
  }

  /**
   * Emite un evento directo al servidor (web → server).
   * Usado por app.js para notificar slide changes al móvil.
   */
  function emit(evento, data) {
    if (socket && socket.connected) socket.emit(evento, data);
  }

  /** Log interno — despacha a los listeners de '__log'. */
  function log(origin, msg, type = 'info') {
    const ts    = new Date().toLocaleTimeString();
    const entry = { ts, origin, msg, type };
    if (handlers['__log']) handlers['__log'].forEach(fn => fn(entry));
    return entry;
  }

  function setHUD(connected, customLabel = null) {
    const hud   = document.getElementById('ws-hud');
    const label = document.getElementById('ws-label');
    if (!hud) return;
    hud.classList.toggle('connected', connected);
    if (!connected) label.textContent = customLabel || 'Reconectando...';
  }

  connect();
  return { on, emit, log, raw: () => socket };
})();
