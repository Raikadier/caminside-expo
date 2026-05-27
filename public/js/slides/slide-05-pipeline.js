/* slide-05-pipeline.js — Pipeline de Captura Simultánea · Canvas Animation */
(function () {

  const canvas = document.getElementById('pipeline-canvas');
  const logEl  = document.getElementById('log-pipeline');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, raf, frame = 0;

  const SURFACES = {
    preview:  { active: false, color: '#eab308', label: 'Preview Surface',  sub: '30–60 FPS · GPU' },
    capture:  { active: false, color: '#f97316', label: 'Capture Surface',  sub: 'JPEG · Full Res' },
    analysis: { active: false, color: '#22c55e', label: 'Analysis Surface', sub: 'YUV_420_888 · RAM' },
  };

  /* Flowing particles per surface */
  const particles = { preview: [], capture: [], analysis: [] };

  /* ── Resize canvas to container ────────────────────────── */
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    W = canvas.width  = rect.width  || 900;
    H = canvas.height = rect.height || 200;
  }

  /* ── Particle factory ──────────────────────────────────── */
  function spawnParticle(key) {
    return { t: Math.random(), speed: 0.006 + Math.random() * 0.008, alpha: 0 };
  }

  function ensureParticles() {
    ['preview', 'capture', 'analysis'].forEach(k => {
      while (particles[k].length < 6) particles[k].push(spawnParticle(k));
    });
  }

  /* ── Layout helpers ────────────────────────────────────── */
  function layout() {
    return {
      sensorX: W * 0.09,
      sensorY: H * 0.5,
      sensorR: Math.min(W, H) * 0.085,
      forkX:   W * 0.30,
      endX:    W * 0.65, /* PROP-9: 0.80 cortaba las etiquetas de texto en el borde derecho del canvas */
      ys: [H * 0.20, H * 0.5, H * 0.80],
    };
  }

  /* Punto a lo largo de una curva cúbica (para animar partículas) */
  function cubicPoint(t, x0,y0, cx1,cy1, cx2,cy2, x1,y1) {
    const u = 1 - t;
    return {
      x: u*u*u*x0 + 3*u*u*t*cx1 + 3*u*t*t*cx2 + t*t*t*x1,
      y: u*u*u*y0 + 3*u*u*t*cy1 + 3*u*t*t*cy2 + t*t*t*y1,
    };
  }

  /* ── Draw ──────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const L = layout();
    frame++;

    /* --- Sensor --- */
    const pulse = 0.85 + Math.sin(frame * 0.06) * 0.15;
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20 * pulse;
    ctx.beginPath();
    ctx.arc(L.sensorX, L.sensorY, L.sensorR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,240,255,${0.12 * pulse})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0,240,255,${0.6 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(9, H * 0.07)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('SENSOR', L.sensorX, L.sensorY - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${Math.max(7, H * 0.055)}px 'JetBrains Mono', monospace`;
    ctx.fillText('ÓPTICO', L.sensorX, L.sensorY + 14);

    /* --- Main stem sensor → fork (curva suave) --- */
    ctx.beginPath();
    ctx.moveTo(L.sensorX + L.sensorR, L.sensorY);
    ctx.lineTo(L.forkX, L.sensorY);
    ctx.strokeStyle = 'rgba(0,240,255,0.4)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.stroke();

    /* Nodo de bifurcación */
    ctx.beginPath();
    ctx.arc(L.forkX, L.sensorY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,240,255,0.6)';
    ctx.fill();

    /* --- FIX ③: 3 ramas con curvas cúbicas suaves desde el punto de bifurcación --- */
    const keys = ['preview', 'capture', 'analysis'];
    const endR = H * 0.058; /* radio del círculo final */
    const labelOffX = endR + 8; /* offset del label respecto al centro del círculo */

    keys.forEach((key, i) => {
      const s    = SURFACES[key];
      const y    = L.ys[i];
      const actv = s.active;

      /* Curva cúbica: arranque horizontal desde forkX, llega horizontal al endX
         Los puntos de control crean una S suave */
      const cp1x = L.forkX + (L.endX - L.forkX) * 0.35;
      const cp1y = L.sensorY;
      const cp2x = L.forkX + (L.endX - L.forkX) * 0.55;
      const cp2y = y;

      ctx.beginPath();
      ctx.moveTo(L.forkX, L.sensorY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, L.endX, y);
      ctx.strokeStyle = actv ? s.color : 'rgba(255,255,255,0.1)';
      ctx.lineWidth   = actv ? 2.5 : 1;
      ctx.globalAlpha = actv ? 0.9 : 0.25;
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* Círculo endpoint — separado del label */
      ctx.save();
      ctx.shadowColor = s.color;
      ctx.shadowBlur  = actv ? 22 : 5;
      ctx.beginPath();
      ctx.arc(L.endX, y, endR, 0, Math.PI * 2);
      ctx.fillStyle   = actv ? `${s.color}22` : 'rgba(255,255,255,0.03)';
      ctx.fill();
      ctx.strokeStyle = actv ? s.color : 'rgba(255,255,255,0.12)';
      ctx.lineWidth   = actv ? 2 : 1;
      ctx.stroke();
      ctx.restore();

      /* Label a la DERECHA del círculo, no encima */
      const lx = L.endX + endR + 10;
      ctx.textAlign   = 'left';
      ctx.fillStyle   = actv ? s.color : 'rgba(255,255,255,0.25)';
      ctx.font        = `bold ${Math.max(8, H * 0.058)}px 'JetBrains Mono', monospace`;
      ctx.fillText(s.label, lx, y - 5);
      ctx.fillStyle   = actv ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
      ctx.font        = `${Math.max(7, H * 0.047)}px 'JetBrains Mono', monospace`;
      ctx.fillText(s.sub, lx, y + 10);

      /* Partículas viajando por la curva cúbica */
      if (actv) {
        particles[key].forEach(p => {
          p.t     = (p.t + p.speed) % 1;
          p.alpha = Math.min(p.alpha + 0.04, 1);
          const pos = cubicPoint(p.t, L.forkX, L.sensorY, cp1x, cp1y, cp2x, cp2y, L.endX, y);
          ctx.save();
          ctx.globalAlpha = p.alpha * (0.4 + 0.6 * Math.sin(p.t * Math.PI));
          ctx.shadowColor = s.color;
          ctx.shadowBlur  = 10;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();
          ctx.restore();
        });
      } else {
        particles[key].forEach(p => { p.alpha = Math.max(p.alpha - 0.05, 0); });
      }
    });

    /* Surface card meters */
    keys.forEach(key => {
      const fill = document.querySelector(`.surf-card[data-surface="${key}"] .surf-fill`);
      if (!fill) return;
      const actv = SURFACES[key].active;
      let target = actv ? (key === 'preview' ? 80 + Math.sin(frame * 0.08) * 15 : key === 'analysis' ? 60 + Math.sin(frame * 0.05 + 1) * 20 : 0) : 0;
      if (key === 'capture' && SURFACES.capture.active) target = 100;
      fill.style.width = `${Math.max(0, target)}%`;
    });

    raf = requestAnimationFrame(draw);
  }

  /* ── Surface controls ──────────────────────────────────── */
  function activateSurface(key) {
    SURFACES[key].active = true;
    const card = document.querySelector(`.surf-card[data-surface="${key}"]`);
    if (card) {
      card.classList.add('active');
      card.style.setProperty('--gc', SURFACES[key].color);
    }
  }

  function deactivateSurface(key) {
    SURFACES[key].active = false;
    document.querySelector(`.surf-card[data-surface="${key}"]`)?.classList.remove('active');
  }

  function startStream() {
    activateSurface('preview');
    activateSurface('analysis');
    addLog('Preview Surface: stream a 30 FPS iniciado · GPU renderizando', 'ok');
    setTimeout(() => addLog('Analysis Surface: buffer YUV_420_888 fluyendo a RAM', 'ok'), 600);
  }

  function triggerCapture() {
    activateSurface('capture');
    addLog('Capture Surface: frame congelado en resolución máxima', 'warn');
    setTimeout(() => {
      addLog('Capture Surface: compresión JPEG completada · guardado en disco ✓', 'ok');
      setTimeout(() => deactivateSurface('capture'), 800);
    }, 900);
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
  SOCKET.on('capture_event', (data) => {
    const d = data.data || data;
    if (['capturar', 'photo', 'capture'].includes(d.accion)) triggerCapture();
    if (['start_preview', 'start'].includes(d.accion) || d.iniciar) startStream();
    SOCKET.log('pipeline', `Evento: ${JSON.stringify(d)}`);
  });

  SOCKET.on('tab_change', (data) => {
    if ((data.data || data).tab === 5) {
      addLog('Pestaña Pipeline activa en el dispositivo móvil', 'info');
      startStream();
    }
  });

  /* ── Slide enter ───────────────────────────────────────── */
  document.addEventListener('caminside:slide', ({ detail }) => {
    if (detail.index === 5) {
      resizeCanvas();
      ensureParticles();
      if (!raf) draw();
      startStream();
    } else {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
  });

  /* ── Init ──────────────────────────────────────────────── */
  // B-9: NO arrancar draw() ni startStream() aquí — se inician lazy en
  // caminside:slide para que el canvas loop no corra desde el inicio de la sesión.
  resizeCanvas();
  ensureParticles();

})();
