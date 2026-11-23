// Stylised 3D smart thermostat, built in code with three.js (no photos, no people). Loaded only when its scene is near.
// start(holder, getProgress, {phone, getStep}): turns clearly with scroll; its screen shows COOLING / HEATING / CLEAN AIR,
// switching on the same frame as the text beside it (getStep = the text block currently most visible).
import * as THREE from "./vendor/three.module.min.js";

function makeScreen() {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const g = c.getContext("2d");
  let last = "";
  // mode follows the copy beside it: "cool" (We Keep You Cool), "heat" (We Keep You Warm), "air" (We Keep Your Air Clean)
  const BRAND = "MANSFIELD";   // FILL-IN: business name painted on the 3D thermostat screen (keep short, capitals)
  const MODES = { cool: { col: [24, 160, 208], label: t => (t > 72 ? "COOLING" : "COOL · 72° SET") },
                  heat: { col: [242, 140, 40], label: t => (t < 70 ? "HEATING" : "HEAT · 70° SET") },
                  air: { col: [64, 200, 190], label: () => "ALL SET · 72°" } };
  function draw(mode, temp, fill) {
    const key = mode + ":" + temp + ":" + Math.round(fill * 40);
    if (key === last) return; last = key;
    const m = MODES[mode] || MODES.cool, col = m.col, p = 1 - fill;
    g.clearRect(0, 0, 512, 512);
    const bg = g.createRadialGradient(256, 220, 40, 256, 256, 256);
    bg.addColorStop(0, "#19060A"); bg.addColorStop(1, "#080203");
    g.fillStyle = bg; g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.fill();
    // progress ring: how far the house has cooled
    g.lineCap = "round"; g.lineWidth = 22;
    g.strokeStyle = "rgba(255,255,255,.10)"; g.beginPath(); g.arc(256, 256, 200, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
    g.strokeStyle = `rgb(${col})`; g.beginPath(); g.arc(256, 256, 200, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * (1 - p) + 0.001)); g.stroke();
    g.fillStyle = "#FFFFFF"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "800 172px Montserrat, Arial, sans-serif"; g.fillText(String(temp), 244, 262);
    g.font = "700 64px Montserrat, Arial, sans-serif"; g.fillText("°", 360, 205);
    g.fillStyle = `rgb(${col})`; g.font = "800 34px Montserrat, Arial, sans-serif";
    g.fillText(m.label(temp), 256, 370);
    g.fillStyle = "rgba(157,230,255,.85)"; g.font = "700 26px Montserrat, Arial, sans-serif"; g.fillText(BRAND, 256, 128);
    tex.needsUpdate = true;
  }
  return { tex, draw };
}

export function start(holder, getP, opts = {}) {
  const canvas = holder.querySelector(".u-canvas");
  const phone = !!opts.phone;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !phone, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.2, 9); camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xD6F2FF, 0x1F0505, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 6); scene.add(key);
  const rimL = new THREE.PointLight(0x18A0D0, 60, 20); rimL.position.set(-3.6, 1.2, -2.2); scene.add(rimL);   // cool blue rim
  const rimR = new THREE.PointLight(0x9DE6FF, 40, 20); rimR.position.set(3.4, -1.4, -2.4); scene.add(rimR);

  const t = new THREE.Group(); scene.add(t);
  // brushed metal bezel (lathe profile = rounded edge), glass face, screen, blue accent ring
  const prof = [];
  for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + Math.PI * i / 24; prof.push(new THREE.Vector2(1.72 + 0.16 * Math.cos(a), 0.34 * Math.sin(a))); }
  const bezel = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), new THREE.MeshStandardMaterial({ color: 0xDDE6EE, metalness: 0.9, roughness: 0.28 }));
  bezel.rotation.x = Math.PI / 2; t.add(bezel);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.7, 0.5, 96), new THREE.MeshStandardMaterial({ color: 0x2A0A0A, metalness: 0.4, roughness: 0.5 }));
  back.rotation.x = Math.PI / 2; back.position.z = -0.12; t.add(back);
  const accent = new THREE.Mesh(new THREE.TorusGeometry(1.74, 0.035, 12, 128), new THREE.MeshStandardMaterial({ color: 0x18A0D0, emissive: 0x18A0D0, emissiveIntensity: 1.4 }));
  accent.position.z = -0.2; t.add(accent);
  const screen = makeScreen();
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.6, 96), new THREE.MeshBasicMaterial({ map: screen.tex }));
  face.position.z = 0.2; t.add(face);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(1.6, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }));
  glass.position.z = 0.215; t.add(glass);
  // wall plate behind (gives the turn something to read against)
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.08, 96), new THREE.MeshStandardMaterial({ color: 0x3A0E0E, metalness: 0.2, roughness: 0.8 }));
  plate.rotation.x = Math.PI / 2; plate.position.z = -0.42; t.add(plate);

  // cold specks drifting past
  const N = phone ? 60 : 160, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 9; pos[i * 3 + 1] = (Math.random() - 0.5) * 6; pos[i * 3 + 2] = (Math.random() - 0.3) * 4; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const specks = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xEAF8FF, size: phone ? 0.05 : 0.04, transparent: true, opacity: 0.2, depthWrite: false }));
  scene.add(specks);

  function resize() { const w = holder.clientWidth, h = holder.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); camera.position.z = w / h < 0.9 ? 11 : 9; }
  new ResizeObserver(resize).observe(holder); resize();
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(holder);
  let prev = performance.now(), ry = -0.85, rx = 0.25, p = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!visible) { prev = now; return; }
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    const target = Math.min(1, Math.max(0, getP()));
    p += (target - p) * 0.12;
    ry += ((-0.85 + p * 1.5) - ry) * 0.12;          // a clear turn: about -49 deg to +37 deg
    rx += ((0.25 - p * 0.35) - rx) * 0.12;
    t.rotation.set(rx, ry, 0);
    t.position.y = Math.sin(now / 1400) * 0.06;
    // the screen state follows the text beside it with no lag: opts.getStep() names whichever text block is most
    // visible right now (same frame the engine fades the words). Only the turn above is eased. Raw progress drives the numbers.
    const step = opts.getStep ? opts.getStep() : (target < 0.37 ? 0 : target < 0.67 ? 1 : 2);
    let mode, temp, fill;
    if (step === 0) { const k = Math.min(1, target / 0.37); mode = "cool"; temp = Math.round(76 - 4 * Math.min(1, k * 1.3)); fill = 0.35 + 0.65 * k; }
    else if (step === 1) { const k = Math.min(1, Math.max(0, (target - 0.37) / 0.3)); mode = "heat"; temp = Math.round(64 + 6 * Math.min(1, k * 1.3)); fill = 0.35 + 0.65 * k; }
    else { mode = "air"; temp = 72; fill = 1; }
    screen.draw(mode, temp, fill);
    accent.material.color.setHex(mode === "heat" ? 0xF28C28 : mode === "air" ? 0x40C8BE : 0x18A0D0);
    accent.material.emissive.copy(accent.material.color);
    accent.material.emissiveIntensity = 0.9 + p * 0.9;
    const arr = pg.attributes.position.array;
    for (let i = 0; i < N; i++) { arr[i * 3] -= dt * (0.15 + p * 0.6); if (arr[i * 3] < -4.5) arr[i * 3] = 4.5; }
    pg.attributes.position.needsUpdate = true; specks.material.opacity = 0.15 + p * 0.55;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
  requestAnimationFrame(() => holder.classList.add("ready"));
}
