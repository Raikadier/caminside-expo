/* three-scene.js — Módulo de cámara despiezado · Three.js r128
   Se inicializa SOLO cuando el slide ISP entra en vista (via app.js).
   No hay doble init: sin DOMContentLoaded ni window.load aquí. */
const CamInsideThree = (() => {
  let scene, cam, renderer, animId;
  let moduleGroup, socMesh, ispLight, wbLight;
  let dataParticles = [];
  let ispActive = false, ispIntensity = 0;
  let ready = false;

  /* ── Init ──────────────────────────────────────────────── */
  function init(container) {
    if (ready || !container) return;
    ready = true;

    const W = container.clientWidth  || 420;
    const H = container.clientHeight || 320;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03030f);
    scene.fog = new THREE.FogExp2(0x03030f, 0.08);

    cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    cam.position.set(0, 1.2, 7);
    cam.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    buildLights();
    buildCameraModule();
    buildDataParticles();
    animate();

    window.addEventListener('resize', () => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ── Lights ────────────────────────────────────────────── */
  function buildLights() {
    scene.add(new THREE.AmbientLight(0x0a1020, 2));

    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(4, 8, 6);
    scene.add(key);

    ispLight = new THREE.PointLight(0x00f0ff, 0, 5);
    ispLight.position.set(-1.5, 0.5, 2);
    scene.add(ispLight);

    wbLight = new THREE.PointLight(0xffffff, 0.8, 10);
    wbLight.position.set(2, 3, 3);
    scene.add(wbLight);
  }

  /* ── Camera Module ─────────────────────────────────────── */
  function buildCameraModule() {
    moduleGroup = new THREE.Group();

    /* Lenses */
    const lensData = [
      { r: 0.88, h: 0.14, y: 1.30, op: 0.65, col: 0x88bbff },
      { r: 0.70, h: 0.12, y: 0.98, op: 0.70, col: 0x99aaee },
      { r: 0.54, h: 0.10, y: 0.70, op: 0.80, col: 0x77ccff },
    ];
    lensData.forEach(l => {
      const geo = new THREE.CylinderGeometry(l.r, l.r, l.h, 40);
      const mat = new THREE.MeshPhysicalMaterial({
        color: l.col, transparent: true, opacity: l.op,
        roughness: 0.05, metalness: 0.1, transmission: 0.25,
      });
      moduleGroup.add(new THREE.Mesh(geo, mat).translateY(l.y));

      const rGeo = new THREE.TorusGeometry(l.r + 0.025, 0.035, 8, 40);
      const rMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.3, metalness: 0.9 });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = l.y;
      moduleGroup.add(ring);
    });

    /* Barrel */
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.5, metalness: 0.7, side: THREE.BackSide });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 1.6, 40, 1, true), barrelMat);
    barrel.position.y = 0.78;
    moduleGroup.add(barrel);

    /* Image Sensor */
    const sensorMat = new THREE.MeshStandardMaterial({ color: 0x0d0d22, roughness: 0.2, metalness: 0.8, emissive: 0x001133, emissiveIntensity: 0.4 });
    moduleGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 1.1), sensorMat));

    /* Sensor pixel grid */
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.12 });
    for (let i = -4; i <= 4; i++) {
      const h = [new THREE.Vector3(-0.65, 0.04, i * 0.12), new THREE.Vector3(0.65, 0.04, i * 0.12)];
      const v = [new THREE.Vector3(i * 0.12 * 0.9, 0.04, -0.5), new THREE.Vector3(i * 0.12 * 0.9, 0.04, 0.5)];
      moduleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(h), lineMat));
      moduleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(v), lineMat));
    }

    /* ISP / SoC Chip */
    socMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.15, metalness: 0.85 })
    );
    socMesh.position.y = -0.55;
    moduleGroup.add(socMesh);

    const chipDetail = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.025, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1a2233, emissive: 0x001133, emissiveIntensity: 0.6 })
    );
    chipDetail.position.y = -0.48;
    moduleGroup.add(chipDetail);

    /* PCB */
    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.055, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x061208, roughness: 0.85, metalness: 0.15 })
    );
    pcb.position.y = -0.88;
    moduleGroup.add(pcb);

    /* PCB traces */
    const traceMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.18 });
    for (let i = 0; i < 18; i++) {
      const x1 = -1.1 + Math.random() * 2.2, z1 = -0.9 + Math.random() * 1.8;
      const x2 = -1.1 + Math.random() * 2.2, z2 = -0.9 + Math.random() * 1.8;
      const pts = [new THREE.Vector3(x1, -0.85, z1), new THREE.Vector3(x1, -0.85, z2), new THREE.Vector3(x2, -0.85, z2)];
      moduleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), traceMat));
    }

    moduleGroup.position.y = -0.15;
    scene.add(moduleGroup);
  }

  /* ── Data Particles ────────────────────────────────────── */
  function buildDataParticles() {
    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0 })
      );
      mesh.position.set((Math.random() - 0.5) * 1.2, 0.3 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8);
      mesh.userData = { t: Math.random(), speed: 0.008 + Math.random() * 0.012 };
      scene.add(mesh);
      dataParticles.push(mesh);
    }
  }

  /* ── Animation Loop ────────────────────────────────────── */
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    if (moduleGroup) {
      moduleGroup.rotation.y = Math.sin(t * 0.28) * 0.35 + 0.1;
      moduleGroup.rotation.x = Math.sin(t * 0.18) * 0.04;
    }

    /* ISP glow ramp */
    ispIntensity += ispActive ? 0.06 : -0.04;
    ispIntensity = Math.max(0, Math.min(3.5, ispIntensity));
    if (ispLight) ispLight.intensity = ispIntensity + Math.sin(t * 5) * 0.25 * ispIntensity;

    /* SoC chip emissive */
    if (socMesh) {
      socMesh.material.emissive = new THREE.Color(0, ispIntensity * 0.04, ispIntensity * 0.18);
      socMesh.material.emissiveIntensity = ispIntensity * 0.6;
    }

    /* Data particles flow lens → sensor */
    dataParticles.forEach(p => {
      const targetOpacity = ispActive ? 0.75 : 0;
      p.material.opacity += (targetOpacity - p.material.opacity) * 0.05;
      if (ispActive) {
        p.userData.t = (p.userData.t + p.userData.speed) % 1;
        const tt = p.userData.t;
        p.position.y = 1.4 - tt * 2.0;
        p.position.x = (Math.sin(tt * Math.PI * 2 + p.userData.t * 3)) * 0.3;
      }
    });

    renderer.render(scene, cam);
  }

  /* ── Public API ────────────────────────────────────────── */
  function setWB(temp) {
    const t = (temp - 2500) / (8000 - 2500);
    if (wbLight) {
      wbLight.color.setRGB(0.4 + t * 0.6, 0.35 + t * 0.1, 0.9 - t * 0.6);
    }
  }

  function setISP(active) { ispActive = active; }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
    ready = false;
  }

  return { init, setWB, setISP, destroy, isReady: () => ready };
})();
