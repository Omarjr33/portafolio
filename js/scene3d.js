/* Escena 3D del escritorio · Three.js
   Construida con geometría propia, materiales PBR, luz de lámpara con sombras
   y pantalla del monitor pintada en un canvas. Se comunica con game.js a través
   de window.Portfolio. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const P = window.Portfolio;
const pre = document.getElementById('preloader');
const preBar = document.getElementById('pre-bar');
const preText = document.getElementById('pre-text');
const container = document.getElementById('scene3d');
const startedAt = performance.now();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function progress(pct, text) {
  if (preBar) preBar.style.width = pct + '%';
  if (text && preText) preText.textContent = text;
}
progress(30, 'Cargando motor 3D…');

/* ---------- utilidades ---------- */
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const tweens = [];
function tween(obj, to, dur, { onDone, easing = ease } = {}) {
  const from = {}; for (const k in to) from[k] = obj[k];
  const t = { obj, from, to, dur, start: performance.now(), onDone, easing };
  tweens.push(t); return t;
}
function runTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i]; const k = Math.min(1, (now - t.start) / t.dur); const e = t.easing(k);
    for (const key in t.to) t.obj[key] = t.from[key] + (t.to[key] - t.from[key]) * e;
    if (k >= 1) { tweens.splice(i, 1); t.onDone && t.onDone(); }
  }
}

function noiseTexture({ size = 512, base = '#8a6242', vary = 18, grain = true, lines = 0 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * vary; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
  if (lines) {
    for (let i = 0; i < lines; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${.05 + Math.random() * .12})`; ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath(); const y = Math.random() * size; ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 32) ctx.lineTo(x, y + Math.sin(x / 40 + i) * 3 + (Math.random() - .5) * 2);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- renderer / escena ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.5 : 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d14);
scene.fog = new THREE.Fog(0x0b0d14, 5, 9);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environmentIntensity = 0.42;

const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.05, 30);
const CAM = { base: new THREE.Vector3(0, 1.22, 2.05), look: new THREE.Vector3(0, 1.0, -0.5) };
const camState = { x: 0.9, y: 1.6, z: 3.6, lx: 0, ly: 1.0, lz: -0.5, fx: 0, fy: 0 };
let entering = false;
function fitCamera() {
  const a = container.clientWidth / container.clientHeight;
  camera.fov = a < 0.8 ? 58 : a < 1.2 ? 50 : 40;
  CAM.base.set(0, a < 0.8 ? 1.18 : 1.22, a < 0.8 ? 1.75 : a < 1.2 ? 2.2 : 2.05);
  CAM.look.set(0, a < 0.8 ? 1.03 : 1.0, -0.5);
  if (window.__scene3dReady && !entering && tweens.length === 0) { camState.x = CAM.base.x; camState.y = CAM.base.y; camState.z = CAM.base.z; camState.ly = CAM.look.y; }
  camera.updateProjectionMatrix();
}
fitCamera();

/* ---------- materiales ---------- */
const woodTex = noiseTexture({ base: '#8f6646', vary: 22, lines: 60 }); woodTex.repeat.set(2, 1);
const wallTex = noiseTexture({ base: '#2b2f3b', vary: 8 }); wallTex.repeat.set(4, 2);
const floorTex = noiseTexture({ base: '#1a1b21', vary: 10, lines: 30 }); floorTex.repeat.set(4, 4);
const M = {
  wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: .55, metalness: .02 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x4b3220, roughness: .7 }),
  wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: .95 }),
  floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: .85 }),
  black: new THREE.MeshStandardMaterial({ color: 0x15161b, roughness: .35, metalness: .2 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2e36, roughness: .5, metalness: .15 }),
  key: new THREE.MeshStandardMaterial({ color: 0x3a3e4a, roughness: .6 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa0ad, roughness: .3, metalness: .8 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf1ebe0, roughness: .8 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: .9 }),
  red: new THREE.MeshStandardMaterial({ color: 0xd9412f, roughness: .35 }),
  coffee: new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: .25 }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0xa8523c, roughness: .8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3f8f5c, roughness: .6 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xe8b93c, roughness: .8 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x1f5fa8, roughness: .4 }),
  glassDark: new THREE.MeshStandardMaterial({ color: 0x0c1428, roughness: .1, metalness: .3 }),
};

/* ---------- helpers de construcción ---------- */
const interactives = [];
function box(w, h, d, mat, x, y, z, { ry = 0, rx = 0, rz = 0, shadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = shadow; m.receiveShadow = shadow;
  return m;
}
function cyl(rt, rb, h, mat, x, y, z, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function group(spot, label, ...meshes) {
  const g = new THREE.Group(); g.userData.spot = spot; g.userData.label = label;
  meshes.forEach(m => g.add(m)); scene.add(g);
  if (spot) interactives.push(g);
  return g;
}

/* ---------- habitación ---------- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), M.floor);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), M.wall);
wall.position.set(0, 2, -1.2); wall.receiveShadow = true; scene.add(wall);
const wallL = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), M.wall); wallL.position.set(-2.6, 2, 1); wallL.rotation.y = Math.PI / 2; scene.add(wallL);
const wallR = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), M.wall); wallR.position.set(2.6, 2, 1); wallR.rotation.y = -Math.PI / 2; scene.add(wallR);
scene.add(box(10, 0.08, 0.02, M.woodDark, 0, 0.04, -1.19, { shadow: false }));

/* ventana */
{
  const g = new THREE.Group();
  const W = 0.86, H = 0.7, T = 0.05, D = 0.06, Z = -1.2 + D / 2;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe9e2d3, roughness: .6 });
  g.add(box(W, T, D, frameMat, 0, H / 2 - T / 2, Z)); g.add(box(W, T, D, frameMat, 0, -H / 2 + T / 2, Z));
  g.add(box(T, H, D, frameMat, -W / 2 + T / 2, 0, Z)); g.add(box(T, H, D, frameMat, W / 2 - T / 2, 0, Z));
  g.add(box(0.025, H - 2 * T, D * 0.8, frameMat, 0, 0, Z)); g.add(box(W - 2 * T, 0.025, D * 0.8, frameMat, 0, 0, Z));
  g.add(box(W + 0.08, 0.03, 0.1, frameMat, 0, -H / 2 - 0.015, -1.2 + 0.05));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, H - 2 * T), new THREE.MeshStandardMaterial({ color: 0x0b1530, emissive: 0x16295a, emissiveIntensity: 1.1, roughness: .15, metalness: .1 }));
  glass.position.z = -1.2 + 0.004; g.add(glass);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshStandardMaterial({ color: 0xfff4cc, emissive: 0xfff1c0, emissiveIntensity: 2.5 }));
  moon.position.set(0.16, 0.16, -1.2 + 0.006); g.add(moon);
  const cityMat = new THREE.MeshStandardMaterial({ color: 0x070c1c, roughness: 1 });
  [[-0.3, 0.12], [-0.2, 0.2], [-0.1, 0.09], [0.0, 0.24], [0.1, 0.14], [0.2, 0.19], [0.3, 0.1]].forEach(([x, h]) => {
    const bld = new THREE.Mesh(new THREE.PlaneGeometry(0.09, h), cityMat); bld.position.set(x, -H / 2 + T + h / 2, -1.2 + 0.006); g.add(bld);
    for (let k = 0; k < 3; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0xffd982, emissive: 0xffd982, emissiveIntensity: 1.5 })); w.position.set(x - 0.02 + k * 0.02, -H / 2 + T + 0.03 + (k % 2) * 0.05, -1.2 + 0.007); g.add(w); }
  });
  g.position.set(-1.25, 1.55, 0); scene.add(g);
  const winLight = new THREE.PointLight(0x5b7cff, 1.2, 3, 2); winLight.position.set(-1.1, 1.5, -0.9); scene.add(winLight);
}

/* ---------- escritorio ---------- */
scene.add(box(2.3, 0.045, 0.95, M.wood, 0, 0.72, -0.38));
scene.add(box(0.05, 0.7, 0.9, M.woodDark, -1.12, 0.35, -0.38));
scene.add(box(0.05, 0.7, 0.9, M.woodDark, 1.12, 0.35, -0.38));
scene.add(box(2.2, 0.05, 0.05, M.woodDark, 0, 0.12, -0.78));
{ // cajonera
  scene.add(box(0.46, 0.66, 0.86, M.woodDark, 0.86, 0.33, -0.38));
  [0.5, 0.28].forEach(y => { scene.add(box(0.4, 0.18, 0.02, M.wood, 0.86, y, 0.06)); scene.add(box(0.08, 0.015, 0.02, M.metal, 0.86, y, 0.075)); });
}

/* ---------- monitor ---------- */
const SCREEN = { w: 0.62, h: 0.35 };
const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1024; screenCanvas.height = 580;
const sctx = screenCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace;
const screenMat = new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 1.15, roughness: .25, metalness: .1 });
let screenHover = false;
function drawScreen() {
  const w = screenCanvas.width, h = screenCanvas.height;
  const g = sctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0b1224'); g.addColorStop(1, '#152a52');
  sctx.fillStyle = g; sctx.fillRect(0, 0, w, h);
  sctx.fillStyle = 'rgba(125,211,252,.9)'; sctx.font = '500 20px "JetBrains Mono", monospace'; sctx.textAlign = 'left';
  sctx.fillText('OmarOS 1.0 — bloqueado', 36, 44);
  sctx.textAlign = 'right'; sctx.fillStyle = 'rgba(125,211,252,.6)';
  sctx.fillText(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), w - 36, 44);
  // logo
  sctx.fillStyle = '#eef2ff'; roundRect(sctx, w / 2 - 70, 150, 140, 140, 34); sctx.fill();
  sctx.fillStyle = '#0c1428'; sctx.font = '800 66px Manrope, sans-serif'; sctx.textAlign = 'center'; sctx.fillText('OC', w / 2, 243);
  sctx.fillStyle = '#fff'; sctx.font = '700 40px Manrope, sans-serif'; sctx.fillText('Omar Cardona', w / 2, 360);
  sctx.fillStyle = '#9fb3d9'; sctx.font = '500 20px "JetBrains Mono", monospace'; sctx.fillText('Desarrollador Full Stack', w / 2, 398);
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  sctx.fillStyle = screenHover ? '#ffffff' : '#7dd3fc'; sctx.font = `${screenHover ? 700 : 500} 22px "JetBrains Mono", monospace`;
  const msg = screenHover ? '› entrar a OmarOS' : '› toca la pantalla para entrar';
  sctx.fillText(msg, w / 2, 490);
  if (blink) { const tw = sctx.measureText(msg).width; sctx.fillRect(w / 2 + tw / 2 + 8, 470, 12, 24); }
  screenTex.needsUpdate = true;
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

const monitor = new THREE.Group();
monitor.add(cyl(0.17, 0.19, 0.016, M.dark, 0, 0.75, -0.6));
monitor.add(box(0.07, 0.24, 0.035, M.dark, 0, 0.87, -0.6));
const head = new THREE.Group(); head.position.set(0, 1.13, -0.585); head.rotation.x = -0.06;
head.add(box(SCREEN.w + 0.04, SCREEN.h + 0.04, 0.028, M.black, 0, 0, 0));
head.add(box(SCREEN.w + 0.02, SCREEN.h + 0.02, 0.004, M.glassDark, 0, 0, 0.0145));
const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), screenMat); screen.position.z = 0.0175; screen.name = 'screen';
head.add(screen);
const sticker = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: .6 }));
sticker.position.set(SCREEN.w / 2 - 0.01, -SCREEN.h / 2 + 0.005, 0.0155); sticker.rotation.z = -0.15; head.add(sticker);
monitor.add(head);
monitor.userData = { spot: 'monitor', label: 'Computador · entrar a OmarOS' };
scene.add(monitor); interactives.push(monitor);
const screenLight = new THREE.PointLight(0x7fb0ff, 1.6, 2.2, 2); screenLight.position.set(0, 1.1, -0.3); scene.add(screenLight);

/* ---------- teclado y mouse ---------- */
{
  const kb = new THREE.Group();
  kb.add(box(0.46, 0.02, 0.16, M.dark, 0, 0.752, -0.1));
  const keyGeo = new THREE.BoxGeometry(0.024, 0.008, 0.022);
  const keys = new THREE.InstancedMesh(keyGeo, M.key, 15 * 5); keys.castShadow = true; keys.receiveShadow = true;
  const mtx = new THREE.Matrix4(); let i = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) { mtx.setPosition(-0.2 + c * 0.0286 + (r % 2) * 0.006, 0.766, -0.155 + r * 0.028); keys.setMatrixAt(i++, mtx); }
  kb.add(keys);
  const space = box(0.16, 0.008, 0.022, M.key, 0.005, 0.766, -0.043); kb.add(space);
  scene.add(kb);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), M.dark);
  mouse.scale.set(1, 0.65, 1.55); mouse.position.set(0.36, 0.762, -0.1); mouse.castShadow = true; scene.add(mouse);
}

/* ---------- lámpara ---------- */
const lamp = new THREE.Group();
const LX = -0.8, LZ = -0.6;
const lampMat = new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: .35, metalness: .6 });
lamp.add(cyl(0.1, 0.11, 0.022, lampMat, LX, 0.753, LZ));
lamp.add(cyl(0.012, 0.012, 0.5, lampMat, LX, 1.01, LZ));
const jointA = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), lampMat); jointA.position.set(LX, 1.26, LZ); lamp.add(jointA);
// brazo: desde el poste (LX,1.26) hasta la cabeza (-0.42,1.36,-0.42)
const headPos = new THREE.Vector3(-0.42, 1.36, -0.42);
const armFrom = new THREE.Vector3(LX, 1.26, LZ);
const armDir = headPos.clone().sub(armFrom); const armLen = armDir.length();
const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, armLen, 16), lampMat);
arm.position.copy(armFrom).add(armDir.clone().multiplyScalar(0.5));
arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir.clone().normalize());
arm.castShadow = true; lamp.add(arm);
const jointB = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), lampMat); jointB.position.copy(headPos); lamp.add(jointB);
// cabeza: cono abierto hacia abajo, ligeramente inclinado hacia el escritorio
const head3 = new THREE.Group(); head3.position.copy(headPos); head3.rotation.z = 0.22; head3.rotation.x = -0.18;
const shade = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.15, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: .35, metalness: .6, side: THREE.DoubleSide }));
shade.rotation.x = Math.PI; shade.position.y = -0.075; shade.castShadow = true; head3.add(shade);
const shadeIn = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.145, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: .6, side: THREE.BackSide }));
shadeIn.rotation.x = Math.PI; shadeIn.position.y = -0.075; head3.add(shadeIn);
const cap = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), lampMat); head3.add(cap);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffd27a, emissiveIntensity: 3 }));
bulb.position.y = -0.1; head3.add(bulb);
lamp.add(head3);
lamp.userData = { spot: 'lamp', label: 'Lámpara · luz' }; scene.add(lamp); interactives.push(lamp);
const bulbWorld = new THREE.Vector3(); head3.updateMatrixWorld(true); bulb.getWorldPosition(bulbWorld);

const spot = new THREE.SpotLight(0xffc37a, 60, 5, 0.75, 0.6, 1.5);
spot.position.copy(bulbWorld); spot.target.position.set(-0.25, 0.74, -0.15);
spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0004; spot.shadow.radius = 4;
scene.add(spot, spot.target);
const hemi = new THREE.HemisphereLight(0x8a9cff, 0x3a2a1c, 0.75); scene.add(hemi);
const fill = new THREE.DirectionalLight(0x9fb0ff, 0.6); fill.position.set(1.5, 2.6, 2.5); scene.add(fill);
const warm = new THREE.PointLight(0xffb066, 3, 3, 2); warm.position.copy(bulbWorld).add(new THREE.Vector3(0, -0.05, 0.1)); scene.add(warm);
let lightsOn = true;
function toggleLights() {
  lightsOn = !lightsOn;
  tween(spot, { intensity: lightsOn ? 60 : 0 }, 350);
  tween(warm, { intensity: lightsOn ? 3 : 0 }, 350);
  tween(bulb.material, { emissiveIntensity: lightsOn ? 3 : 0.1 }, 350);
  tween(hemi, { intensity: lightsOn ? 0.75 : 0.25 }, 350);
  tween(renderer, { toneMappingExposure: lightsOn ? 1.05 : 0.75 }, 350);
}

/* ---------- objetos del escritorio ---------- */
// taza
{
  const g = group('mug', 'Café · disponibilidad');
  g.add(cyl(0.046, 0.04, 0.1, M.red, 0.52, 0.792, -0.3));
  const top = cyl(0.04, 0.04, 0.004, M.coffee, 0.52, 0.842, -0.3); g.add(top);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 12, 32), M.red);
  handle.position.set(0.567, 0.795, -0.3); handle.castShadow = true; g.add(handle);
}
// libreta y bolígrafo
{
  const g = group('notebook', 'Libreta · sobre mí');
  const nb = box(0.24, 0.012, 0.17, M.paper, -0.58, 0.748, -0.12, { ry: 0.28 }); g.add(nb);
  const nc = document.createElement('canvas'); nc.width = 720; nc.height = 510; const x = nc.getContext('2d');
  x.fillStyle = '#fbf8f1'; x.fillRect(0, 0, 720, 510);
  x.strokeStyle = '#d8e3f2'; x.lineWidth = 2; for (let y = 90; y < 510; y += 34) { x.beginPath(); x.moveTo(30, y); x.lineTo(690, y); x.stroke(); }
  x.strokeStyle = '#e8a3a3'; x.beginPath(); x.moveTo(80, 0); x.lineTo(80, 510); x.stroke();
  x.fillStyle = '#163d80'; x.font = '800 40px "JetBrains Mono", monospace'; x.textAlign = 'left'; x.fillText('sobre mí', 100, 70);
  x.font = '700 24px "JetBrains Mono", monospace'; x.fillStyle = '#16223a';
  ['- dev full stack, Colombia', '- antes: audiovisual y marketing', '- Next.js / React / Python / C#', '- AWS / Docker / PostgreSQL', '- me gusta que se vea bien', '', '  ¿jugamos triqui? ->'].forEach((l, i) => x.fillText(l, 100, 118 + i * 34));
  x.strokeStyle = '#1f4e9c'; x.lineWidth = 3; [[560, 330, 560, 450], [600, 330, 600, 450], [520, 370, 640, 370], [520, 410, 640, 410]].forEach(([a1, b1, c1, d1]) => { x.beginPath(); x.moveTo(a1, b1); x.lineTo(c1, d1); x.stroke(); });
  x.strokeStyle = '#c0392b'; x.beginPath(); x.moveTo(530, 340); x.lineTo(552, 362); x.moveTo(552, 340); x.lineTo(530, 362); x.stroke();
  x.strokeStyle = '#1f4e9c'; x.beginPath(); x.arc(580, 390, 12, 0, Math.PI * 2); x.stroke();
  const ntex = new THREE.CanvasTexture(nc); ntex.colorSpace = THREE.SRGBColorSpace;
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.232, 0.162), new THREE.MeshStandardMaterial({ map: ntex, color: 0xcfcbc2, roughness: .95 }));
  page.rotation.x = -Math.PI / 2; page.rotation.z = 0.28; page.position.set(-0.58, 0.7545, -0.12); g.add(page);
  const pen = cyl(0.005, 0.005, 0.15, M.blue, -0.37, 0.752, -0.07); pen.rotation.z = Math.PI / 2; pen.rotation.y = -0.6; g.add(pen);
}
// teléfono
{
  const g = group('phone', 'Teléfono · contacto');
  g.add(box(0.072, 0.008, 0.148, M.black, 0.6, 0.746, -0.04, { ry: -0.35 }));
  const pc = document.createElement('canvas'); pc.width = 300; pc.height = 640; const x = pc.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, 640); bg.addColorStop(0, '#12213f'); bg.addColorStop(1, '#0b1428'); x.fillStyle = bg; x.fillRect(0, 0, 300, 640);
  x.fillStyle = '#25d366'; x.fillRect(0, 0, 300, 96);
  x.fillStyle = '#fff'; x.font = '700 30px Manrope, sans-serif'; x.textAlign = 'left'; x.fillText('Contacto', 22, 62);
  x.font = '500 16px "JetBrains Mono", monospace'; x.textAlign = 'right'; x.fillText(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), 280, 32);
  const rows = [['@', 'Correo', 'omarjrcardona33@gmail.com'], ['W', 'WhatsApp', '+57 301 377 2740'], ['in', 'LinkedIn', 'omar-cardona33'], ['GH', 'GitHub', 'Omarjr33'], ['CV', 'Hoja de vida', 'Descargar PDF']];
  rows.forEach(([ic, t, v], i) => {
    const y = 130 + i * 96;
    x.fillStyle = 'rgba(255,255,255,.07)'; roundRect(x, 18, y, 264, 78, 16); x.fill();
    x.fillStyle = '#7dd3fc'; x.beginPath(); x.arc(58, y + 39, 22, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#0c1428'; x.font = '800 16px Manrope, sans-serif'; x.textAlign = 'center'; x.fillText(ic, 58, y + 45);
    x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = '700 19px Manrope, sans-serif'; x.fillText(t, 96, y + 34);
    x.fillStyle = '#9fb3d9'; x.font = '500 13px "JetBrains Mono", monospace'; x.fillText(v, 96, y + 58);
  });
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '600 14px Manrope, sans-serif'; x.fillText('Respondo en menos de 24 h', 150, 620);
  const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.132), new THREE.MeshStandardMaterial({ map: ptex, emissive: 0xffffff, emissiveMap: ptex, emissiveIntensity: .9, roughness: .2 }));
  scr.rotation.x = -Math.PI / 2; scr.rotation.z = -0.35; scr.position.set(0.6, 0.7505, -0.04); g.add(scr);
}
// bandeja de papeles (experiencia)
{
  const g = group('tray', 'Carpeta · experiencia');
  g.add(box(0.3, 0.012, 0.22, M.cream, 0.84, 0.75, -0.42, { ry: -0.08 }));
  g.add(box(0.3, 0.012, 0.22, M.paper, 0.845, 0.762, -0.425, { ry: -0.12 }));
  g.add(box(0.31, 0.03, 0.23, M.yellow, 0.84, 0.782, -0.42, { ry: -0.1 }));
  g.add(box(0.1, 0.006, 0.05, M.yellow, 0.72, 0.8, -0.5, { ry: -0.1 }));
}
// planta
{
  const g = new THREE.Group();
  g.add(cyl(0.085, 0.065, 0.17, M.terracotta, 1.0, 0.83, -0.66));
  g.add(cyl(0.09, 0.09, 0.02, M.terracotta, 1.0, 0.915, -0.66));
  g.add(cyl(0.078, 0.078, 0.01, new THREE.MeshStandardMaterial({ color: 0x2b1d12, roughness: 1 }), 1.0, 0.92, -0.66));
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 18, 12), M.leaf);
    leaf.scale.set(0.45, 1.7, 0.28); leaf.position.set(1.0 + Math.cos(a) * 0.07, 1.02 + (i % 3) * 0.04, -0.66 + Math.sin(a) * 0.07);
    leaf.rotation.set(Math.sin(a) * 0.6, a, Math.cos(a) * 0.6); leaf.castShadow = true; g.add(leaf);
  }
  scene.add(g);
}

/* ---------- pared: repisa, cámara, notas, cuadros ---------- */
{
  scene.add(box(1.0, 0.03, 0.2, M.woodDark, 0.75, 1.62, -1.1));
  const colors = [0xc94f4f, 0x3f6fb5, 0xe2b04a, 0x4f9d69, 0xe07b39, 0x8e5cc9];
  let x = 0.32;
  colors.forEach((c, i) => { const h = 0.16 + (i % 3) * 0.03, w = 0.03 + (i % 2) * 0.012; scene.add(box(w, h, 0.15, new THREE.MeshStandardMaterial({ color: c, roughness: .7 }), x, 1.635 + h / 2, -1.1)); x += w + 0.004; });
  const cam = group('camera', 'Cámara · audiovisual y marketing');
  cam.add(box(0.15, 0.085, 0.075, M.black, 1.05, 1.68, -1.09));
  cam.add(box(0.05, 0.02, 0.05, M.dark, 1.03, 1.732, -1.09));
  const lens = cyl(0.03, 0.032, 0.05, M.dark, 1.05, 1.68, -1.04); lens.rotation.x = Math.PI / 2; cam.add(lens);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.02, 24), new THREE.MeshStandardMaterial({ color: 0x2f4a75, roughness: .05, metalness: .6 }));
  glass.position.set(1.05, 1.68, -1.014); cam.add(glass);
  cam.add(box(0.035, 0.012, 0.004, M.red, 1.0, 1.7, -1.052));
}
{
  const notes = group('notes', 'Notas · habilidades');
  [[0.5, 1.46, 0xf6d86b, -0.1], [0.62, 1.43, 0x9ed0f5, 0.08], [0.56, 1.33, 0xf5a7bf, -0.05]].forEach(([x, y, c, r]) => {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.095, 0.095), new THREE.MeshStandardMaterial({ color: c, roughness: .9, side: THREE.DoubleSide }));
    n.position.set(x, y, -1.19); n.rotation.z = r; n.castShadow = true; notes.add(n);
  });
}
{
  const frames = group('frames', 'Cuadros · formación');
  const mk = (w, h, x, y, id, info) => {
    frames.add(box(w, h, 0.025, M.woodDark, x, y, -1.185));
    frames.add(box(w - 0.02, h - 0.02, 0.028, new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: .5, roughness: .4 }), x, y, -1.185));
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85, map: diplomaTexture(info) });
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), mat); inner.position.set(x, y, -1.169); frames.add(inner);
    // si existe un escaneo real en assets/diplomas/<id>.jpg, reemplaza el dibujo
    new THREE.TextureLoader().load(`assets/diplomas/${id}.jpg`, tex => { tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; }, undefined, () => {});
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .05, metalness: .2, transparent: true, opacity: .12 }));
    glass.position.set(x, y, -1.166); frames.add(glass);
  };
  mk(0.34, 0.25, -0.53, 1.8, 'sena', { inst: 'SENA', sub: 'Servicio Nacional de Aprendizaje', title: 'Técnico en Sistemas', kind: 'certifica que' });
  mk(0.34, 0.25, -0.15, 1.8, 'campusland', { inst: 'CAMPUSLAND', sub: 'Programa de formación en software', title: 'Desarrollador de Software', kind: 'otorga el presente diploma a' });
}
function diplomaTexture({ inst, sub, title, kind }) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 754; const x = c.getContext('2d');
  x.fillStyle = '#f7f2e6'; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#b89a55'; x.lineWidth = 10; x.strokeRect(34, 34, c.width - 68, c.height - 68);
  x.lineWidth = 3; x.strokeRect(54, 54, c.width - 108, c.height - 108);
  x.textAlign = 'center'; x.fillStyle = '#1f2a3c';
  x.font = '800 62px Manrope, sans-serif'; x.fillText(inst, c.width / 2, 170);
  x.font = '500 26px Manrope, sans-serif'; x.fillStyle = '#5a6373'; x.fillText(sub, c.width / 2, 212);
  x.font = 'italic 500 30px Georgia, serif'; x.fillStyle = '#6b6f7a'; x.fillText(kind, c.width / 2, 300);
  x.font = '700 58px Manrope, sans-serif'; x.fillStyle = '#1f2a3c'; x.fillText('Omar David Cardona Romero', c.width / 2, 372);
  x.font = '500 28px Manrope, sans-serif'; x.fillStyle = '#5a6373'; x.fillText('culminó satisfactoriamente el programa', c.width / 2, 430);
  x.font = '800 44px Manrope, sans-serif'; x.fillStyle = '#1f4e9c'; x.fillText(title, c.width / 2, 500);
  x.strokeStyle = '#1f2a3c'; x.lineWidth = 2; x.beginPath(); x.moveTo(160, 640); x.lineTo(420, 640); x.stroke(); x.beginPath(); x.moveTo(604, 640); x.lineTo(864, 640); x.stroke();
  x.font = '500 20px Manrope, sans-serif'; x.fillStyle = '#5a6373'; x.fillText('Director', 290, 670); x.fillText('Coordinador académico', 734, 670);
  x.beginPath(); x.arc(c.width / 2, 640, 44, 0, Math.PI * 2); x.fillStyle = '#c9a24a'; x.fill();
  x.beginPath(); x.arc(c.width / 2, 640, 34, 0, Math.PI * 2); x.strokeStyle = '#8a6d23'; x.lineWidth = 3; x.stroke();
  x.font = '800 18px Manrope, sans-serif'; x.fillStyle = '#5a4510'; x.fillText('SELLO', c.width / 2, 646);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- interacción ---------- */
// cada objeto interactivo usa materiales propios para que el resaltado no afecte al resto
interactives.forEach(g => g.traverse(o => { if (o.isMesh && o.material && !o.material.emissiveMap) o.material = o.material.clone(); }));
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-2, -2);
let hovered = null;

function setHover(g) {
  if (hovered === g) return;
  if (hovered) { hovered.traverse(o => { if (o.isMesh && o.userData.em !== undefined) { o.material.emissiveIntensity = o.userData.em; } }); }
  hovered = g;
  screenHover = false;
  if (g) {
    g.traverse(o => {
      if (o.isMesh && o.material && o.material.emissive && o.name !== 'screen' && !o.material.emissiveMap) {
        if (o.userData.em === undefined) o.userData.em = o.material.emissiveIntensity || 0;
        if (o.userData.em === 0) { o.material.emissive.set(0x7dd3fc); }
        o.material.emissiveIntensity = o.userData.em > 0 ? o.userData.em : 0.18;
      }
    });
    if (g.userData.spot === 'monitor') screenHover = true;
    P.showLabel(g.userData.label);
    renderer.domElement.style.cursor = 'pointer';
  } else { P.hideLabel(); renderer.domElement.style.cursor = ''; }
}
function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactives, true);
  if (!hits.length) return null;
  let o = hits[0].object; while (o && !o.userData.spot) o = o.parent; return o;
}
const el = renderer.domElement;
el.addEventListener('pointermove', e => {
  pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
  camState.fx = pointer.x; camState.fy = pointer.y;
  if (e.pointerType === 'mouse') { P.moveLabel(e.clientX, e.clientY); if (!entering) setHover(pick()); }
});
el.addEventListener('pointerleave', () => { setHover(null); camState.fx = 0; camState.fy = 0; });
el.addEventListener('pointerdown', e => { pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1); });
const SPOT_CAM = {
  notebook: { pos: [-0.64, 1.0, 0.16], look: [-0.58, 0.75, -0.12], side: 'right' },
  phone: { pos: [0.55, 1.0, 0.26], look: [0.6, 0.75, -0.04], side: 'left' },
  mug: { pos: [0.5, 1.02, 0.14], look: [0.52, 0.8, -0.3], side: 'left' },
  tray: { pos: [0.8, 1.12, 0.1], look: [0.84, 0.78, -0.42], side: 'left' },
  notes: { pos: [0.5, 1.42, -0.5], look: [0.56, 1.4, -1.19], side: 'left' },
  frames: { pos: [-0.34, 1.82, -0.42], look: [-0.34, 1.8, -1.19], side: 'right' },
  camera: { pos: [0.95, 1.7, -0.5], look: [1.05, 1.68, -1.09], side: 'left' },
};
let zoomed = null, suppressReturn = false;
function zoomTo(spot) {
  const c = SPOT_CAM[spot]; if (!c) { P.activateSpot(spot); return; }
  zoomed = spot; setHover(null);
  tween(camState, { x: c.pos[0], y: c.pos[1], z: c.pos[2], lx: c.look[0], ly: c.look[1], lz: c.look[2] }, reduceMotion ? 10 : 900);
  setTimeout(() => P.openPanel(spot, c.side), reduceMotion ? 0 : 450);
}
function returnCamera() { zoomed = null; introCamera(800); }
P.onPanelClose(() => { if (zoomed && !suppressReturn) returnCamera(); });

el.addEventListener('click', e => {
  if (entering) return;
  pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);
  const g = pick();
  if (!g) { if (zoomed) P.closePanel(); return; }
  const s = g.userData.spot;
  if (s === 'lamp') { toggleLights(); return; }
  if (s === 'monitor') { suppressReturn = true; P.closePanel(); suppressReturn = false; zoomed = null; flyIn(); return; }
  if (zoomed === s) return;
  if (zoomed) { suppressReturn = true; P.closePanel(); suppressReturn = false; }
  zoomTo(s);
});

function flyIn() {
  entering = true; setHover(null); P.hideLabel();
  const target = new THREE.Vector3(0, 1.13, -0.585);
  tween(camState, { x: 0, y: 1.13, z: 0.12, lx: 0, ly: 1.13, lz: -0.585 }, reduceMotion ? 10 : 1150, {
    onDone: () => { P.enterOS(undefined, { instant: true }); setTimeout(resetCamera, 900); },
  });
  setTimeout(() => P.fadeTo(1), reduceMotion ? 0 : 800);
}
function resetCamera() { entering = false; camState.x = 0.6; camState.y = 1.6; camState.z = 3.4; introCamera(600); }
function introCamera(ms = 2200) {
  tween(camState, { x: CAM.base.x, y: CAM.base.y, z: CAM.base.z, lx: CAM.look.x, ly: CAM.look.y, lz: CAM.look.z }, reduceMotion ? 10 : ms);
}
P.onExitOS(() => { P.fadeTo(0); });

/* ---------- bucle ---------- */
const look = new THREE.Vector3();
let last = 0, screenTick = 0;
function animate(now) {
  requestAnimationFrame(animate);
  runTweens(now);
  const dt = Math.min(1, (now - last) / 1000); last = now;
  const k = 1 - Math.exp(-dt * 6);
  const still = entering || zoomed; const px = still ? 0 : camState.fx * 0.14, py = still ? 0 : camState.fy * 0.07;
  camera.position.x += (camState.x + px - camera.position.x) * k;
  camera.position.y += (camState.y + py - camera.position.y) * k;
  camera.position.z += (camState.z - camera.position.z) * k;
  look.set(camState.lx, camState.ly, camState.lz); camera.lookAt(look);
  if (now - screenTick > 250) { drawScreen(); screenTick = now; }
  renderer.render(scene, camera);
}

function onResize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h); camera.aspect = w / h; fitCamera();
}
window.addEventListener('resize', onResize);

/* ---------- arranque ---------- */
progress(70, 'Construyendo el escritorio…');
drawScreen();
renderer.compile(scene, camera);
renderer.render(scene, camera);
progress(100, 'Listo');
window.__scene3dReady = true;
const minShow = 1500;
setTimeout(() => {
  pre.classList.add('is-done');
  setTimeout(() => { pre.hidden = true; }, 600);
  introCamera();
  requestAnimationFrame(animate);
}, Math.max(0, minShow - (performance.now() - startedAt)));
