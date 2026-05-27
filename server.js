const express = require('express');
const http    = require('http');
const path    = require('path');
const os      = require('os');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── IP local del servidor ──────────────────────────────────────────────────
function getLocalIPs() {
  const nets = os.networkInterfaces();
  const ips  = [];
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

// ── Endpoints de configuración / audiencia ────────────────────────────────
app.get('/api/config', (_, res) => {
  const ips  = getLocalIPs();
  const port = process.env.PORT || 3000;
  const base = `http://${ips[0] || 'localhost'}:${port}`;
  res.json({ ips, port, url: base, audienceUrl: `${base}/audience` });
});

app.get('/audience', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'audience.html')));

// ── Helpers de conteo ──────────────────────────────────────────────────────
function roomSize(name) {
  return io.sockets.adapter.rooms.get(name)?.size ?? 0;
}

function broadcastCounts() {
  io.emit('device_counts', {
    web:      roomSize('web'),
    mobile:   roomSize('mobile'),
    audience: roomSize('audience'),
  });
}

// ── Conexiones ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Socket conectado:  ${socket.id}`);

  socket.on('identify', (role) => {
    if (!['web', 'mobile', 'audience'].includes(role)) return;
    socket.join(role);
    broadcastCounts();
    console.log(
      `[•] ${role.padEnd(8)} id | web:${roomSize('web')} ` +
      `mobile:${roomSize('mobile')} audience:${roomSize('audience')}`
    );
  });

  // ── Móvil → Web ──────────────────────────────────────────────────────────
  socket.on('telemetria_movil', (data) => {
    console.log(`[→] ${String(data.evento).padEnd(22)} | ${JSON.stringify(data.data ?? {}).slice(0, 80)}`);
    socket.to('web').emit('cambio_diapositiva', data);
  });

  // ── Web → Móvil + Audiencia ──────────────────────────────────────────────
  socket.on('slide_changed', (data) => {
    console.log(`[←] slide_changed     | index: ${data.index}`);
    socket.to('mobile').emit('slide_sync', { index: data.index });
    socket.to('audience').emit('slide_sync', { index: data.index });
  });

  // ── Latencia round-trip ──────────────────────────────────────────────────
  socket.on('latency_ping', (t0) => socket.emit('latency_pong', t0));

  // ── Desconexión ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Socket desconectado: ${socket.id}`);
    setImmediate(broadcastCounts);
  });
});

// ── Arranque ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n══════════════════════════════════════════════');
  console.log('  Cámara Android: Bajo el Capó — Servidor');
  console.log(`  http://localhost:${PORT}   (diapositiva)`);
  ips.forEach(ip => console.log(`  http://${ip}:${PORT}  (móvil · audiencia)`));
  console.log('══════════════════════════════════════════════\n');
});
