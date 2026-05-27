/* slide-03-apis.js — Comparativa Platform Channel vs Flutter Camera Package */
(function () {

  const logEl = document.getElementById('log-apis');

  /* ── Código de ejemplo ─────────────────────────────────── */
  const CODE_OLD = `// platform_camera.dart — Platform Channel directo (~280 líneas)
// Acceso manual a Camera2 via MethodChannel
import 'package:flutter/services.dart';

class NativeCameraChannel {
  static const _ch = MethodChannel('dev.caminside/camera');
  late StreamController<Map> _evts;
  bool _open = false;

  Future<void> initCamera({
    required int width,
    required int height,
  }) async {
    await _ch.invokeMethod('requestPermission');
    final ids = await _ch.invokeMethod<List>('getCameraIds');

    // Abrir dispositivo de cámara manualmente
    await _ch.invokeMethod('openCamera', {
      'id': ids!.first, 'width': width, 'height': height,
    });
    _open = true;
    _evts = StreamController.broadcast();

    // Configurar sesión de captura
    await _ch.invokeMethod('createCaptureSession', {
      'templateType': 'TEMPLATE_PREVIEW',
    });
    await _ch.invokeMethod('setRepeatingRequest');

    // Gestionar callbacks manualmente desde nativo
    _ch.setMethodCallHandler((call) async {
      switch (call.method) {
        case 'onCameraOpened':
          _evts.add({'type': 'opened'});
          break;
        case 'onCameraDisconnected':
          await dispose();
          break;
        case 'onCameraError':
          _evts.add({'type': 'error', 'code': call.arguments});
          break;
        case 'onFrame':
          // Bytes YUV mapeados manualmente
          _evts.add({'type': 'frame', 'bytes': call.arguments});
          break;
      }
    });
  }

  Future<void> capture() async {
    if (!_open) throw StateError('Cámara no inicializada');
    await _ch.invokeMethod('stopRepeating');
    await _ch.invokeMethod('capture');
    await _ch.invokeMethod('setRepeatingRequest');
  }

  Future<void> dispose() async {
    if (!_open) return;
    await _ch.invokeMethod('closeSession');
    await _ch.invokeMethod('closeCamera');
    await _evts.close();
    _open = false;
  }
  // ... +190 líneas de manejo de orientación,
  // permisos, concurrencia, errores de HAL...
}`;

  const CODE_NEW = `// camera_screen.dart — Flutter Camera Package (~35 líneas)
// El paquete gestiona HAL, lifecycle y concurrencia internamente
import 'package:camera/camera.dart';

class CamInsideScreen extends StatefulWidget {
  const CamInsideScreen({super.key});
  @override
  State<CamInsideScreen> createState() => _State();
}

class _State extends State<CamInsideScreen> {
  late CameraController _ctrl;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    // Una línea obtiene todas las cámaras disponibles
    final cams = await availableCameras();

    _ctrl = CameraController(
      cams.first,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.yuv420,
    );

    await _ctrl.initialize();

    // Stream de análisis frame a frame
    await _ctrl.startImageStream(_onFrame);
    setState(() => _ready = true);
  }

  void _onFrame(CameraImage img) {
    // Y  → img.planes[0].bytes (Luminancia para ML Kit)
    // U  → img.planes[1].bytes (Crominancia Cb)
    // V  → img.planes[2].bytes (Crominancia Cr)
    TelemetriaSocket.enviar(img);
  }

  @override
  void dispose() {
    _ctrl.dispose(); // Lifecycle gestionado automáticamente
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      _ready ? CameraPreview(_ctrl) : const SizedBox();
}`;

  /* ── Render code blocks ────────────────────────────────── */
  function renderCode() {
    const oldEl = document.getElementById('code-old');
    const newEl = document.getElementById('code-new');
    if (oldEl) oldEl.textContent = CODE_OLD;
    if (newEl) newEl.textContent = CODE_NEW;

    /* Defer highlight until Reveal is done rendering */
    setTimeout(() => {
      if (window.hljs) {
        document.querySelectorAll('#code-old, #code-new').forEach(el => {
          hljs.highlightElement(el);
        });
      }
    }, 200);
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

  /* ── Simulate initialization ───────────────────────────── */
  document.getElementById('btn-init-camera')?.addEventListener('click', () => {
    logEl.innerHTML = '';
    addLog('Platform Channel: requestPermission() → 43ms', 'warn');
    setTimeout(() => addLog('Platform Channel: getCameraIds() → 18ms', 'warn'), 300);
    setTimeout(() => addLog('Platform Channel: openCamera() → 210ms ⚠ bloqueo de hilo', 'warn'), 700);
    setTimeout(() => addLog('Platform Channel: createCaptureSession() → 85ms', 'warn'), 1100);
    setTimeout(() => addLog('Platform Channel: TOTAL → ~356ms · 280 líneas de código', 'warn'), 1500);
    setTimeout(() => addLog('────────────────────────────────────', 'dim'), 1700);
    setTimeout(() => addLog('Flutter Camera: availableCameras() → 8ms', 'ok'), 2000);
    setTimeout(() => addLog('Flutter Camera: CameraController.initialize() → 62ms', 'ok'), 2300);
    setTimeout(() => addLog('Flutter Camera: startImageStream() → 4ms', 'ok'), 2600);
    setTimeout(() => addLog('Flutter Camera: TOTAL → ~74ms · 35 líneas de código ✓', 'ok'), 3000);
    setTimeout(() => addLog('Reducción: −87% código · −79% tiempo de inicio ✓', 'ok'), 3400);
    SOCKET.log('apis', 'Comparativa de inicialización ejecutada');
  });

  /* ── Socket events ─────────────────────────────────────── */
  SOCKET.on('tab_change', (data) => {
    if ((data.data || data).tab === 3) {
      addLog('Pestaña APIs activa en el dispositivo móvil', 'info');
    }
  });

  /* ── Slide enter ───────────────────────────────────────── */
  document.addEventListener('caminside:slide', ({ detail }) => {
    if (detail.index === 3) {
      /* Re-highlight on every entry (fixes initial render race) */
      setTimeout(() => {
        if (window.hljs) {
          document.querySelectorAll('#code-old, #code-new').forEach(el => hljs.highlightElement(el));
        }
      }, 150);
    }
  });

  /* ── Init ──────────────────────────────────────────────── */
  renderCode();

})();
