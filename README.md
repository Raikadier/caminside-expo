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
9. [🎓 Tutorial Completo — Día de la Expo](#-tutorial-completo--día-de-la-expo)
10. [📋 Guión de Exposición con Anotaciones](#-guión-de-exposición-con-anotaciones)
11. [🔗 Recursos y Bibliografía](#-recursos-y-bibliografía)

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
- Modelo 3D de cámara (Three.js WebGL) con etiquetas didácticas animadas: Sistema Óptico · Sensor CMOS · ISP/SoC · PCB
- Cuadrícula Bayer 8×8 con el patrón RGGB coloreado
- 4 pasos del pipeline que se activan en bucle: `Demosaicing → Noise Reduction → White Balance → Tonemapping`
- Slider de Balance de Blancos (2500K – 8000K)
- Muestra de color de salida en función de la temperatura

**Interactividad en vivo:**
- El slider de la app (tab ISP) mueve el slider en la diapositiva en tiempo real
- Los colores de la cuadrícula Bayer y el modelo 3D cambian según la temperatura de color

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
- **Zoom y pan** disponibles: rueda del ratón o botones `+` / `⊙` / `−` en la esquina del canvas; doble clic para resetear

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
├── docs/                  # Documentos del proyecto
│   └── ARCHIVO_3_GUION_EXPOSICION.txt
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

---

# 🎓 Tutorial Completo — Día de la Expo

> Esta sección es la guía operativa del día. Léela entera **al menos una vez antes del día de la exposición**. Está diseñada para que cualquier integrante pueda ejecutar el setup aunque sea la primera vez que toca el sistema.

---

## Índice del Tutorial

- [Parte 1 — El día anterior: prueba en casa](#parte-1--el-día-anterior-prueba-en-casa)
- [Parte 2 — Qué llevar el día de la expo](#parte-2--qué-llevar-el-día-de-la-expo)
- [Parte 3 — Setup completo (30 min antes)](#parte-3--setup-completo-30-min-antes)
- [Parte 4 — Guía slide por slide: qué hacer mientras hablas](#parte-4--guía-slide-por-slide-qué-hacer-mientras-hablas)
- [Parte 5 — Navegación durante la presentación](#parte-5--navegación-durante-la-presentación)
- [Parte 6 — Protocolo de emergencia si algo falla](#parte-6--protocolo-de-emergencia-si-algo-falla)

---

## Parte 1 — El día anterior: prueba en casa

Haz esto la noche anterior. Toma 15 minutos y evita sorpresas el día de la expo.

**Paso 1 — Verificar que Node.js está instalado**

Abre una terminal (`cmd` o PowerShell) y ejecuta:
```
node --version
```
Debe responder algo como `v18.17.0` o superior. Si dice "comando no reconocido", descarga e instala Node.js desde [nodejs.org](https://nodejs.org) (botón verde "LTS").

**Paso 2 — Hacer un test run completo**

1. Navega a la carpeta del proyecto: `D:\Github repos\caminside-expo\`
2. Doble clic en `iniciar-expo.bat`
3. Se abre una ventana negra (terminal del servidor) y el navegador con la diapositiva
4. La diapositiva debe mostrar la portada animada
5. La terminal debe mostrar algo como:
   ```
   ✔  Servidor listo en puerto 3000
      http://localhost:3000   (diapositiva)
      Red local: http://192.168.X.X:3000  (app móvil)
   ```
6. Anota la IP que aparece en la terminal (ej: `192.168.1.15`) — la necesitarás en la app

**Paso 3 — Conectar la app y verificar cada slide**

1. Abre CamInside en el teléfono
2. Ingresa la IP del paso anterior: `http://192.168.1.15:3000`
3. Toca "Conectar"
4. En la diapositiva, el indicador en la esquina superior derecha debe cambiar a verde: **"1 móvil conectado"**
5. Recorre cada tab de la app y verifica que el slide correspondiente reacciona

**Paso 4 — Verificar la demo del QR (Slide 7)**

El slide 7 necesita un código QR físico para la demo. Imprime o descarga en tu teléfono un QR de prueba.  
Puedes generar uno gratis en: [qr-code-generator.com](https://www.qr-code-generator.com/) — usa como contenido tu nombre o el nombre del proyecto.

**Paso 5 — Cierra todo y anota la IP**

La IP puede cambiar si te conectas a otra red. Asegúrate de anotar la IP que aparece **el día de la expo** cuando corras el servidor en la red de la universidad (o en el hotspot del teléfono).

---

## Parte 2 — Qué llevar el día de la expo

| Ítem | ¿Indispensable? | Notas |
|---|---|---|
| PC con el repositorio clonado y Node.js instalado | ✅ Sí | El `.bat` hace todo, solo necesitas el repo |
| Teléfono Android con CamInside instalada | ✅ Sí | Batería al 100% |
| Cable USB del teléfono | ✅ Sí | Para scrcpy o carga de emergencia |
| QR impreso o en pantalla para demo ML Kit | ✅ Sí | Sin esto, el slide 7 no tiene impacto visual |
| Hotspot activado en el teléfono | ✅ Sí | Red de respaldo si la WiFi universitaria falla |
| scrcpy instalado en el PC | ⭐ Recomendado | Para proyectar la pantalla del teléfono junto a la diapositiva |
| Cargador del PC | ⭐ Recomendado | La presentación usa Three.js y canvas — consume batería |
| Notas del guión (impreso o en otro teléfono) | ⭐ Recomendado | Para referencias rápidas |

> **scrcpy** es una herramienta gratuita que proyecta la pantalla del teléfono en el PC vía USB, sin lag. Descarga en: [github.com/Genymobile/scrcpy](https://github.com/Genymobile/scrcpy). Si el proyector del salón solo tiene una entrada, usar scrcpy en una ventana junto a la diapositiva es la mejor opción.

---

## Parte 3 — Setup completo (30 min antes)

Sigue estos pasos **exactamente en este orden** para que todo funcione.

---

### ⬛ Paso 1 — Decidir la red a usar

**Opción A (recomendada): Hotspot del teléfono presentador**

Es la opción más confiable. La red universitaria frecuentemente bloquea el tráfico entre dispositivos del mismo WiFi.

1. En el teléfono Android: **Ajustes → Red → Hotspot y anclaje → Hotspot portátil → Activar**
2. Conecta el PC a ese hotspot (como si fuera un WiFi normal)
3. Anota la IP del PC cuando corra el servidor (paso 3)

**Opción B: WiFi universitaria**

Funciona si la red no bloquea tráfico entre dispositivos. Riesgo: algunos routers universitarios tienen "client isolation" que impide que los dispositivos se vean entre sí.

---

### ⬛ Paso 2 — Iniciar el servidor

1. Abre la carpeta `D:\Github repos\caminside-expo\`
2. Doble clic en **`iniciar-expo.bat`**
3. Se abrirán **dos ventanas**:
   - Una ventana negra (terminal) con los logs del servidor — **no la cierres en ningún momento**
   - El navegador con la diapositiva en pantalla completa

Si el navegador no se abre automáticamente, escribe manualmente en la barra de direcciones:
```
http://localhost:3000
```

---

### ⬛ Paso 3 — Anotar la IP del PC

Mira la terminal del servidor. Debe mostrar una línea así:
```
Red local: http://192.168.43.105:3000  (app móvil)
```
Esa IP (`192.168.43.105` en el ejemplo) es la que hay que ingresar en la app del teléfono. Cada red es diferente; la IP cambia según la red.

Si no la ves o ya cerraste la terminal sin anotarla, abre otra ventana de `cmd` y ejecuta:
```
ipconfig
```
Busca "Dirección IPv4" bajo el adaptador WiFi activo.

---

### ⬛ Paso 4 — Poner la diapositiva en pantalla completa

Con el navegador enfocado, presiona:
```
F11
```
La barra de título y las pestañas desaparecen. La diapositiva ocupa toda la pantalla.

---

### ⬛ Paso 5 — Conectar la app del teléfono

1. Abre **CamInside** en el teléfono
2. Aparece un diálogo de conexión con un campo de texto
3. Borra lo que haya y escribe la IP del Paso 3, por ejemplo:
   ```
   http://192.168.43.105:3000
   ```
   ⚠️ Importante: incluye el `http://` al inicio y el `:3000` al final
4. Toca el botón **Conectar**
5. En la diapositiva, el indicador en la esquina superior derecha cambia a verde: **"1 móvil conectado"**

Si no cambia a verde en 5 segundos, ver [Protocolo de emergencia](#parte-6--protocolo-de-emergencia-si-algo-falla).

---

### ⬛ Paso 6 — Iniciar scrcpy (opcional pero muy recomendado)

Con el teléfono conectado por USB al PC:

1. Abre otra ventana de `cmd`
2. Ejecuta:
   ```
   scrcpy
   ```
3. Aparece una ventana que muestra la pantalla del teléfono en tiempo real
4. Arrastra esa ventana al lado de la diapositiva en el proyector

Si el proyector es tu única salida de video, puedes poner la ventana de scrcpy en una esquina de la diapositiva (modo ventana) o usar un segundo monitor.

---

### ⬛ Paso 7 — Prueba de 60 segundos antes de empezar

Haz este chequeo rápido antes de que entre el profesor:

| Verificación | Lo que debes ver |
|---|---|
| Indicador HUD | Punto verde · "1 móvil conectado" |
| Cambiar tab en la app | El slide de la diapositiva cambia solo |
| Cambiar slide con flecha del teclado | El tab de la app cambia solo |
| Abrir slide HAL (tab 1 en app) | Se ilumina una capa en el diagrama |
| Abrir slide ISP (tab 2 en app) | El modelo 3D brilla, el log muestra actividad |

Si todo pasa, estás listo. 🟢

---

## Parte 4 — Guía slide por slide: qué hacer mientras hablas

Esta sección describe **exactamente** qué acciones ejecutar con el teléfono en cada momento de la exposición.

---

### 🔵 Slide 0 — Portada (antes de empezar)

**Estado de la app:** Cualquier tab, no importa.

**Lo que el público ve:**
- Fondo animado con partículas
- Título: "Cámara Android: Bajo el Capó"
- Consola inferior mostrando la conexión del móvil

**Qué hacer:**
- La portada es solo visual, no requiere interacción
- Cuando el primer integrante esté listo para hablar, él/ella pasa al siguiente slide con la **tecla `→` del teclado** o desde la app tocando el botón de siguiente

---

### 🔵 Slide 1 — HAL (Integrante 1)

**Antes de hablar:** Asegúrate de estar en el tab 1 de la app (HAL).  
La diapositiva debe cambiar a HAL automáticamente al cambiar al tab 1.

**Durante el discurso:**

| Momento en el discurso | Acción con el teléfono |
|---|---|
| "...capas estrictas dentro del sistema operativo..." | Solo señala el diagrama de capas en la diapositiva |
| "...la HAL actúa como un traductor universal..." | Toca la capa "HAL" en la app → esa capa se ilumina en la diapositiva |
| "...miren nuestra consola en tiempo real..." | Toca el botón de leer características de la cámara → el log muestra focal length, apertura, `HARDWARE_LEVEL_3` |
| Al terminar, Integrante 2 listo | Deslizar a tab 2 en la app |

**Dato clave para memorizar:**  
`HARDWARE_LEVEL_3` significa que el dispositivo soporta el nivel más alto de la Camera2 API — acceso completo a streams de memoria y configuración manual del sensor.

---

### 🔵 Slide 2 — ISP (Integrante 2)

**Antes de hablar:** Tab 2 activo en la app.  
El modelo 3D de la cámara debe estar rotando con las etiquetas didácticas visibles.

**Durante el discurso:**

| Momento en el discurso | Acción con el teléfono |
|---|---|
| "...el cerebro oculto de la cámara: el ISP..." | Señala la etiqueta "ISP · SoC" que aparece sobre el chip en el modelo 3D |
| "...Matriz de Bayer del hardware..." | Señala la cuadrícula RGGB en la parte derecha de la diapositiva |
| "...al desplazar el slider de balance de blancos..." | Mueve el slider en la app lentamente de izquierda a derecha |
| "...lo que vemos en pantalla es una interpretación algorítmica..." | Mueve el slider hasta el extremo cálido (8000K) y luego al frío (2500K) |
| Al terminar | Deslizar a tab 3 en la app |

**Dato clave:**  
El rango del slider es 2500K (luz de tungsteno, muy amarilla) a 8000K (cielo abierto, muy azul). El ojo humano percibe "neutro" alrededor de 6500K (luz día).

**Consejo visual:**  
Mueve el slider despacio. El modelo 3D cambia de color y la cuadrícula Bayer cambia simultáneamente — el público verá dos demostraciones a la vez. No lo muevas tan rápido que no se note.

---

### 🔵 Slide 3 — APIs (Integrante 3)

**Antes de hablar:** Tab 3 activo en la app.

**Durante el discurso:**

| Momento en el discurso | Acción con el teléfono |
|---|---|
| "...Camera2 requería más de 300 líneas de código asíncrono..." | Señala el bloque de código de la izquierda en la diapositiva |
| "...Jetpack CameraX reduce el código en un 87%..." | Señala el bloque derecho, mucho más corto |
| "...como se aprecia al inicializar la cámara..." | Toca el botón "Simular inicialización" en la app → las barras de progreso se animan |
| El público ve Camera2: 1020ms, CameraX: 74ms | Deja que la animación termine sola (~2 seg) |
| Al terminar | Deslizar a tab 4 en la app |

**Datos clave para mencionar:**
- Camera2: ~280 líneas de código, ~1020ms de inicialización
- CameraX: ~35 líneas de código, ~74ms de inicialización
- Ahorro: **87% menos código**, **93% más rápido** para inicializar

---

### 🔵 Slide 4 — Ciclo de Vida (Integrante 4)

**Antes de hablar:** Tab 4 activo en la app.  
El diagrama de ciclo de vida se activa automáticamente al entrar al slide.

**Durante el discurso:**

| Momento en el discurso | Acción con el teléfono |
|---|---|
| "...la cámara es un recurso físico exclusivo..." | No acción, solo habla mirando al público |
| "...presten atención a lo que ocurre cuando bloqueo el teléfono..." | **Presiona el botón físico de encendido/apagado del teléfono** para bloquear la pantalla |
| El log en la diapositiva muestra: `paused → hardware liberado` | Espera 2-3 segundos |
| "...al desbloquearlo..." | **Desbloquea el teléfono** (botón físico + deslizar) y vuelve a abrir CamInside |
| El log muestra: `resumed → sesión restaurada` | El ciclo completo quedó demostrado |
| Al terminar | Deslizar a tab 5 en la app |

**⚠️ Advertencia crítica:**  
Cuando bloquees el teléfono, la app quedará en background. Al desbloquear, **abre CamInside manualmente** desde el reciente (cuadrado del teléfono) o desde el cajón de apps. No pierdas tiempo buscándola.

**Consejo:**  
Practica el bloqueo/desbloqueo varias veces antes de la expo. El momento de desbloquear y volver a la app en pocos segundos es cronometrado y se ve profesional cuando fluye bien.

---

### 🔵 Slide 5 — Pipeline de Captura (Integrante 5)

**Antes de hablar:** Tab 5 activo en la app.  
El canvas animado debe activarse automáticamente y mostrar partículas fluyendo hacia las 3 superficies.

**Durante el discurso:**

| Momento en el discurso | Acción con el teléfono |
|---|---|
| "...tres Surfaces paralelas sin perder tasa de refresco..." | Señala las tres ramas animadas en el canvas |
| "...presioné el botón de captura hace un instante..." | Toca el botón de **capturar foto** en la app |
| La rama "Capture Surface" pulsa en el canvas (animación rápida) | El público ve el evento exacto que describiste |
| "...apertura del procesamiento en tiempo real..." | Señala "Analysis Surface" que sigue fluyendo |
| Al terminar | Deslizar a tab 6 en la app |

**Consejo del canvas:**  
Si el canvas se ve muy pequeño en el proyector, puedes hacer zoom con la rueda del ratón directamente sobre el canvas para acercar el diagrama. Doble clic para volver a la vista normal.

**Dato clave:**  
Las tres superficies corren en hilos separados del sistema operativo. La Preview Surface usa buffers de textura GPU (SurfaceTexture), la Capture Surface escribe a disco con un ImageWriter, y la Analysis Surface entrega bytes YUV directamente a RAM para procesamiento.

---

### 🔵 Slide 6 — Extensiones CameraX (Integrante 6)

**Antes de hablar:** Tab 6 activo en la app.

**Durante el discurso:**

| Momento en el discurso | Acción con el teléfono |
|---|---|
| "...los programadores tomaban el camino más genérico: una captura de pantalla del preview..." | Toca el botón **"Captura por Preview"** en la app → la tarjeta izquierda de la diapositiva se resalta en rojo/naranja |
| "...descartando todo el procesamiento avanzado del ISP..." | Deja esa tarjeta visible unos 3 segundos |
| "...la solución técnica correcta es la API de Extensiones..." | Toca el botón **"Activación de Extensión Nativa"** en la app → la tarjeta derecha se resalta en verde |
| "...la misma calidad computacional de la aplicación oficial..." | El público ve el contraste directo: 28% vs 94% de calidad |
| Al terminar | Deslizar a tab 7 en la app |

**Dato clave:**  
La diferencia visual entre foto por screenshot vs extensión nativa es mayor en teléfonos con modos agresivos de ISP (Samsung, Huawei, Xiaomi). En Pixel de Google la diferencia es menor porque el ISP base ya es muy bueno.

---

### 🔵 Slide 7 — ML Kit (Integrante 7)

**Antes de hablar:** Tab 7 activo en la app. **Tener el QR impreso o en otro dispositivo a mano.**

**Durante el discurso:**

| Momento en el discurso | Acción con el teléfono |
|---|---|
| "...YUV separa de forma eficiente la luminancia de la crominancia..." | Señala el diagrama YUV de la diapositiva (planos Y, U, V) |
| "...la IA solo necesita el canal de luminancia..." | Señala el plano Y que está resaltado |
| "...observen la pantalla en este instante..." | Apunta la cámara del teléfono hacia el **QR** |
| El terminal en la diapositiva se llena con los datos del QR | El público ve el resultado en tiempo real |
| Mantener el QR apuntado 3-4 segundos | El log muestra: tipo, valor, formato, coordenadas |
| "...muchas gracias." | Bajar el teléfono |

**⚠️ Preparación crítica para esta demo:**  
1. Imprime o muestra en otro teléfono/tablet un QR con buen contraste
2. Practica la distancia: 15-30 cm del teléfono al QR es lo óptimo
3. Si el salón tiene mucha luz artificial (fluorescente), el QR puede detectarse desde más lejos
4. Si el QR no se detecta en 3 segundos, inclina ligeramente el teléfono y acércalo

**Dato clave:**  
YUV_420_888 consume 1.5 bytes por píxel. RGB consume 3 bytes. Al pasar YUV directamente al modelo de ML Kit, se reduce el consumo de memoria RAM a la mitad y se duplica la velocidad de inferencia.

---

## Parte 5 — Navegación durante la presentación

### Cómo cambiar de slide

| Método | Cómo hacerlo |
|---|---|
| Teclado (preferido) | Teclas `→` / `←` o `Espacio` / `Backspace` |
| App móvil | Botones PREV / NEXT en la barra inferior de CamInside |
| Mouse | Click derecho y seleccionar dirección en el menú de Reveal.js |
| Volver a portada | Botón 🏠 en la barra superior de CamInside (o tecla `Home`) |
| Ir a un slide específico | Número del slide + `Enter` en el teclado (ej: `3 Enter` → Slide 3) |

### Sincronización app ↔ diapositiva

- Si cambias de slide con el **teclado**, la app **cambia sola** al tab correspondiente
- Si cambias de tab en la **app**, la diapositiva **cambia sola** al slide correspondiente
- Si alguna vez se desincroniza (raro), navega una vez con el teclado y vuelve a estar en sync

### Atajos del teclado de Reveal.js

| Tecla | Acción |
|---|---|
| `F` | Pantalla completa (igual que F11) |
| `S` | Abrir speaker notes (vista del presentador) |
| `O` o `Esc` | Vista general de todos los slides (mapa) |
| `B` o `.` | Oscurecer pantalla (útil si el profesor quiere hablar sin distracción) |
| `?` | Ver todos los atajos disponibles |

---

## Parte 6 — Protocolo de emergencia si algo falla

> **Regla de oro:** Nunca entres en pánico visible. Mientras manejas el problema, sigue hablando del contenido teórico. El público no sabe que algo debería estar pasando en pantalla.

---

### ❌ El teléfono no conecta (HUD no se vuelve verde)

**Diagnóstico rápido en 30 segundos:**

1. ¿PC y teléfono están en la **misma red**? → Si no, conecta el PC al hotspot del teléfono
2. ¿La IP que ingresaste en la app es la correcta? → Verifica con `ipconfig` en el PC
3. ¿Puedes abrir `http://192.168.X.X:3000` en el **navegador del teléfono**? → Si sí, la app también puede conectar

**Solución rápida:**
- Desactiva el firewall de Windows temporalmente: `Ajustes de Windows → Seguridad de Windows → Firewall → Desactivar`
- Reconecta: cierra CamInside, vuelve a abrirla, ingresa la IP de nuevo

**Plan B si no conecta en 2 minutos:**  
La diapositiva funciona **completamente sin el teléfono**. Las capas HAL se animan solas, el modelo 3D rota solo, el canvas del pipeline se activa al entrar al slide. La única pérdida es la interactividad en vivo. Continúa la presentación normalmente.

---

### ❌ La terminal del servidor (ventana negra) se cierra

Esto apaga el servidor. Solución:

1. Doble clic de nuevo en `iniciar-expo.bat`
2. El servidor vuelve en 5 segundos
3. La diapositiva en el navegador se reconecta sola (espera el HUD verde)
4. La app del teléfono también se reconecta sola si la IP no cambió

---

### ❌ La diapositiva se pone en blanco o carga un error 404

El navegador perdió la conexión al servidor.

1. Verifica que la terminal del servidor esté abierta y corriendo
2. Presiona `F5` en el navegador para recargar
3. Si sigue fallando, ve a `http://localhost:3000` manualmente

---

### ❌ La animación del canvas (slide 5) no arranca

La animación es "lazy" — solo se activa al entrar al slide.

1. Sal del slide 5 con `→` (va al slide 6)
2. Vuelve al slide 5 con `←`
3. El canvas debe arrancar al volver a entrar

---

### ❌ La app se cierra sola o el teléfono se queda sin batería

Si la app se cierra en medio de la presentación:

1. Reabre CamInside — se reconectará automáticamente si el servidor sigue corriendo
2. Si la batería se acaba: conecta el cable USB al PC — puede seguir funcionando mientras carga

Si el teléfono muere completamente:

- La diapositiva sigue funcionando sin problema (modo autónomo)
- Las animaciones se activan solas al cambiar de slide
- El único impacto es que las demos en vivo (QR scanner, lifecycle) no se pueden hacer

---

### ❌ El proyector no muestra la diapositiva correctamente

Problemas comunes de proyector:

| Síntoma | Solución |
|---|---|
| Diapositiva se ve cortada | Presiona `Alt + F4`, reabre el navegador y presiona `F11` |
| Resolución incorrecta | Clic derecho en el escritorio → Configuración de pantalla → Ajusta la resolución del proyector a 1920×1080 |
| El browser muestra las barras de desplazamiento | Presiona `F11` para pantalla completa |
| La diapositiva sale en modo "oscuro tenue" | El salvapantallas se activó — mueve el mouse |

---

---

# 📋 Guión de Exposición con Anotaciones

> Tiempo total estimado: **18 minutos** · 7 integrantes · ~2:30 min por persona  
> Lee primero las **anotaciones** de tu sección antes de memorizar el discurso.  
> Las etiquetas `[🖥️ PANTALLA]` y `[📱 APP]` indican qué pasa en la diapositiva y qué haces con el teléfono en ese momento.

---

## Integrante 1 — Introducción y Arquitectura HAL
**Tiempo:** 00:00 – 02:30 · Tab activo en la app: `Tab 1`

### 📌 Notas de producción

**[🖥️ PANTALLA]:** Slide 1 HAL — diagrama de 5 capas animado verticalmente (Application → Framework → HAL → Kernel Driver → Linux/Hardware). Al entrar al slide, las capas se iluminan en secuencia automáticamente.

**[📱 APP]:** Estar en el Tab 1 de CamInside. Al abrirlo, la app consulta al `CameraManager` y emite los datos del hardware real. El log en la diapositiva mostrará: `focal_length`, `aperture`, `nivel_soporte`, `camera_count`.

---

### 📊 Datos clave para memorizar

| Dato | Valor a mencionar |
|---|---|
| Nivel de soporte HAL | `HARDWARE_LEVEL_3` — nivel máximo de acceso |
| Versión del proveedor HAL | `android.hardware.camera.provider@2.7` |
| Beneficio de la HAL | Un código que funciona en miles de sensores diferentes |
| Quién fabrica los sensores | Sony (IMX-series) y OmniVision son los más comunes en Android |

---

### 🎙️ Discurso

> "Buenos días, compañeros e ingeniero. Hoy vamos a analizar la arquitectura de software que gobierna uno de los componentes de hardware más complejos de los dispositivos móviles: la cámara.
>
> Cuando abrimos una aplicación que requiere captura de imagen, el flujo de órdenes debe viajar a través de una serie de capas estrictas dentro del sistema operativo. Como pueden observar en nuestra presentación web interactiva, este viaje inicia en la **Capa de Aplicación**, que aloja nuestro código fuente.
>
> Sin las abstracciones correctas, tendríamos que programar un código diferente para cada uno de los miles de sensores ópticos del mercado. Para resolver esto, el framework del sistema operativo se comunica con la **HAL, o Hardware Abstraction Layer**. La HAL es una interfaz estándar que unifica el comportamiento del hardware, actuando como un traductor universal para que las capas de alto nivel ignoren si el lente físico fue fabricado por Sony u OmniVision.
>
> Miren nuestra consola web en tiempo real: al activar la primera pestaña en mi teléfono físico, la aplicación realiza una llamada al `CameraManager` y extrae el nivel de soporte de la HAL de este dispositivo. El log transmitido vía WebSockets muestra que contamos con un nivel **`HARDWARE_LEVEL_3`**, garantizando que nuestro software tiene acceso completo a los flujos y llamadas de memoria más profundos del hardware óptico."

---

### 💡 Tips de presentación

- Habla mirando al **público**, no a la pantalla. La pantalla es para ellos, tú ya sabes lo que dice.
- Cuando digas "miren nuestra consola", señala con la mano hacia la diapositiva antes de tocar el teléfono — da tiempo al público de enfocar la vista.
- El nombre "HAL" puede generar confusión con HAL 9000 (la IA de 2001: Space Odyssey) — si quieres hacer un comentario de cultura pop para romper el hielo, es un buen momento.
- Pronuncia: "cámara-two" (Camera2), no "cámara-dos" — es una API con nombre en inglés.

---

## Integrante 2 — El Pipeline del ISP
**Tiempo:** 02:30 – 05:00 · Tab activo en la app: `Tab 2`

### 📌 Notas de producción

**[🖥️ PANTALLA]:** Slide 2 ISP — modelo 3D giratorio de una cámara con etiquetas didácticas (Sistema Óptico, Sensor CMOS, ISP·SoC, PCB). A la derecha: cuadrícula Bayer 8×8 y slider de temperatura de color.

**[📱 APP]:** Tab 2 con slider de Balance de Blancos. Moverlo envía `isp_white_balance` al servidor → la cuadrícula cambia de color, el modelo 3D cambia de iluminación, el swatch de color de salida cambia.

---

### 📊 Datos clave para memorizar

| Dato | Valor a mencionar |
|---|---|
| Pasos del pipeline ISP | Demosaicing → Noise Reduction → White Balance → Tonemapping |
| Patrón de la Matriz de Bayer | RGGB — hay el doble de píxeles verdes porque el ojo humano es más sensible al verde |
| Temperatura neutra | ~5500–6500K (luz día) |
| Temperatura fría | 2500K (bombilla tungsteno, amarillo intenso) |
| Temperatura cálida | 8000K (cielo abierto, azul intenso) |

---

### 🎙️ Discurso

> "Muchas gracias. Ahora bien, los datos extraídos directamente por la capa HAL son flujos eléctricos crudos y oscuros conocidos como formato **RAW**. Un sensor por sí solo no comprende el color real; solo mide la intensidad de fotones. Aquí entra en escena el cerebro oculto de la cámara: el **ISP, o Image Signal Processor**, un coprocesador especializado empaquetado dentro del SoC del smartphone.
>
> El ISP ejecuta de forma asíncrona un flujo de algoritmos denominado **'Pipeline de Imagen'**. El primer paso crítico es el **'Demosaicing'**, un proceso matemático que interpola los valores cromáticos de la Matriz de Bayer del hardware para asignarle a cada píxel su verdadero color RGB. Posteriormente aplica rutinas de reducción de ruido digital y balance de blancos.
>
> Podemos comprobar esto en nuestra demostración en tiempo real. Observen la proyección: al desplazar el slider de balance de blancos en el móvil, nuestro software interrumpe los cálculos automáticos del ISP e inyecta valores de temperatura manuales directo a los drivers del sensor. **[Mover el slider de frío a cálido]** Esto nos demuestra que lo que vemos en la pantalla no es la realidad óptica directa, sino una **interpretación algorítmica** procesada en milisegundos por el software del ISP."

---

### 💡 Tips de presentación

- La Matriz de Bayer es el elemento más visual de tu sección. Señala la cuadrícula RGGB con la mano mientras la explicas.
- Al mover el slider, hazlo **lento y deliberadamente** — no en un segundo. El modelo 3D y la cuadrícula cambian juntos, y eso es impresionante si el público tiene tiempo de verlo.
- Si alguien pregunta por qué hay el doble de verde en el patrón RGGB: "El ojo humano tiene tres veces más fotorreceptores sensibles al verde que al rojo o azul — el patrón Bayer lo imita para maximizar la percepción de detalle."

---

## Integrante 3 — Evolución de las APIs (Camera2 vs CameraX)
**Tiempo:** 05:00 – 07:30 · Tab activo en la app: `Tab 3`

### 📌 Notas de producción

**[🖥️ PANTALLA]:** Slide 3 APIs — pantalla dividida con dos bloques de código. Izquierda: código Camera2 complejo (~280 líneas). Derecha: código CameraX limpio (~35 líneas). Botón de simulación al pie.

**[📱 APP]:** Tab 3. Botón "Simular inicialización" → animación de barras comparativas en la diapositiva.

---

### 📊 Datos clave para memorizar

| Métrica | Camera2 | CameraX |
|---|---|---|
| Líneas de código | ~280 | ~35 |
| Tiempo de inicialización | ~1020ms | ~74ms |
| Reducción de código | — | **-87%** |
| Aceleración | — | **13.7x más rápido** |
| Año de lanzamiento | Camera2: Android 5.0 (2014) | CameraX: 2019 (Jetpack) |

---

### 🎙️ Discurso

> "Comprendido el flujo del hardware y el ISP, pasemos al plano del desarrollador: ¿cómo controlamos esto a través del código?
>
> En el ecosistema Android, el desarrollo de cámaras ha vivido una evolución compleja. La API primitiva **'Camera1'** quedó obsoleta por su falta de control técnico. Luego, Google lanzó **'Camera2'**, una API de bajísimo nivel sumamente potente pero propensa a errores de concurrencia, que requería más de 280 líneas de código asíncrono solo para abrir el lente.
>
> Para solucionar este dolor de cabeza en la industria, se creó **Jetpack CameraX**. CameraX introduce una arquitectura guiada por **'Casos de Uso'**. Como se aprecia en el código de nuestra diapositiva, en lugar de gestionar hilos de ejecución manuales, declaramos tres objetos abstractos independientes: un caso de **'Preview'** para ver la imagen, un caso de **'ImageCapture'** para guardar fotos, y un caso de **'ImageAnalysis'** para analizar datos.
>
> **[Tocar botón Simular inicialización en la app]**
>
> El framework se encarga de traducir estas declaraciones en llamadas eficientes a la HAL, reduciendo el código en un **87%** y el tiempo de inicialización de 1020ms a apenas **74ms** — una aceleración de más de 13 veces."

---

### 💡 Tips de presentación

- El contraste visual del código (280 líneas vs 35) es tu argumento principal. Señala las dos columnas antes de decir los números.
- "Casos de Uso" es el concepto central de CameraX. Repítelo dos veces en tu discurso para que quede en la mente del público.
- Si el ingeniero pregunta por la diferencia con iOS: "Apple usa AVCaptureSession dentro del framework AVFoundation — concepto similar a CameraX pero específico del ecosistema Apple. Ambos abstraen el hardware detrás de una API declarativa de alto nivel."

---

## Integrante 4 — Ciclo de Vida y Gestión de Recursos
**Tiempo:** 07:30 – 10:00 · Tab activo en la app: `Tab 4`

### 📌 Notas de producción

**[🖥️ PANTALLA]:** Slide 4 Lifecycle — diagrama de nodos verticales conectados: `resumed → inactive → paused → detached`. Consola a la derecha con logs de estados. Al entrar al slide se ejecuta una animación automática de bloqueo/desbloqueo simulado.

**[📱 APP]:** Tab 4. Hay botones para simular estados manualmente Y también el bloqueo físico del teléfono funciona.

---

### 📊 Datos clave para memorizar

| Estado | Qué significa para la cámara |
|---|---|
| `resumed` | App en primer plano, cámara activa, sesión abierta |
| `inactive` | App perdiendo foco (llamada entrante, notificación) |
| `paused` | App en background, hardware liberado, hilo cortado |
| `detached` | App destruida, todos los recursos liberados |

---

### 🎙️ Discurso

> "Un aspecto fundamental en la ingeniería de software móvil es que **la cámara es un recurso físico exclusivo**. Dos aplicaciones no pueden controlar el sensor de manera simultánea. Por ende, una mala gestión del código puede bloquear el hardware, agotar la batería del usuario o provocar un colapso total de la app.
>
> Para evitarlo, nuestro software debe acoplarse estrictamente al **ciclo de vida del sistema operativo**. Observen detalladamente la terminal de nuestra diapositiva web. En este momento la cámara está transmitiendo datos en la app móvil. Presten atención a lo que ocurre cuando bloqueo físicamente el teléfono:
>
> **[Presionar el botón físico de encendido para bloquear el teléfono]**
>
> El sistema operativo dispara inmediatamente el método asíncrono **`AppLifecycleState.paused`**. Nuestro código intercepta ese evento y corta los hilos de comunicación de CameraX, liberando el hardware para que el sistema u otras aplicaciones dispongan de él.
>
> Al desbloquear el dispositivo: **[Desbloquear y volver a CamInside]**, la Activity ejecuta **`AppLifecycleState.resumed`** y el software vuelve a solicitar el acceso a la sesión de captura de forma limpia y transparente para el usuario, demostrando un uso óptimo de la memoria volátil."

---

### 💡 Tips de presentación

- **Practica el bloqueo/desbloqueo 5 veces antes de la expo.** Bloquear, esperar que el log se actualice, desbloquear, volver a la app — debe ser fluido y en menos de 5 segundos.
- El log en la diapositiva aparece con timestamp real. Si se ve en el proyector, eso refuerza que es en tiempo real, no una animación pregrabada.
- Si el teléfono tiene bloqueo de pantalla con PIN/patrón, considera **desactivarlo temporalmente** para la demo (solo durante la exposición) para que el desbloqueo sea instantáneo.

---

## Integrante 5 — Pipeline de Captura Simultánea
**Tiempo:** 10:00 – 12:30 · Tab activo en la app: `Tab 5`

### 📌 Notas de producción

**[🖥️ PANTALLA]:** Slide 5 Pipeline — canvas animado donde un nodo central "SENSOR ÓPTICO" se bifurca en tres ramas con partículas fluyendo: Preview Surface (amarillo), Capture Surface (naranja), Analysis Surface (verde). Tres tarjetas con medidores debajo del canvas.

**[📱 APP]:** Tab 5 con botón de captura. Al entrar al tab, el stream se activa automáticamente.

---

### 📊 Datos clave para memorizar

| Surface | Destino | Formato | Uso |
|---|---|---|---|
| Preview Surface | GPU (SurfaceTexture) | YUV → RGBA | Vista en tiempo real, 30-60 FPS |
| Capture Surface | Disco (ImageWriter) | JPEG full res | Foto guardada |
| Analysis Surface | RAM (ImageReader) | YUV_420_888 | ML Kit, visión artificial |

---

### 🎙️ Discurso

> "Una vez establecida una sesión de cámara estable y vinculada al ciclo de vida, el framework opera mediante un modelo de entradas y salidas concurrentes a través de estructuras de memoria gráfica llamadas **'Surfaces'**.
>
> En programación móvil, una sola entrada de la cámara no se limita a un único destino. Mediante el uso de multihilos, el software es capaz de duplicar y desviar el flujo de píxeles hacia **tres Surfaces paralelas** sin perder tasa de refresco en la interfaz de usuario:
>
> La primera es la **'Preview Surface'**, un flujo constante que envía tramas a la GPU usando buffers de textura optimizados a 30 o 60 cuadros por segundo para que el usuario apunte correctamente.
>
> La segunda es la **'Image Capture Surface'**: **[Tocar el botón de captura en la app]** — el software congela un único frame en su máxima resolución nativa y dispara un hilo secundario de escritura para comprimirlo y guardarlo en el almacenamiento masivo.
>
> Y la tercera es la **'Image Analysis Surface'**, que desvía arreglos de bytes puros a la memoria RAM, abriendo la puerta al procesamiento de datos en tiempo real que veremos a continuación."

---

### 💡 Tips de presentación

- La animación del canvas es el elemento más visual de toda la presentación. Dale tiempo al público de verla antes de empezar a hablar.
- Cuando presiones "capturar" y el canal naranja (Capture Surface) pulse, señálalo con la mano. El efecto dura solo 1.5 segundos.
- Si el público hace una pregunta: "¿Cómo el teléfono hace tres cosas a la vez?" — responde: "Cada Surface corre en su propio hilo del sistema operativo. El scheduler de Linux asigna tiempo de CPU a cada hilo de forma independiente."

---

## Integrante 6 — Extensiones CameraX vs Screenshot
**Tiempo:** 12:30 – 15:00 · Tab activo en la app: `Tab 6`

### 📌 Notas de producción

**[🖥️ PANTALLA]:** Slide 6 Extensions — dos columnas comparativas: "Screenshot del Preview" (método antiguo) vs "CameraX Extensions API" (método nativo). Indicadores de calidad: 28% vs 94%.

**[📱 APP]:** Tab 6 con dos botones: "Captura por Preview" y "Activación de Extensión Nativa".

---

### 📊 Datos clave para memorizar

| Aspecto | Screenshot Preview | CameraX Extensions |
|---|---|---|
| Calidad relativa | 28% | 94% |
| Acceso al ISP del fabricante | No | Sí |
| HDR, Modo Noche, Bokeh | No disponible | Sí disponible |
| Compatibilidad | Universal | Depende del fabricante |
| Usado históricamente por | Instagram, Snapchat (pre-2018) | Apps modernas (2021+) |

---

### 🎙️ Discurso

> "Como futuros ingenieros, debemos analizar un problema clásico del desarrollo móvil: ¿por qué las fotos en aplicaciones de terceros como Instagram o WhatsApp históricamente se veían con menor calidad en Android que en la aplicación nativa del teléfono?
>
> Esto no era un fallo del hardware, sino una **decisión de diseño de software** para mitigar la fragmentación. Para asegurar que la app no crasheara en miles de modelos diferentes, los programadores tomaban el camino más genérico: hacían una **captura de pantalla digital del preview** — **[Tocar botón "Captura por Preview" en la app]** — descartando todo el procesamiento avanzado del ISP de la marca.
>
> Hoy en día, la solución técnica correcta es la implementación de la **API de Extensiones de CameraX**. **[Tocar botón "Activación de Extensión Nativa"]** — nuestra aplicación le exige al sistema operativo que exponga e invoque los algoritmos propietarios del fabricante: el Modo Noche, el HDR avanzado, el Bokeh computacional. Esto permite que nuestro desarrollo capture imágenes con la misma calidad computacional de la aplicación oficial del sistema de fábrica, pasando de un 28% a un **94% de calidad de imagen**."

---

### 💡 Tips de presentación

- Puedes mencionar una app concreta que todos conocen para hacer el punto más tangible: "Instagram hasta 2018 usaba el método del screenshot — por eso las fotos se veían peor que con la cámara nativa."
- La Extension API requiere soporte del fabricante. Si el ingeniero pregunta: "No todos los teléfonos lo soportan — se puede verificar en tiempo de ejecución con `ExtensionsManager.isExtensionAvailable()`."
- Los efectos soportados varían por fabricante: Samsung → Bokeh, Modo Noche; Pixel → HDR, Face Retouching; Xiaomi → Super Night, AI Cam.

---

## Integrante 7 — ML Kit y Visión por Computadora en el Edge
**Tiempo:** 15:00 – 18:00 · Tab activo en la app: `Tab 7` · **Tener QR listo**

### 📌 Notas de producción

**[🖥️ PANTALLA]:** Slide 7 ML Kit — diagrama YUV (planos Y, U, V con sub-muestreo 4:2:0), terminal verde que se llena con datos del QR detectado en tiempo real, contador de FPS.

**[📱 APP]:** Tab 7 con la cámara activa analizando frames. Apuntar al QR.

---

### 📊 Datos clave para memorizar

| Dato | Valor |
|---|---|
| Formato de buffer para ML Kit | `YUV_420_888` |
| Bytes por píxel — RGB | 3 bytes |
| Bytes por píxel — YUV_420_888 | 1.5 bytes (**50% menos memoria**) |
| Planos del formato YUV | Y (luminancia), U (Cb, crominancia azul), V (Cr, crominancia roja) |
| Sub-muestreo | 4:2:0 → U y V se muestrean a la mitad de resolución |
| Estrategia de descarte | `STRATEGY_KEEP_ONLY_LATEST` — solo se procesa el frame más reciente |
| Procesamiento | On-device (en el dispositivo), sin internet, latencia <50ms |

---

### 🎙️ Discurso

> "Llegamos al punto culminante de la exposición, donde el stream de software de la cámara se fusiona con la **Inteligencia Artificial** y el procesamiento local. ¿Cómo analizamos una imagen en tiempo real frame a frame sin agotar la memoria RAM o congelar la interfaz del smartphone?
>
> La respuesta clave está en la optimización del formato de color de los datos. El caso de uso **`ImageAnalysis`** de CameraX extrae los buffers de la Surface en un formato de bajo nivel denominado **`YUV_420_888`**. A diferencia del formato RGB común, que procesa tres canales de color con 3 bytes por píxel, YUV separa de forma eficiente la **luminancia** (la 'Y' o brillo) de la **crominancia** (la 'U' y 'V' que dan el color), reduciendo el consumo de memoria a **1.5 bytes por píxel — la mitad**.
>
> Al procesar modelos de visión por computadora, la IA solo necesita el canal de luminancia para identificar formas y texturas. Observen la pantalla en este instante:
>
> **[Apuntar la cámara del teléfono al código QR]**
>
> El buffer YUV es procesado en un hilo de fondo dedicado por los algoritmos de detección periférica de **Google ML Kit**. El resultado es empaquetado en un objeto JSON y enviado asíncronamente por WebSockets a nuestro servidor Node.js local, actualizando la diapositiva web en milisegundos con los datos del QR detectado.
>
> Esto demuestra el verdadero potencial de la cámara móvil: no solo como un visor óptico, sino como una **entrada de datos de alto rendimiento** para la ingeniería de sistemas. Muchas gracias."

---

### 💡 Tips de presentación

- Esta es la demo más espectacular de toda la presentación. Tómate tu tiempo — deja que el público vea el terminal llenarse con los datos del QR antes de terminar el discurso.
- El término "Edge Computing" o "procesamiento en la periferia" es sinónimo de "on-device" — la IA corre en el teléfono, sin enviar datos a la nube. Esto es importante para privacidad.
- Si el QR no se detecta: inclina el teléfono 15° y acércalo 5cm. No entres en pánico — continúa hablando mientras reposicionas.
- Cierre poderoso: las últimas palabras "entrada de datos de alto rendimiento para la ingeniería de sistemas" conectan directamente con la materia y el título de la exposición. Dilo con convicción.

---

---

# 🔗 Recursos y Bibliografía

## Documentación oficial por tema

### Arquitectura HAL y Sistema Android
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| Android Camera HAL overview | [source.android.com/docs/core/camera](https://source.android.com/docs/core/camera) | Arquitectura completa de la cámara en el AOSP |
| HIDL (Hardware Interface Definition Language) | [source.android.com/docs/core/architecture/hidl](https://source.android.com/docs/core/architecture/hidl) | Cómo Android define las interfaces HAL |
| V4L2 — Linux Video for Linux 2 | [kernel.org/doc/html/latest/userspace-api/media/v4l/v4l2.html](https://www.kernel.org/doc/html/latest/userspace-api/media/v4l/v4l2.html) | Driver de cámara a nivel de kernel Linux |
| MIPI CSI-2 Interface | [mipi.org/specifications/csi-2](https://mipi.org/specifications/csi-2) | Protocolo de comunicación sensor → SoC |

### ISP y Procesamiento de Imagen
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| Bayer filter — Wikipedia | [en.wikipedia.org/wiki/Bayer_filter](https://en.wikipedia.org/wiki/Bayer_filter) | Explicación completa del patrón RGGB con animaciones |
| Image processor (ISP) — Wikipedia | [en.wikipedia.org/wiki/Image_processor](https://en.wikipedia.org/wiki/Image_processor) | Historia y función del ISP en smartphones |
| Demosaicing algorithms | [en.wikipedia.org/wiki/Demosaicing](https://en.wikipedia.org/wiki/Demosaicing) | Los algoritmos matemáticos detrás del Demosaicing |
| Color temperature — Wikipedia | [en.wikipedia.org/wiki/Color_temperature](https://en.wikipedia.org/wiki/Color_temperature) | La escala Kelvin y el balance de blancos |

### CameraX y Camera2 API
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| CameraX overview (oficial) | [developer.android.com/media/camera/camerax](https://developer.android.com/media/camera/camerax) | Documentación principal de CameraX |
| Camera2 API reference | [developer.android.com/media/camera/camera2](https://developer.android.com/media/camera/camera2) | API de bajo nivel — comparación con CameraX |
| CameraX Extensions API | [developer.android.com/media/camera/camerax/vendor-extensions](https://developer.android.com/media/camera/camerax/vendor-extensions) | Extensiones de fabricante (HDR, Bokeh, Noche) |
| Flutter camera plugin | [pub.dev/packages/camera](https://pub.dev/packages/camera) | El plugin que usa CamInside (usa CameraX internamente) |

### Ciclo de Vida (AppLifecycleState)
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| AppLifecycleState — Flutter API | [api.flutter.dev/flutter/dart-ui/AppLifecycleState.html](https://api.flutter.dev/flutter/dart-ui/AppLifecycleState.html) | Estados del ciclo de vida en Flutter |
| WidgetsBindingObserver | [api.flutter.dev/flutter/widgets/WidgetsBindingObserver-mixin.html](https://api.flutter.dev/flutter/widgets/WidgetsBindingObserver-mixin.html) | Cómo escuchar los cambios de ciclo de vida |

### Captura y Análisis de Imagen
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| ImageFormat.YUV_420_888 | [developer.android.com/reference/android/graphics/ImageFormat#YUV_420_888](https://developer.android.com/reference/android/graphics/ImageFormat#YUV_420_888) | Especificación técnica del formato YUV |
| CameraX ImageAnalysis | [developer.android.com/media/camera/camerax/analyze](https://developer.android.com/media/camera/camerax/analyze) | Cómo configurar el caso de uso de análisis |
| YCbCr color space | [en.wikipedia.org/wiki/YCbCr](https://en.wikipedia.org/wiki/YCbCr) | Explicación del espacio de color YUV/YCbCr |

### ML Kit
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| ML Kit Barcode Scanning (Android) | [developers.google.com/ml-kit/vision/barcode-scanning/android](https://developers.google.com/ml-kit/vision/barcode-scanning/android) | Guía oficial del escáner QR/barcode |
| ML Kit — On-device vs Cloud | [developers.google.com/ml-kit](https://developers.google.com/ml-kit) | Diferencia entre modelos locales y en la nube |

### WebSockets y Socket.io
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| WebSocket API — MDN | [developer.mozilla.org/en-US/docs/Web/API/WebSockets_API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) | El protocolo WebSocket explicado |
| Socket.io v4 Documentation | [socket.io/docs/v4/](https://socket.io/docs/v4/) | Documentación del servidor y cliente Socket.io |
| Socket.io Rooms | [socket.io/docs/v4/rooms/](https://socket.io/docs/v4/rooms/) | Cómo funcionan las rooms (web/mobile en CamInside) |
| Socket.io Client API | [socket.io/docs/v4/client-api/](https://socket.io/docs/v4/client-api/) | Eventos y métodos del cliente en el browser |

### Librerías de la Diapositiva
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| Reveal.js Documentation | [revealjs.com](https://revealjs.com/) | Motor de la presentación |
| Reveal.js Keyboard Shortcuts | [revealjs.com/keyboard/](https://revealjs.com/keyboard/) | Todos los atajos de teclado |
| Three.js Documentation | [threejs.org/docs/](https://threejs.org/docs/) | Motor 3D WebGL del slide ISP |
| Three.js Examples | [threejs.org/examples/](https://threejs.org/examples/) | Galería de efectos Three.js para referencia |

### Herramientas del Setup
| Recurso | Enlace | Para qué sirve |
|---|---|---|
| scrcpy | [github.com/Genymobile/scrcpy](https://github.com/Genymobile/scrcpy) | Proyectar pantalla del teléfono en el PC |
| Node.js LTS | [nodejs.org](https://nodejs.org) | Runtime de JavaScript para el servidor |
| QR code generator | [qr-code-generator.com](https://www.qr-code-generator.com/) | Crear QR para la demo del slide 7 |

---

## Bibliografía académica

1. Google Developers (2024). *Jetpack CameraX Architecture and Core Concepts*. Android Open Source Project. [developer.android.com/media/camera/camerax](https://developer.android.com/media/camera/camerax)

2. Google Developers (2024). *Android Camera HAL Overview*. Android Open Source Project. [source.android.com/docs/core/camera](https://source.android.com/docs/core/camera)

3. Google Developers (2024). *ML Kit Barcode Scanning Guide for Android*. Google for Developers. [developers.google.com/ml-kit/vision/barcode-scanning/android](https://developers.google.com/ml-kit/vision/barcode-scanning/android)

4. Socket.io Team (2024). *Socket.io Documentation v4 — Handling Real-Time Bi-directional Events*. [socket.io/docs/v4/](https://socket.io/docs/v4/)

5. Bryce Bostwick (2012). *The Bayer Pattern and How Digital Cameras Capture Color*. Cambridge in Colour. [cambridgeincolour.com/tutorials/camera-sensors.htm](https://www.cambridgeincolour.com/tutorials/camera-sensors.htm)

6. Apple Inc. (2024). *AVFoundation Framework — Capturing Media from Input Devices*. Apple Developer Documentation. [developer.apple.com/av-foundation/](https://developer.apple.com/av-foundation/)

---

## Dependencias del proyecto

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

*Proyecto académico — Universidad Popular del Cesar · Ingeniería de Sistemas · Programación Móvil · 2026*
