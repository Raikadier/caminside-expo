# Cámara Android: Bajo el Capó — Diapositiva Interactiva

Diapositiva web de la exposición **"Cámara Android: Bajo el Capó"**.  
Construida con Reveal.js + Node.js + Socket.io. Recibe telemetría en tiempo real desde la app móvil [CamInside](https://github.com/Raikadier/caminside) y la visualiza en cada slide.

> **Universidad Popular del Cesar · Ingeniería de Sistemas · Programación Móvil · Mayo 2026**

---

## Índice

1. [¿Qué es este proyecto?](#qué-es-este-proyecto)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Ejecutar el servidor](#ejecutar-el-servidor)
5. [Descripción de cada slide](#descripción-de-cada-slide)
6. [Conectar la app móvil](#conectar-la-app-móvil)
7. [Arquitectura del proyecto](#arquitectura-del-proyecto)
8. [Protocolo WebSocket](#protocolo-websocket)
9. [Setup completo el día de la expo](#setup-completo-el-día-de-la-expo)
10. [Solución de problemas](#solución-de-problemas)

---

## ¿Qué es este proyecto?

Este repo contiene dos cosas:

1. **La diapositiva** — 8 slides construidos con [Reveal.js](https://revealjs.com) que explican el stack de software de cámara en Android, desde la HAL hasta ML Kit
2. **El servidor** — un servidor Node.js/Express que sirve la diapositiva y actúa como puente WebSocket entre la app móvil y el browser

Cuando el presentador interactúa con la app [CamInside](https://github.com/Raikadier/caminside) en su teléfono, los datos llegan al servidor y este los reenvía al browser que muestra la diapositiva en el proyector. También funciona al revés: si el presentador cambia el slide desde el teclado/mouse, la app del teléfono cambia de tab automáticamente.

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18.0.0 | [nodejs.org](https://nodejs.org) |
| npm | incluido con Node.js | — |

Verificar instalación:
```bash
node --version   # debe mostrar v18.x.x o superior
npm --version
```

> No se necesita ningún framework adicional. El servidor usa únicamente Express y Socket.io.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Raikadier/caminside-expo.git
cd caminside-expo
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instala Express y Socket.io. Solo se hace una vez.

---

## Ejecutar el servidor

### Opción A — Script automático (recomendado para la expo)

Doble clic en **`iniciar-expo.bat`**.

El script:
1. Detecta la IP local del PC y la muestra en pantalla
2. Instala dependencias si es la primera vez
3. Abre el servidor en una ventana separada
4. Abre la diapositiva en el navegador automáticamente

### Opción B — Comando manual

```bash
node server.js
```

La diapositiva queda disponible en:
- **En el mismo PC:** `http://localhost:3000`
- **Desde el teléfono (misma red):** `http://<IP-del-PC>:3000`

Para obtener la IP del PC en Windows:
```
ipconfig
```
Buscar "Dirección IPv4" bajo el adaptador WiFi.

### Logs del servidor

Cuando el servidor corre, la consola muestra cada evento en tiempo real:

```
[+] Socket conectado:  abc123
[•] web    identificado | web: 1  mobile: 0
[•] mobile identificado | web: 1  mobile: 1
[→] hal_info               | {"capa":"hal","focal_length":4.2}
[←] slide_changed          | index: 2
```

---

## Descripción de cada slide

### Slide 0 — Portada

Pantalla de bienvenida con el nombre de la exposición, institución y una consola que muestra en vivo cuando el dispositivo móvil se conecta.

**Elementos en pantalla:**
- Título animado con efecto scanline
- Pillares temáticos: HAL · ISP · CameraX · ML Kit
- Consola `telemetria@caminside` que registra la conexión del móvil

### Slide 1 — Arquitectura HAL

Explica las 5 capas del sistema de cámara Android:

```
┌─────────────────────────────┐
│  Application Layer          │  Flutter · Widget Tree
├─────────────────────────────┤
│  Framework / SDK Layer      │  camera package · Platform Channel
├─────────────────────────────┤
│  HAL (Hardware Abstraction) │  android.hardware.camera.provider@2.7
├─────────────────────────────┤
│  Kernel Driver Layer        │  V4L2 · DMA Buffers · IRQ
├─────────────────────────────┤
│  Linux Kernel / Hardware    │  CMOS Sensor · ISP · MIPI CSI-2
└─────────────────────────────┘
```

**Interactividad en vivo:**
- Cuando el presentador toca una capa en la app, esa capa se ilumina en la diapositiva con el color correspondiente
- Cuando la app lee las características del `CameraManager`, aparecen en el log: focal length, apertura, número de cámaras, orientación del sensor, resolución de preview

**Sin app conectada:** las capas se activan automáticamente en secuencia cada 1.8 segundos.

### Slide 2 — ISP (Image Signal Processor)

Visualiza el procesamiento de imagen desde el sensor RAW hasta el píxel final.

**Elementos:**
- Cuadrícula Bayer 8×8 con el patrón RGGB coloreado
- 4 pasos del pipeline que se activan en bucle: `Demosaicing → Noise Reduction → White Balance → Tonemapping`
- Slider de Balance de Blancos (2500K – 8000K)
- Muestra de color de salida en función de la temperatura

**Interactividad en vivo:**
- El slider de la app (tab ISP) mueve el slider en la diapositiva en tiempo real
- Los colores de la cuadrícula Bayer cambian según la temperatura

### Slide 3 — APIs de Cámara

Compara dos enfoques de acceso a la cámara en Android:

| Métrica | Platform Channel (Camera2) | Flutter Camera Package |
|---|---|---|
| Líneas de código | ~280 | ~35 |
| Tiempo de inicialización | ~1020ms | ~74ms |
| Ahorro | — | −87% código |

**Elementos:**
- Dos columnas de código (`camera2` nativo vs Flutter package)
- Botón "Simular inicialización" → animación de barras de progreso comparativa
- Terminal con los tiempos medidos

### Slide 4 — Ciclo de Vida

Muestra los 4 estados `AppLifecycleState` de Flutter y cómo afectan a la cámara.

```
resumed   → Cámara activa, sesión abierta
inactive  → Transición, app perdiendo foco
paused    → App en background, hardware liberado
detached  → App destruida, recursos liberados
```

**Interactividad en vivo:**
- Cuando el presentador minimiza o bloquea el teléfono, el estado cambia en la diapositiva en tiempo real
- También puede simular estados manualmente desde los botones del tab 4
- Al entrar al slide se ejecuta automáticamente una simulación de bloqueo/desbloqueo

### Slide 5 — Pipeline de Captura

Explica las tres superficies simultáneas de CameraX con una animación canvas:

```
         ┌──── Preview Surface  ──→ GPU · 30-60 FPS
SENSOR ──┼──── Capture Surface  ──→ JPEG · Full Res · Disco
         └──── Analysis Surface ──→ YUV_420_888 · RAM
```

**Elementos:**
- Canvas animado con partículas viajando por cada rama del pipeline
- Tres tarjetas de superficie con medidores de actividad en tiempo real

**Interactividad en vivo:**
- Cuando la app inicia el stream (tab Pipeline) → el canvas se activa
- Cuando la app toma una foto → la rama Capture Surface pulsa en la animación

### Slide 6 — Extensiones CameraX

Contrasta el método antiguo (screenshot del preview) con las extensiones nativas del fabricante.

| Método | Calidad | Acceso al ISP |
|---|---|---|
| Screenshot del preview | 28% | No |
| CameraX Extensions API | 94% | Sí (HDR, Modo Noche, Bokeh) |

**Interactividad en vivo:**
- Cuando el presentador selecciona un modo en la app, la tarjeta correspondiente se resalta en la diapositiva

### Slide 7 — Google ML Kit

Muestra el pipeline de inferencia de ML Kit para detección de códigos QR:

```
CameraImage → planes[0] (Y) → ML Kit → JSON → Socket
```

**Elementos:**
- Visualización de los planos YUV_420_888 (Y · U · V) con el submuestreo 4:2:0
- Terminal verde en tiempo real con cada detección
- Contador de FPS

**Interactividad en vivo:**
- Cuando la app escanea un QR, el resultado aparece en el terminal: tipo, valor, formato, coordenadas

---

## Conectar la app móvil

### Requisitos de red

- El PC con el servidor y el teléfono deben estar en la **misma red WiFi**
- La red universitaria a veces bloquea tráfico entre dispositivos → usar el **hotspot del teléfono** como alternativa

### Cómo se identifica cada cliente

Al conectar, cada cliente envía su rol al servidor:

| Cliente | Mensaje | Room |
|---|---|---|
| Browser (diapositiva) | `identify: 'web'` | `web` |
| App Flutter (teléfono) | `identify: 'mobile'` | `mobile` |

El servidor usa rooms de Socket.io para que los mensajes solo lleguen al destino correcto, evitando loops.

### El HUD de conexión

En la esquina superior derecha de la diapositiva hay un indicador de estado:

- **Punto gris · "Conectando..."** → servidor iniciado, esperando el móvil
- **Punto verde · "1 móvil conectado"** → sistema listo, todo funciona
- **Punto gris · "Esperando móvil..."** → el servidor corre pero el teléfono no está conectado

---

## Arquitectura del proyecto

```
caminside-expo/
├── server.js              # Servidor Express + Socket.io (punto de entrada)
├── package.json           # Dependencias: express, socket.io
├── iniciar-expo.bat       # Script de inicio para Windows
└── public/                # Archivos estáticos servidos por Express
    ├── index.html         # HTML de los 8 slides (Reveal.js)
    ├── css/
    │   └── custom.css     # Todo el diseño visual de la diapositiva
    └── js/
        ├── socket-client.js       # Cliente WebSocket del browser
        ├── app.js                 # Inicialización de Reveal.js y navegación
        ├── particles.js           # Animación de fondo (partículas)
        ├── three-scene.js         # Módulo de cámara 3D en Three.js (slide ISP)
        └── slides/
            ├── slide-01-hal.js    # Lógica del slide HAL
            ├── slide-02-isp.js    # Lógica del slide ISP
            ├── slide-03-apis.js   # Lógica del slide APIs
            ├── slide-04-lifecycle.js  # Lógica del slide Lifecycle
            ├── slide-05-pipeline.js   # Lógica del slide Pipeline (Canvas)
            ├── slide-06-extensions.js # Lógica del slide Extensions
            └── slide-07-mlkit.js      # Lógica del slide ML Kit
```

### Responsabilidades del servidor (`server.js`)

- Sirve los archivos estáticos de `public/`
- Gestiona dos rooms de Socket.io: `web` y `mobile`
- **`telemetria_movil`** (móvil → web): reenvía los datos solo a la room `web`
- **`slide_changed`** (web → móvil): reenvía el índice del slide solo a la room `mobile`
- **`device_counts`**: notifica a todos cuántos dispositivos están conectados en cada room

---

## Protocolo WebSocket

### Eventos que llegan desde la app (móvil → diapositiva)

| Evento | Datos | Slide que lo recibe |
|---|---|---|
| `hal_info` | `{ capa, focal_length, aperture, nivel_soporte, camera_count, lens_direction, sensor_orientation, preview_size }` | Slide 1 — HAL |
| `isp_white_balance` | `{ temperatura }` (2500–8000 K) | Slide 2 — ISP |
| `capture_event` | `{ accion }` (`start_preview` / `capturar`) | Slide 5 — Pipeline |
| `extension_mode` | `{ modo }` (`nativa` / `screenshot`) | Slide 6 — Extensions |
| `mlkit_result` | `{ tipo, valor, formato, confianza, coordenadas }` | Slide 7 — ML Kit |
| `lifecycle_event` | `{ estado }` (`resumed` / `paused` / `inactive` / `detached`) | Slide 4 — Lifecycle |
| `tab_change` | `{ tab }` (1–7) | Todos (log de actividad) |
| `navigate` | `{ slide }` (0–7) | `app.js` — mueve Reveal.js |

### Eventos que llegan desde la diapositiva (web → app)

| Evento | Datos | Efecto en la app |
|---|---|---|
| `slide_changed` | `{ index }` | La app cambia al tab correspondiente |

### Anti-loop de sincronización

Para evitar que los cambios de slide se retroalimenten infinitamente:

```
Usuario cambia tab en app  →  navigateSlide()  →  emit('navigate')  →  Reveal.js cambia slide
Reveal.js cambia slide     →  emit('slide_changed') →  slide_sync al móvil
Móvil recibe slide_sync    →  _syncingFromWeb = true  →  cambia tab SIN emitir navigate
```

La bandera `_syncingFromWeb` en la app evita que el evento `slide_sync` genere un nuevo `navigate` que volvería a mover el slide web.

---

## Setup completo el día de la expo

### Lo que necesitas

- [ ] PC con Node.js instalado y este repo clonado
- [ ] Teléfono Android con la app CamInside instalada (ver [caminside](https://github.com/Raikadier/caminside))
- [ ] Cable USB o scrcpy configurado para proyectar el teléfono
- [ ] Proyector o pantalla conectado al PC
- [ ] WiFi compartido entre PC y teléfono (o hotspot del teléfono)

### Pasos (15 minutos antes de empezar)

**1. Iniciar el servidor**
```
Doble clic en iniciar-expo.bat
```
Aparece la IP del PC. La diapositiva se abre en el navegador automáticamente.

**2. Poner el navegador en pantalla completa**
```
F11
```

**3. Conectar la app del teléfono**
- Abrir CamInside en el teléfono
- Ingresar `http://<IP-del-PC>:3000` en el diálogo de conexión
- El HUD de la diapositiva mostrará **"1 móvil conectado"**

**4. Proyectar el teléfono con scrcpy (opcional pero recomendado)**
```bash
scrcpy
```
Ajustar la ventana de scrcpy al lado de la diapositiva en el proyector.

**5. Verificar que todo funciona**
- Cambiar de tab en la app → la diapositiva debe cambiar de slide
- Tocar una capa en el tab HAL → la diapositiva debe iluminar esa capa

### Durante la presentación

- **Navegar slides:** usar los botones PREV/NEXT de la app, las teclas de flecha en el teclado, o los controles de Reveal.js
- **Volver a la portada:** botón de casa (🏠) en la barra superior de la app

---

## Solución de problemas

### La diapositiva no carga en el navegador
- Verificar que el servidor está corriendo (debe haber una ventana de terminal con logs)
- Probar abrir `http://localhost:3000` manualmente en el navegador
- Si dice "No se puede conectar", relanzar `iniciar-expo.bat`

### El teléfono no conecta (HUD no cambia a "1 móvil conectado")
- Verificar que PC y teléfono están en la misma red WiFi
- Confirmar la IP correcta del PC con `ipconfig`
- Probar abrir `http://<IP-del-PC>:3000` en el **navegador del teléfono** para ver si la diapositiva carga — si carga, la app también puede conectar
- Desactivar el firewall de Windows temporalmente

### Los datos no aparecen en la diapositiva
- El HUD debe mostrar **"1 móvil conectado"** — si no, revisar la conexión primero
- Verificar que el tab activo en la app corresponde al slide visible en la diapositiva

### La animación del canvas (Pipeline) no arranca
- La animación es lazy — solo inicia al navegar al slide 5
- Si no arranca, navegar a otro slide y volver al 5

### `npm install` falla
- Verificar Node.js instalado: `node --version`
- Borrar la carpeta `node_modules/` y repetir `npm install`

---

## Dependencias

| Paquete | Versión | Uso |
|---|---|---|
| `express` | ^4.18.2 | Servidor HTTP, sirve archivos estáticos |
| `socket.io` | ^4.7.2 | WebSocket server, gestión de rooms |

CDNs cargados en el browser (requieren internet):

| Librería | Versión | Uso |
|---|---|---|
| Reveal.js | 5.0.4 | Motor de presentación de slides |
| Three.js | r128 | Modelo 3D de cámara en el slide ISP |
| highlight.js | 11.9.0 | Resaltado de sintaxis de código |
| Socket.io client | 4.7.2 | Conexión WebSocket desde el browser |

---

*Proyecto académico — Universidad Popular del Cesar · 2026*
