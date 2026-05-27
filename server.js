const express = require('express');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── Helpers de conteo ──────────────────────────────────────────────────────
function roomSize(name) {
  return io.sockets.adapter.rooms.get(name)?.size ?? 0;
}

function broadcastCounts() {
  io.emit('device_counts', {
    web:    roomSize('web'),
    mobile: roomSize('mobile'),
  });
}

// ── Conexiones ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Socket conectado:  ${socket.id}`);

  // ── Identificación de rol ────────────────────────────────────────────────
  // El cliente envía 'identify' con 'web' o 'mobile' justo al conectar.
  socket.on('identify', (role) => {
    if (role !== 'web' && role !== 'mobile') return;
    socket.join(role);
    broadcastCounts();
    console.log(`[•] ${role.padEnd(6)} identificado | web: ${roomSize('web')}  mobile: ${roomSize('mobile')}`);
  });

  // ── Móvil → Web: telemetría de cámara ───────────────────────────────────
  // La app Flutter emite 'telemetria_movil'.
  // El server lo reenvía SOLO a los clientes web (evita loopback al móvil).
  socket.on('telemetria_movil', (data) => {
    console.log(`[→] ${String(data.evento).padEnd(22)} | ${JSON.stringify(data.data ?? {}).slice(0, 80)}`);
    socket.to('web').emit('cambio_diapositiva', data);
  });

  // ── Web → Móvil: el presentador cambió de slide ──────────────────────────
  // El browser emite 'slide_changed' en cada slidechanged de Reveal.js.
  // El server lo reenvía SOLO al móvil para sincronizar el tab activo.
  socket.on('slide_changed', (data) => {
    console.log(`[←] slide_changed     | index: ${data.index}`);
    socket.to('mobile').emit('slide_sync', { index: data.index });
  });

  // ── Desconexión ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Socket desconectado: ${socket.id}`);
    // Esperar un tick para que Socket.io actualice los rooms antes de contar
    setImmediate(broadcastCounts);
  });
});

// ── Arranque ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n══════════════════════════════════════════════');
  console.log('  Cámara Android: Bajo el Capó — Servidor');
  console.log(`  http://localhost:${PORT}   (diapositiva)`);
  console.log(`  Red local: http://<IP-PC>:${PORT}  (app móvil)`);
  console.log('══════════════════════════════════════════════\n');
});
