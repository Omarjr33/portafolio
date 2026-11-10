/* Escena 3D del escritorio · Three.js
   Construida con geometría propia, materiales PBR, luz de lámpara con sombras
   y pantalla del monitor pintada en un canvas. Se comunica con game.js a través
   de window.Portfolio. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const P = window.Portfolio;
const pre = document.getElementById('preloader');
const preBar = document.getElementById('pre-bar');
const preText = document.getElementById('pre-text');
const container = document.getElementById('scene3d');
const sceneWrap = document.getElementById('scene-wrap');
const startedAt = performance.now();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;

// calidad: en táctiles, pantallas pequeñas o equipos modestos se omite el bloom y se baja la sombra
const lowEnd = coarse || Math.min(window.innerWidth, window.innerHeight) < 720 || (navigator.hardwareConcurrency || 8) <= 4;

function progress(pct, text) {
  if (preBar) preBar.style.width = pct + '%';
  if (text && preText) preText.textContent = text;
}
progress(30, 'Cargando motor 3D…');

const timeout = ms => new Promise(r => setTimeout(r, ms));
// las texturas de canvas usan Manrope y JetBrains Mono: esperar a que estén (máximo 1,5 s)
await Promise.race([
  Promise.all(['800 40px Manrope', '700 40px Manrope', '500 20px "JetBrains Mono"', '700 24px "JetBrains Mono"'].map(f => document.fonts.load(f))).catch(() => {}),
  timeout(1500),
]);

/* ---------- utilidades ---------- */
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const tweens = [];
function tween(obj, to, dur, { onDone, easing = ease } = {}) {
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj) { for (const k in to) delete tweens[i].to[k]; }
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
const camTweening = () => tweens.some(t => t.obj === camState);

function noiseTexture({ size = 512, base = '#8a6242', vary = 18, lines = 0 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * vary; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < lines; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${.05 + Math.random() * .12})`; ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath(); const y = Math.random() * size; ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 32) ctx.lineTo(x, y + Math.sin(x / 40 + i) * 3 + (Math.random() - .5) * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* ---------- renderer / escena ---------- */
const maxDpr = lowEnd ? 1.5 : 2;
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.style.touchAction = 'none';
container.appendChild(renderer.domElement);
const maxAniso = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d14);
scene.fog = new THREE.Fog(0x0b0d14, 5, 9);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environmentIntensity = 0.42;

const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.05, 30);
const CAM = { base: new THREE.Vector3(0, 1.22, 2.05), look: new THREE.Vector3(0, 1.0, -0.5) };
// la toma inicial arranca mirando la ciudad por la ventana y luego revela el escritorio
const camState = reduceMotion ? { x: 0, y: 1.22, z: 2.05, lx: 0, ly: 1.0, lz: -0.5, fx: 0, fy: 0 } : { x: -0.85, y: 1.62, z: 0.55, lx: -1.25, ly: 1.52, lz: -1.2, fx: 0, fy: 0 };
let entering = false;
let panMax = 0;
const aspect = () => container.clientWidth / container.clientHeight;
function fitCamera() {
  const a = aspect();
  camera.fov = a < 0.8 ? 58 : a < 1.2 ? 50 : 40;
  CAM.base.set(0, a < 0.8 ? 1.18 : 1.22, a < 0.8 ? 1.75 : a < 1.2 ? 2.2 : 2.05);
  CAM.look.set(0, a < 0.8 ? 1.03 : 1.0, -0.5);
  // en vertical el escritorio no cabe: se recorre deslizando de lado
  panMax = a < 0.6 ? 0.68 : a < 0.8 ? 0.55 : a < 1.2 ? 0.3 : 0;
  pan.target = Math.max(-panMax, Math.min(panMax, pan.target));
  if (window.__scene3dReady && !entering && !zoomed && !camTweening()) { camState.x = CAM.base.x; camState.y = CAM.base.y; camState.z = CAM.base.z; camState.ly = CAM.look.y; }
  camera.updateProjectionMatrix();
}
const pan = { target: 0, value: 0, applied: 0 };
let zoomed = null;
fitCamera();
camera.position.set(camState.x, camState.y, camState.z); camera.lookAt(camState.lx, camState.ly, camState.lz);

/* ---------- postproceso (solo en equipos con margen) ---------- */
let composer = null, bloomPass = null;
if (!lowEnd && !reduceMotion) {
  try {
    const mods = await Promise.race([Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
    ]), timeout(4000).then(() => null)]);
    if (mods) {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = mods;
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth / 2, container.clientHeight / 2), 0.42, 0.55, 0.9);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }
  } catch (_) { composer = null; }
}
progress(50, 'Armando el escritorio…');

/* ---------- materiales ---------- */
const woodTex = noiseTexture({ base: '#8f6646', vary: 22, lines: 60 }); woodTex.repeat.set(2, 1); woodTex.anisotropy = maxAniso;
const wallTex = noiseTexture({ base: '#2b2f3b', vary: 8 }); wallTex.repeat.set(4, 2);
const floorTex = noiseTexture({ base: '#1a1b21', vary: 10, lines: 30 }); floorTex.repeat.set(4, 4);
const feltTex = noiseTexture({ size: 256, base: '#161a24', vary: 12 }); feltTex.repeat.set(3, 1);
const M = {
  wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: .55, metalness: .02 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x6e5a4c, roughness: .7 }),
  wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: .95, color: 0xd8dbe6 }),
  floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: .85 }),
  felt: new THREE.MeshStandardMaterial({ map: feltTex, roughness: 1 }),
  black: new THREE.MeshStandardMaterial({ color: 0x15161b, roughness: .35, metalness: .2 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2e36, roughness: .5, metalness: .15 }),
  key: new THREE.MeshStandardMaterial({ color: 0x3a3e4a, roughness: .6 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa0ad, roughness: .3, metalness: .8 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf1ebe0, roughness: .8 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: .9 }),
  red: new THREE.MeshStandardMaterial({ color: 0xd9412f, roughness: .35 }),
  coffee: new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: .15 }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0xa8523c, roughness: .8 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3f8f5c, roughness: .55, side: THREE.DoubleSide }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x2f7148, roughness: .55, side: THREE.DoubleSide }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xe8b93c, roughness: .8 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x1f5fa8, roughness: .4 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x111216, roughness: .6 }),
  glassDark: new THREE.MeshStandardMaterial({ color: 0x0c1428, roughness: .1, metalness: .3 }),
};

// texturas fotográficas (generadas con Higgsfield): reemplazan a las de ruido cuando terminan de cargar
const texLoader = new THREE.TextureLoader();
function photo(url, onLoad, { repeat = [1, 1], mirror = true } = {}) {
  texLoader.load(url, tex => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    tex.wrapS = tex.wrapT = mirror ? THREE.MirroredRepeatWrapping : THREE.ClampToEdgeWrapping;
    tex.repeat.set(...repeat); onLoad(tex);
  }, undefined, () => {});
}
const swap = (mat, opts) => url => photo(url, tex => { mat.map = tex; mat.needsUpdate = true; }, opts);
swap(M.wood, { repeat: [1.4, 0.7] })('assets/textures/wood.webp');
swap(M.woodDark, { repeat: [0.6, 1] })('assets/textures/wood.webp');
swap(M.wall, { repeat: [3, 1.3] })('assets/textures/wall.webp');
swap(M.felt, { repeat: [2.5, 0.9] })('assets/textures/felt.webp');
swap(M.floor, { repeat: [3, 3] })('assets/textures/floor.webp');

/* ---------- helpers de construcción ---------- */
const interactives = [];
function box(w, h, d, mat, x, y, z, { ry = 0, rx = 0, rz = 0, shadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = shadow; m.receiveShadow = shadow;
  return m;
}
// caja con aristas redondeadas: el radio no puede pasar de la mitad del lado más corto
function rbox(w, h, d, r, mat, x, y, z, { ry = 0, rx = 0, rz = 0, shadow = true, seg = 3 } = {}) {
  const rr = Math.min(r, Math.min(w, h, d) / 2 - 1e-4);
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, rr), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = shadow; m.receiveShadow = shadow;
  return m;
}
function cyl(rt, rb, h, mat, x, y, z, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function cable(points, r = 0.004) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 8), M.cable);
  m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
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

/* ventana: cielo pintado, estrellas que titilan y ciudad con luces */
const stars = [];
const rain = { canvas: document.createElement('canvas'), tex: null, drops: [], beads: [], streaks: [] };
{
  const g = new THREE.Group();
  const W = 0.86, H = 0.7, T = 0.05, D = 0.06, Z = -1.2 + D / 2;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe9e2d3, roughness: .6 });
  g.add(rbox(W, T, D, .008, frameMat, 0, H / 2 - T / 2, Z)); g.add(rbox(W, T, D, .008, frameMat, 0, -H / 2 + T / 2, Z));
  g.add(rbox(T, H, D, .008, frameMat, -W / 2 + T / 2, 0, Z)); g.add(rbox(T, H, D, .008, frameMat, W / 2 - T / 2, 0, Z));
  g.add(box(0.025, H - 2 * T, D * 0.8, frameMat, 0, 0, Z)); g.add(box(W - 2 * T, 0.025, D * 0.8, frameMat, 0, 0, Z));
  g.add(rbox(W + 0.08, 0.03, 0.1, .008, frameMat, 0, -H / 2 - 0.015, -1.2 + 0.05));
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 256; const sx = sc.getContext('2d');
  const sky = sx.createLinearGradient(0, 0, 0, 256); sky.addColorStop(0, '#071029'); sky.addColorStop(.65, '#14306a'); sky.addColorStop(1, '#2c4c8f');
  sx.fillStyle = sky; sx.fillRect(0, 0, 256, 256);
  const skyTex = new THREE.CanvasTexture(sc); skyTex.colorSpace = THREE.SRGBColorSpace;
  const glassMat = new THREE.MeshBasicMaterial({ map: skyTex, color: 0xe6e6e6 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, H - 2 * T), glassMat);
  glass.position.z = -1.2 + 0.004; g.add(glass);
  const procSky = new THREE.Group(); g.add(procSky);
  photo('assets/textures/city.webp', tex => { glassMat.map = tex; glassMat.color.set(0xd2d6e0); glassMat.needsUpdate = true; procSky.visible = false; }, { mirror: false });
  // lluvia: gotas que resbalan por el vidrio y cortinas finas afuera, pintadas en un canvas
  rain.canvas.width = 384; rain.canvas.height = 300;
  rain.tex = new THREE.CanvasTexture(rain.canvas); rain.tex.colorSpace = THREE.SRGBColorSpace;
  const rainPane = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * T, H - 2 * T), new THREE.MeshBasicMaterial({ map: rain.tex, transparent: true, depthWrite: false }));
  rainPane.position.z = -1.2 + 0.009; g.add(rainPane);
  // dos capas de estrellas que titilan desfasadas
  const dot = dotTexture();
  for (let layer = 0; layer < 2; layer++) {
    const pos = [];
    for (let i = 0; i < 22; i++) pos.push((Math.random() - .5) * (W - 2 * T - .04), Math.random() * (H / 2 - T - .02) + .02, -1.2 + 0.005);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: layer ? .007 : .005, map: dot, transparent: true, depthWrite: false, color: 0xdfe8ff, blending: THREE.AdditiveBlending }));
    pts.userData.phase = layer * Math.PI; procSky.add(pts); stars.push(pts);
  }
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshStandardMaterial({ color: 0xfff4cc, emissive: 0xfff1c0, emissiveIntensity: 2.5 }));
  moon.position.set(0.16, 0.16, -1.2 + 0.006); procSky.add(moon);
  const cityMat = new THREE.MeshStandardMaterial({ color: 0x070c1c, roughness: 1 });
  const winMat = new THREE.MeshStandardMaterial({ color: 0xffd982, emissive: 0xffd982, emissiveIntensity: 1.5 });
  [[-0.3, 0.12], [-0.2, 0.2], [-0.1, 0.09], [0.0, 0.24], [0.1, 0.14], [0.2, 0.19], [0.3, 0.1]].forEach(([x, h]) => {
    const bld = new THREE.Mesh(new THREE.PlaneGeometry(0.09, h), cityMat); bld.position.set(x, -H / 2 + T + h / 2, -1.2 + 0.006); procSky.add(bld);
    for (let k = 0; k < 3; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.012), winMat); w.position.set(x - 0.02 + k * 0.02, -H / 2 + T + 0.03 + (k % 2) * 0.05, -1.2 + 0.007); procSky.add(w); }
  });
  g.position.set(-1.25, 1.55, 0); scene.add(g);
  const winLight = new THREE.PointLight(0x5b7cff, 1.2, 3, 2); winLight.position.set(-1.1, 1.5, -0.9); scene.add(winLight);
}

/* lluvia en el vidrio */
{
  const R = rain, cw = R.canvas.width, ch = R.canvas.height;
  for (let i = 0; i < 140; i++) R.beads.push({ x: Math.random() * cw, y: Math.random() * ch, r: .6 + Math.random() * 1.6 });
  for (let i = 0; i < 70; i++) R.streaks.push({ x: Math.random() * cw, y: Math.random() * ch, l: 10 + Math.random() * 18, v: 380 + Math.random() * 260 });
  const newDrop = top => ({ x: Math.random() * cw, y: top ? -10 : Math.random() * ch, r: 1.6 + Math.random() * 2.2, v: 0, hold: Math.random() * 3, trail: [] });
  for (let i = 0; i < 16; i++) R.drops.push(newDrop(false));
  R.update = (dt, animate) => {
    const x = R.canvas.getContext('2d');
    x.clearRect(0, 0, cw, ch);
    // cortinas de lluvia afuera, finas y tenues
    x.strokeStyle = 'rgba(190,210,255,.16)'; x.lineWidth = 1;
    x.beginPath();
    for (const s of R.streaks) {
      if (animate) { s.y += s.v * dt; s.x -= s.v * dt * .12; if (s.y > ch + 20) { s.y = -20; s.x = Math.random() * (cw + 40); } }
      x.moveTo(s.x, s.y); x.lineTo(s.x + s.l * .12, s.y - s.l);
    }
    x.stroke();
    // gotitas quietas pegadas al vidrio
    for (const b of R.beads) {
      x.fillStyle = 'rgba(10,18,40,.35)'; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 6.283); x.fill();
      x.fillStyle = 'rgba(220,232,255,.45)'; x.beginPath(); x.arc(b.x - b.r * .3, b.y - b.r * .35, b.r * .45, 0, 6.283); x.fill();
    }
    // gotas que se cargan, resbalan y dejan rastro
    for (let i = 0; i < R.drops.length; i++) {
      const d = R.drops[i];
      if (animate) {
        if (d.hold > 0) d.hold -= dt; else { d.v = Math.min(d.v + 140 * dt, 70 + d.r * 18); d.y += d.v * dt; d.x += Math.sin(d.y * .08 + i) * .15; }
        d.trail.push([d.x, d.y]); if (d.trail.length > 26) d.trail.shift();
        if (d.y > ch + 12) R.drops[i] = newDrop(true);
      }
      if (d.trail.length > 2) {
        x.strokeStyle = 'rgba(200,220,255,.18)'; x.lineWidth = d.r * .7; x.lineCap = 'round';
        x.beginPath(); d.trail.forEach(([tx, ty], k) => k ? x.lineTo(tx, ty) : x.moveTo(tx, ty)); x.stroke();
      }
      x.fillStyle = 'rgba(8,14,34,.45)'; x.beginPath(); x.ellipse(d.x, d.y, d.r, d.r * 1.25, 0, 0, 6.283); x.fill();
      x.fillStyle = 'rgba(235,242,255,.7)'; x.beginPath(); x.arc(d.x - d.r * .35, d.y - d.r * .45, d.r * .4, 0, 6.283); x.fill();
    }
    R.tex.needsUpdate = true;
  };
  R.update(0, false);
}

/* luces de carros que pasan afuera: un haz suave barre la pared cada tanto */
const carLight = new THREE.SpotLight(0xffe7c4, 0, 4, 0.32, 1, 1.2);
carLight.position.set(-1.25, 1.5, -1.05);
scene.add(carLight, carLight.target);
const car = { next: 6, t: -1, dir: 1 };

/* ---------- escritorio ---------- */
scene.add(rbox(2.3, 0.045, 0.95, 0.012, M.wood, 0, 0.72, -0.38));
scene.add(box(0.05, 0.7, 0.9, M.woodDark, -1.12, 0.35, -0.38));
scene.add(box(0.05, 0.7, 0.9, M.woodDark, 1.12, 0.35, -0.38));
scene.add(box(2.2, 0.05, 0.05, M.woodDark, 0, 0.12, -0.78));
{ // cajonera
  scene.add(box(0.46, 0.66, 0.86, M.woodDark, 0.86, 0.33, -0.38));
  [0.5, 0.28].forEach(y => { scene.add(rbox(0.4, 0.18, 0.02, 0.006, M.wood, 0.86, y, 0.06)); scene.add(rbox(0.08, 0.015, 0.02, 0.005, M.metal, 0.86, y, 0.075)); });
}
// tapete de escritorio bajo el teclado y el mouse
scene.add(rbox(0.98, 0.004, 0.34, 0.0019, M.felt, 0.08, 0.7445, -0.1, { seg: 2 }));

/* ---------- monitor ---------- */
const SCREEN = { w: 0.62, h: 0.35 };
const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1280; screenCanvas.height = 722;
const sctx = screenCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = maxAniso;
// material sin iluminación: la pantalla emite su propia luz y no refleja la lámpara
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: true });
let screenHover = false, screenKey = '';
function drawScreen() {
  const blink = Math.floor(performance.now() / 530) % 2 === 0;
  const time = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const key = `${blink}|${screenHover}|${time}`;
  if (key === screenKey) return; screenKey = key;
  const w = screenCanvas.width, h = screenCanvas.height, s = w / 1024;
  const g = sctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0a1122'); g.addColorStop(1, '#16305e');
  sctx.fillStyle = g; sctx.fillRect(0, 0, w, h);
  // ondas suaves de fondo
  sctx.lineWidth = 2 * s;
  for (let i = 0; i < 6; i++) {
    sctx.strokeStyle = `rgba(125,211,252,${.05 + i * .012})`; sctx.beginPath();
    for (let x = 0; x <= w; x += 16) { const y = h * (.62 + i * .05) + Math.sin(x / (140 * s) + i * .8) * 26 * s; x ? sctx.lineTo(x, y) : sctx.moveTo(x, y); }
    sctx.stroke();
  }
  sctx.save(); sctx.scale(s, s);
  const W = 1024;
  sctx.fillStyle = 'rgba(125,211,252,.85)'; sctx.font = '500 19px "JetBrains Mono", monospace'; sctx.textAlign = 'left';
  sctx.fillText('OmarOS 1.0 — bloqueado', 36, 44);
  sctx.textAlign = 'right'; sctx.fillStyle = 'rgba(125,211,252,.6)'; sctx.fillText('● wifi  ▮▮▮▯', W - 36, 44);
  sctx.textAlign = 'center'; sctx.fillStyle = 'rgba(255,255,255,.92)'; sctx.font = '800 92px Manrope, sans-serif';
  sctx.fillText(time, W / 2, 170);
  sctx.fillStyle = '#eef2ff'; roundRect(sctx, W / 2 - 52, 222, 104, 104, 28); sctx.fill();
  sctx.fillStyle = '#0c1428'; sctx.font = '800 50px Manrope, sans-serif'; sctx.fillText('OC', W / 2, 292);
  sctx.fillStyle = '#fff'; sctx.font = '700 38px Manrope, sans-serif'; sctx.fillText('Omar Cardona', W / 2, 382);
  sctx.fillStyle = '#9fb3d9'; sctx.font = '500 21px "JetBrains Mono", monospace'; sctx.fillText('Desarrollador Full Stack', W / 2, 418);
  const msg = screenHover ? '› entrar a OmarOS' : '› toca la pantalla para entrar';
  sctx.font = `${screenHover ? 700 : 500} 23px "JetBrains Mono", monospace`;
  const tw = sctx.measureText(msg).width;
  sctx.fillStyle = screenHover ? 'rgba(125,211,252,.22)' : 'rgba(255,255,255,.06)';
  roundRect(sctx, W / 2 - tw / 2 - 26, 462, tw + 52 + 18, 46, 23); sctx.fill();
  sctx.fillStyle = screenHover ? '#ffffff' : '#7dd3fc'; sctx.fillText(msg, W / 2, 493);
  if (blink) sctx.fillRect(W / 2 + tw / 2 + 8, 474, 12, 24);
  sctx.restore();
  screenTex.needsUpdate = true;
}

const monitor = new THREE.Group();
monitor.add(cyl(0.17, 0.19, 0.016, M.dark, 0, 0.75, -0.6, 48));
monitor.add(rbox(0.07, 0.24, 0.035, 0.012, M.dark, 0, 0.87, -0.6));
const head = new THREE.Group(); head.position.set(0, 1.13, -0.585); head.rotation.x = -0.06;
head.add(rbox(SCREEN.w + 0.04, SCREEN.h + 0.04, 0.028, 0.012, M.black, 0, 0, 0));
head.add(box(SCREEN.w + 0.02, SCREEN.h + 0.02, 0.004, M.glassDark, 0, 0, 0.0125));
const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), screenMat); screen.position.z = 0.0152; screen.name = 'screen';
head.add(screen);
const powerLed = new THREE.Mesh(new THREE.CircleGeometry(0.003, 12), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x7dffb0, emissiveIntensity: 2 }));
powerLed.position.set(0, -SCREEN.h / 2 - 0.011, 0.0142); head.add(powerLed);
monitor.add(head);
monitor.userData = { spot: 'monitor', label: 'Computador · entrar a OmarOS' };
scene.add(monitor); interactives.push(monitor);
const screenLight = new THREE.PointLight(0x7fb0ff, 1.6, 2.2, 2); screenLight.position.set(0, 1.1, -0.3); scene.add(screenLight);
cable([[0, 0.83, -0.62], [0.01, 0.78, -0.68], [0.06, 0.748, -0.78], [0.12, 0.748, -0.84], [0.16, 0.6, -0.86]]);

/* ---------- teclado y mouse ---------- */
{
  const kb = new THREE.Group();
  kb.add(rbox(0.46, 0.02, 0.16, 0.008, M.dark, 0, 0.756, -0.1));
  const keyGeo = new RoundedBoxGeometry(0.024, 0.008, 0.022, 2, 0.003);
  const keys = new THREE.InstancedMesh(keyGeo, M.key, 15 * 5); keys.castShadow = true; keys.receiveShadow = true;
  const mtx = new THREE.Matrix4(); let i = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) { mtx.setPosition(-0.2 + c * 0.0286 + (r % 2) * 0.006, 0.77, -0.155 + r * 0.028); keys.setMatrixAt(i++, mtx); }
  kb.add(keys);
  kb.add(rbox(0.16, 0.008, 0.022, 0.003, M.key, 0.005, 0.77, -0.043));
  scene.add(kb);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 20), M.dark);
  mouse.scale.set(1, 0.6, 1.55); mouse.position.set(0.36, 0.765, -0.1); mouse.castShadow = true; mouse.receiveShadow = true; scene.add(mouse);
  const wheel = cyl(0.006, 0.006, 0.004, M.key, 0.36, 0.782, -0.128, 16); wheel.rotation.z = Math.PI / 2; scene.add(wheel);
  cable([[0.36, 0.765, -0.145], [0.355, 0.75, -0.3], [0.3, 0.748, -0.5], [0.22, 0.748, -0.8], [0.2, 0.6, -0.86]], 0.0025);
}

/* ---------- lámpara ---------- */
const lamp = new THREE.Group();
const LX = -0.8, LZ = -0.6;
const lampMat = new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: .35, metalness: .6 });
lamp.add(cyl(0.1, 0.11, 0.022, lampMat, LX, 0.753, LZ, 48));
lamp.add(cyl(0.012, 0.012, 0.5, lampMat, LX, 1.01, LZ));
const jointA = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), lampMat); jointA.position.set(LX, 1.26, LZ); lamp.add(jointA);
// brazo: desde el poste hasta la cabeza
const headPos = new THREE.Vector3(-0.42, 1.36, -0.42);
const armFrom = new THREE.Vector3(LX, 1.26, LZ);
const armDir = headPos.clone().sub(armFrom); const armLen = armDir.length();
const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, armLen, 16), lampMat);
arm.position.copy(armFrom).add(armDir.clone().multiplyScalar(0.5));
arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir.clone().normalize());
arm.castShadow = true; lamp.add(arm);
const jointB = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), lampMat); jointB.position.copy(headPos); lamp.add(jointB);
// cabeza: pantalla torneada que abre hacia abajo, inclinada hacia el escritorio
const head3 = new THREE.Group(); head3.position.copy(headPos); head3.rotation.z = 0.22; head3.rotation.x = -0.18;
const profile = [[0.001, 0.012], [0.03, 0.01], [0.04, -0.01], [0.06, -0.05], [0.09, -0.1], [0.11, -0.14], [0.114, -0.152]].map(([r, y]) => new THREE.Vector2(r, y));
const shadeGeo = new THREE.LatheGeometry(profile, 56);
const shade = new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: .35, metalness: .6, side: THREE.BackSide }));
shade.castShadow = true; head3.add(shade);
const shadeIn = new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: .7, roughness: .8, side: THREE.FrontSide }));
shadeIn.scale.setScalar(0.985); head3.add(shadeIn);
const rim = new THREE.Mesh(new THREE.TorusGeometry(0.113, 0.003, 8, 56), lampMat); rim.rotation.x = Math.PI / 2; rim.position.y = -0.151; head3.add(rim);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.026, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffd27a, emissiveIntensity: 3 }));
bulb.position.y = -0.09; head3.add(bulb);
lamp.add(head3);
lamp.userData = { spot: 'lamp', label: 'Lámpara · luz' }; scene.add(lamp); interactives.push(lamp);
cable([[LX, 0.76, LZ - 0.1], [LX + 0.02, 0.748, LZ - 0.16], [LX + 0.1, 0.748, -0.84], [LX + 0.14, 0.6, -0.86]], 0.003);
const bulbWorld = new THREE.Vector3(); head3.updateMatrixWorld(true); bulb.getWorldPosition(bulbWorld);

const spot = new THREE.SpotLight(0xffc37a, 60, 5, 0.75, 0.6, 1.5);
spot.position.copy(bulbWorld); spot.target.position.set(-0.25, 0.74, -0.15);
spot.castShadow = true; spot.shadow.mapSize.setScalar(lowEnd ? 1024 : 2048); spot.shadow.bias = -0.0004; spot.shadow.normalBias = 0.01; spot.shadow.radius = 4;
scene.add(spot, spot.target);
const hemi = new THREE.HemisphereLight(0x8a9cff, 0x3a2a1c, 0.75); scene.add(hemi);
const fill = new THREE.DirectionalLight(0x9fb0ff, 0.6); fill.position.set(1.5, 2.6, 2.5); scene.add(fill);
const warm = new THREE.PointLight(0xffb066, 3, 3, 2); warm.position.copy(bulbWorld).add(new THREE.Vector3(0, -0.05, 0.1)); scene.add(warm);

// polvo flotando en el haz de la lámpara
const dust = (() => {
  const N = lowEnd ? 40 : 90, pos = new Float32Array(N * 3), seed = [];
  for (let i = 0; i < N; i++) {
    const t = Math.random(); const r = (0.05 + t * 0.32) * Math.sqrt(Math.random()); const a = Math.random() * Math.PI * 2;
    const base = new THREE.Vector3(bulbWorld.x + (-0.25 - bulbWorld.x) * t + Math.cos(a) * r, bulbWorld.y + (0.78 - bulbWorld.y) * t, bulbWorld.z + (-0.15 - bulbWorld.z) * t + Math.sin(a) * r);
    seed.push({ base, sp: .2 + Math.random() * .4, ph: Math.random() * 6.28 });
    pos.set([base.x, base.y, base.z], i * 3);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size: 0.006, map: dotTexture(), color: 0xffe2b0, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat); scene.add(pts);
  return { pts, seed, mat };
})();

let lightsOn = true;
function toggleLights() {
  lightsOn = !lightsOn;
  const set = on => {
    spot.intensity = on ? 60 : 0; warm.intensity = on ? 3 : 0; bulb.material.emissiveIntensity = on ? 3 : 0.1; shadeIn.material.emissiveIntensity = on ? .7 : 0;
  };
  if (lightsOn && !reduceMotion) {
    // parpadeo de bombillo al encender
    [[0, 1], [70, 0], [140, 1], [200, 0], [320, 1]].forEach(([ms, on]) => setTimeout(() => set(on), ms));
  } else set(lightsOn);
  tween(dust.mat, { opacity: lightsOn ? .5 : 0 }, 350);
  tween(hemi, { intensity: lightsOn ? 0.75 : 0.25 }, 350);
  tween(renderer, { toneMappingExposure: lightsOn ? 1.05 : 0.75 }, 350);
}

/* ---------- objetos del escritorio ---------- */
// taza con vapor
const steam = [];
{
  const g = group('mug', 'Café · disponibilidad');
  const mugProfile = [[0, -0.05], [0.04, -0.05], [0.043, -0.047], [0.046, 0.045], [0.047, 0.05], [0.042, 0.05], [0.04, 0.045], [0.038, -0.04], [0, -0.04]].map(([r, y]) => new THREE.Vector2(r, y));
  const mug = new THREE.Mesh(new THREE.LatheGeometry(mugProfile, 40), M.red); mug.position.set(0.52, 0.792, -0.3); mug.castShadow = true; mug.receiveShadow = true; g.add(mug);
  const top = cyl(0.039, 0.039, 0.002, M.coffee, 0.52, 0.83, -0.3); g.add(top);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 12, 32, Math.PI * 1.2), M.red);
  handle.rotation.z = -Math.PI * 0.6; handle.position.set(0.565, 0.795, -0.3); handle.castShadow = true; g.add(handle);
  const tex = dotTexture();
  for (let i = 0; i < 7; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xe8e4dc, transparent: true, opacity: 0, depthWrite: false }));
    sp.userData.phase = i / 7; scene.add(sp); steam.push(sp);
  }
}
// libreta y bolígrafo
{
  const g = group('notebook', 'Libreta · sobre mí');
  g.add(rbox(0.24, 0.012, 0.17, 0.004, M.paper, -0.58, 0.748, -0.12, { ry: 0.28 }));
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
  const ntex = new THREE.CanvasTexture(nc); ntex.colorSpace = THREE.SRGBColorSpace; ntex.anisotropy = maxAniso;
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.232, 0.162), new THREE.MeshStandardMaterial({ map: ntex, color: 0xcfcbc2, roughness: .95 }));
  page.rotation.x = -Math.PI / 2; page.rotation.z = 0.28; page.position.set(-0.58, 0.7545, -0.12); g.add(page);
  const pen = cyl(0.005, 0.005, 0.15, M.blue, -0.37, 0.752, -0.07); pen.rotation.z = Math.PI / 2; pen.rotation.y = -0.6; g.add(pen);
}
// teléfono
const phoneGroup = group('phone', 'Teléfono · contacto');
let phoneScreen;
{
  const g = phoneGroup;
  g.add(rbox(0.072, 0.008, 0.148, 0.0039, M.black, 0.6, 0.746, -0.04, { ry: -0.35 }));
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
  const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = maxAniso;
  phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.132), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: ptex, emissiveIntensity: .5, roughness: .2 }));
  phoneScreen.rotation.x = -Math.PI / 2; phoneScreen.rotation.z = -0.35; phoneScreen.position.set(0.6, 0.7505, -0.04); g.add(phoneScreen);
}
// bandeja de papeles (experiencia)
{
  const g = group('tray', 'Carpeta · experiencia');
  g.add(rbox(0.3, 0.012, 0.22, 0.004, M.cream, 0.84, 0.75, -0.42, { ry: -0.08 }));
  g.add(rbox(0.3, 0.012, 0.22, 0.004, M.paper, 0.845, 0.762, -0.425, { ry: -0.12 }));
  g.add(rbox(0.31, 0.03, 0.23, 0.006, M.yellow, 0.84, 0.782, -0.42, { ry: -0.1 }));
  g.add(rbox(0.1, 0.006, 0.05, 0.0025, M.yellow, 0.72, 0.8, -0.5, { ry: -0.1 }));
}
// planta con hojas dobladas
const plantLeaves = [];
const plantGroup = new THREE.Group();
{
  const g = plantGroup;
  const potProfile = [[0, 0], [0.064, 0], [0.068, 0.006], [0.084, 0.16], [0.092, 0.162], [0.092, 0.182], [0.08, 0.182], [0.078, 0.17]].map(([r, y]) => new THREE.Vector2(r, y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProfile, 40), M.terracotta); pot.position.set(1.0, 0.743, -0.66); pot.castShadow = true; pot.receiveShadow = true; g.add(pot);
  g.add(cyl(0.079, 0.079, 0.006, new THREE.MeshStandardMaterial({ color: 0x2b1d12, roughness: 1 }), 1.0, 0.915, -0.66));
  const leafGeo = (len, wid) => {
    const s = new THREE.Shape(); s.moveTo(0, 0);
    s.bezierCurveTo(wid, len * .25, wid * .8, len * .75, 0, len); s.bezierCurveTo(-wid * .8, len * .75, -wid, len * .25, 0, 0);
    const geo = new THREE.ShapeGeometry(s, 14); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, Math.pow(y / len, 2) * len * 0.5 - Math.abs(x) * 0.35); }
    geo.computeVertexNormals(); return geo;
  };
  const N = 11;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2 + (i % 2) * .3;
    const len = 0.17 + (i % 3) * 0.035;
    const leaf = new THREE.Mesh(leafGeo(len, 0.034 + (i % 2) * 0.008), i % 3 ? M.leaf : M.leafDark);
    leaf.rotation.order = 'YXZ'; leaf.rotation.y = a; leaf.rotation.x = 0.25 + (i % 4) * 0.16;
    leaf.position.set(1.0 + Math.sin(a) * 0.012, 0.915, -0.66 + Math.cos(a) * 0.012);
    leaf.castShadow = true; leaf.receiveShadow = true;
    leaf.userData.rx = leaf.rotation.x; leaf.userData.ph = Math.random() * 6.28;
    g.add(leaf); plantLeaves.push(leaf);
  }
  scene.add(g);
}

// planta 3D generada con Higgsfield (Tripo): sustituye a la hecha en código cuando termina de cargar
const plantPivot = new THREE.Group(); plantPivot.position.set(1.0, 0.743, -0.66); scene.add(plantPivot);
new GLTFLoader().load('assets/models/planta.glb', gltf => {
  const m = gltf.scene;
  const bb = new THREE.Box3().setFromObject(m), size = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
  const k = 0.44 / size.y; m.scale.setScalar(k);
  m.position.set(-c.x * k, -bb.min.y * k, -c.z * k);
  m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  plantPivot.add(m); plantGroup.visible = false;
}, undefined, () => {});

/* ---------- pared: repisa, cámara, notas, cuadros ---------- */
{
  scene.add(rbox(1.0, 0.03, 0.2, 0.008, M.woodDark, 0.75, 1.62, -1.1));
  // libros con tapas, bloque de páginas y lomo pintado (título, bandas y desgaste)
  const clothTex = noiseTexture({ size: 128, base: '#d8d8d8', vary: 46 }); clothTex.colorSpace = THREE.NoColorSpace;
  const pagesMat = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 8; const x = c.getContext('2d');
    x.fillStyle = '#efe6d2'; x.fillRect(0, 0, 128, 8);
    for (let i = 0; i < 128; i += 2) { x.fillStyle = `rgba(120,100,70,${.08 + Math.random() * .14})`; x.fillRect(i, 0, 1, 8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, roughness: .95 });
  })();
  function spineTexture({ w, h, color, ink, title, hard }) {
    const W = 128, H = Math.min(1024, Math.round(W * h / w)); const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = color; x.fillRect(0, 0, W, H);
    const img = x.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * (hard ? 22 : 10); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(img, 0, 0);
    // lomo redondeado: bordes más oscuros y un brillo suave
    const g = x.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(0,0,0,.42)'); g.addColorStop(.18, 'rgba(0,0,0,.06)'); g.addColorStop(.38, 'rgba(255,255,255,.10)'); g.addColorStop(.7, 'rgba(0,0,0,.04)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = ink;
    if (hard) [[.05, 4], [.065, 2], [.935, 2], [.95, 4]].forEach(([p, t]) => x.fillRect(8, H * p, W - 16, t));
    else { x.fillRect(0, H * .1, W, 26); x.fillStyle = color; x.font = '800 18px Manrope, sans-serif'; x.textAlign = 'center'; x.fillText('·', W / 2, H * .1 + 19); x.fillStyle = ink; }
    x.save(); x.translate(W / 2, H * .5); x.rotate(-Math.PI / 2);
    let fs = W * .42; x.font = `800 ${fs}px Manrope, sans-serif`;
    while (x.measureText(title).width > H * .6 && fs > 14) { fs -= 2; x.font = `800 ${fs}px Manrope, sans-serif`; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title.toUpperCase(), 0, 2);
    x.restore();
    x.beginPath(); x.arc(W / 2, H * .86, W * .12, 0, 6.283); x.lineWidth = 3; x.strokeStyle = ink; x.stroke();
    // desgaste en las puntas
    for (let i = 0; i < 260; i++) { const y = Math.random() < .5 ? Math.random() * H * .025 : H - Math.random() * H * .025; x.fillStyle = `rgba(255,248,230,${Math.random() * .25})`; x.fillRect(Math.random() * W, y, 2, 2); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
  }
  function book(spec, px, py, pz, { rz = 0, lying = false } = {}) {
    const { w, h, d = 0.15, color, hard = true, rough = .8 } = spec;
    const ct = hard ? 0.0028 : 0.0009, over = hard ? 0.0025 : 0, st = hard ? 0.003 : 0.001;
    const cover = new THREE.MeshStandardMaterial({ color, roughness: rough, map: hard ? clothTex : null });
    const spineMat = new THREE.MeshStandardMaterial({ map: spineTexture({ ...spec, hard }), roughness: rough });
    const b = new THREE.Group();
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; b.add(m); };
    add(new THREE.BoxGeometry(w - 2 * ct, h - 2 * over, d - over - st), pagesMat, 0, h / 2, (over - st) / 2);
    [-1, 1].forEach(sg => add(new THREE.BoxGeometry(ct, h, d - st), cover, sg * (w / 2 - ct / 2), h / 2, -st / 2));
    add(new THREE.BoxGeometry(w, h, st), [cover, cover, cover, cover, spineMat, cover], 0, h / 2, d / 2 - st / 2);
    if (lying) { b.rotation.z = -Math.PI / 2; b.position.set(px, py + w / 2, pz); } // acostado: el título queda de izquierda a derecha
    else { b.rotation.z = rz; b.position.set(px, py, pz); }
    scene.add(b); return b;
  }
  const SHELF = 1.635, BZ = -1.1;
  const books = [
    { title: 'JavaScript', color: '#6e1d22', ink: '#d9b45a', w: .036, h: .212 },
    { title: 'Python', color: '#1d3557', ink: '#e8d9a8', w: .03, h: .19 },
    { title: 'Algoritmos', color: '#d6a73a', ink: '#1f1a12', w: .042, h: .2, hard: false, rough: .45 },
    { title: 'Bases de datos', color: '#2c4a36', ink: '#d9b45a', w: .034, h: .222 },
    { title: 'Diseño', color: '#ece4d4', ink: '#2a2a2a', w: .026, h: .18, hard: false, rough: .5 },
    { title: 'Cine', color: '#18181c', ink: '#c9c9cf', w: .03, h: .2, rough: .55 },
    { title: 'Marketing', color: '#a9472a', ink: '#f4e9d8', w: .038, h: .186, hard: false, rough: .5 },
  ];
  let bx = 0.31;
  books.forEach((sp, i) => { bx += sp.w / 2; book(sp, bx, SHELF, BZ + (i % 3) * 0.006); bx += sp.w / 2 + 0.0015; });
  // uno recostado contra la fila y una pila acostada
  const lean = { title: 'Redes', color: '#24585c', ink: '#e6d8b0', w: .03, h: .19 };
  // apoyado en su arista inferior izquierda, con la esquina de arriba tocando el último libro
  const LR = 0.33, leftEdge = bx + lean.h * Math.sin(LR);
  book(lean, leftEdge + lean.w / 2 * Math.cos(LR), SHELF + lean.w / 2 * Math.sin(LR), BZ, { rz: LR });
  book({ title: 'Fotografía', color: '#3b3b44', ink: '#e8c27a', w: .028, h: .2 }, 0.69, SHELF, BZ + 0.01, { lying: true });
  book({ title: 'Notas', color: '#7c8c6e', ink: '#f2ecd8', w: .02, h: .17, hard: false, rough: .6 }, 0.705, SHELF + 0.028, BZ + 0.012, { lying: true });
  const cam = group('camera', 'Cámara · audiovisual y marketing');
  cam.add(rbox(0.15, 0.085, 0.075, 0.012, M.black, 1.05, 1.68, -1.09));
  cam.add(rbox(0.05, 0.02, 0.05, 0.006, M.dark, 1.03, 1.732, -1.09));
  const lens = cyl(0.03, 0.032, 0.05, M.dark, 1.05, 1.68, -1.04); lens.rotation.x = Math.PI / 2; cam.add(lens);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.003, 8, 32), M.metal); ring.position.set(1.05, 1.68, -1.016); cam.add(ring);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.02, 24), new THREE.MeshStandardMaterial({ color: 0x2f4a75, roughness: .05, metalness: .6 }));
  glass.position.set(1.05, 1.68, -1.014); cam.add(glass);
  cam.add(box(0.035, 0.012, 0.004, M.red, 1.0, 1.7, -1.052));
}
{
  const notes = group('notes', 'Notas · habilidades');
  [[0.5, 1.46, 0xf6d86b, -0.1, 'React'], [0.62, 1.43, 0x9ed0f5, 0.08, 'Python'], [0.56, 1.33, 0xf5a7bf, -0.05, 'AWS ✓']].forEach(([x, y, c, r, word]) => {
    const nc = document.createElement('canvas'); nc.width = nc.height = 128; const t = nc.getContext('2d');
    t.fillStyle = '#' + c.toString(16).padStart(6, '0'); t.fillRect(0, 0, 128, 128);
    t.fillStyle = 'rgba(0,0,0,.08)'; t.fillRect(0, 0, 128, 16);
    t.fillStyle = 'rgba(30,30,40,.82)'; t.font = '700 26px "JetBrains Mono", monospace'; t.textAlign = 'center'; t.fillText(word, 64, 78);
    const tex = new THREE.CanvasTexture(nc); tex.colorSpace = THREE.SRGBColorSpace;
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.095, 0.095), new THREE.MeshStandardMaterial({ map: tex, roughness: .9, side: THREE.DoubleSide }));
    n.position.set(x, y, -1.19); n.rotation.z = r; n.castShadow = true; notes.add(n);
  });
}
{
  const frames = group('frames', 'Cuadros · formación');
  const mk = (w, h, x, y, id, info) => {
    frames.add(rbox(w, h, 0.025, 0.004, M.woodDark, x, y, -1.185));
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
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
}

/* ---------- interacción ---------- */
// cada objeto interactivo usa materiales propios para que el resaltado no afecte al resto
interactives.forEach(g => g.traverse(o => { if (o.isMesh && o.material && !o.material.emissiveMap) o.material = o.material.clone(); }));
const LIFT = { mug: 0.012, phone: 0.01, notebook: 0.008, tray: 0.008 };
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-2, -2);
let hovered = null;

function setHover(g) {
  if (hovered === g) return;
  if (hovered) {
    hovered.traverse(o => { if (o.isMesh && o.userData.em !== undefined) { o.material.emissiveIntensity = o.userData.em; } });
    if (LIFT[hovered.userData.spot]) tween(hovered.position, { y: 0 }, 260, { easing: easeOut });
  }
  hovered = g;
  screenHover = false;
  if (g) {
    g.traverse(o => {
      if (o.isMesh && o.material && o.material.emissive && o.name !== 'screen' && !o.material.emissiveMap) {
        if (o.userData.em === undefined) o.userData.em = o.material.emissiveIntensity || 0;
        if (o.userData.em === 0) { o.material.emissive.set(0x7dd3fc); }
        o.material.emissiveIntensity = o.userData.em > 0 ? o.userData.em : 0.16;
      }
    });
    if (LIFT[g.userData.spot]) tween(g.position, { y: LIFT[g.userData.spot] }, 260, { easing: easeOut });
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
const setPointer = e => pointer.set((e.clientX / el.clientWidth) * 2 - 1, -(e.clientY / el.clientHeight) * 2 + 1);

// arrastrar de lado recorre el escritorio cuando no cabe completo (pantallas verticales)
const drag = { id: null, x0: 0, pan0: 0, moved: false };
el.addEventListener('pointerdown', e => {
  setPointer(e);
  drag.id = e.pointerId; drag.x0 = e.clientX; drag.pan0 = pan.target; drag.moved = false;
});
el.addEventListener('pointermove', e => {
  setPointer(e);
  camState.fx = pointer.x; camState.fy = pointer.y;
  if (drag.id === e.pointerId && panMax > 0 && !zoomed && !entering) {
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 8) drag.moved = true;
    if (drag.moved) { pan.target = Math.max(-panMax, Math.min(panMax, drag.pan0 - dx / el.clientWidth * 1.4)); hidePanHint(); }
  }
  if (e.pointerType === 'mouse') { P.moveLabel(e.clientX, e.clientY); if (!entering && !drag.moved) setHover(pick()); }
});
const endDrag = e => { if (drag.id === e.pointerId) drag.id = null; };
el.addEventListener('pointerup', endDrag);
el.addEventListener('pointercancel', endDrag);
el.addEventListener('pointerleave', e => { endDrag(e); setHover(null); camState.fx = 0; camState.fy = 0; });

const SPOT_CAM = {
  notebook: { pos: [-0.64, 1.0, 0.16], look: [-0.58, 0.75, -0.12], side: 'right' },
  phone: { pos: [0.55, 1.0, 0.26], look: [0.6, 0.75, -0.04], side: 'left' },
  mug: { pos: [0.5, 1.02, 0.14], look: [0.52, 0.8, -0.3], side: 'left' },
  tray: { pos: [0.8, 1.12, 0.1], look: [0.84, 0.78, -0.42], side: 'left' },
  notes: { pos: [0.5, 1.42, -0.5], look: [0.56, 1.4, -1.19], side: 'left' },
  frames: { pos: [-0.34, 1.82, -0.42], look: [-0.34, 1.8, -1.19], side: 'right' },
  camera: { pos: [0.95, 1.7, -0.5], look: [1.05, 1.68, -1.09], side: 'left' },
};
let suppressReturn = false;
function zoomTo(spot) {
  const c = SPOT_CAM[spot]; if (!c) { P.activateSpot(spot); return; }
  zoomed = spot; setHover(null); hidePanHint();
  let pos = c.pos, lk = c.look;
  if (aspect() < 0.8) {
    // en vertical el panel ocupa la mitad de abajo: alejar un poco y dejar el objeto arriba
    pos = pos.map((v, i) => lk[i] + (v - lk[i]) * 1.3);
    lk = [lk[0], lk[1] - 0.09, lk[2]];
  }
  tween(camState, { x: pos[0], y: pos[1], z: pos[2], lx: lk[0], ly: lk[1], lz: lk[2] }, reduceMotion ? 10 : 900);
  setTimeout(() => P.openPanel(spot, c.side), reduceMotion ? 0 : 450);
}
function returnCamera() { zoomed = null; introCamera(800); }
P.onPanelClose(() => { if (zoomed && !suppressReturn) returnCamera(); });

function activate(s) {
  if (entering) return;
  if (s === 'lamp') { toggleLights(); return; }
  if (s === 'monitor') { suppressReturn = true; P.closePanel(); suppressReturn = false; zoomed = null; flyIn(); return; }
  if (zoomed === s) return;
  if (zoomed) { suppressReturn = true; P.closePanel(); suppressReturn = false; }
  zoomTo(s);
}
// los botones de los paneles (“Ver experiencia”, “Entrar al computador”) también mueven la cámara
P.focusSpot = activate;
P.flyIn = () => activate('monitor');

el.addEventListener('click', e => {
  if (entering) return;
  if (drag.moved) { drag.moved = false; return; }
  setPointer(e);
  const g = pick();
  if (!g) { if (zoomed) P.closePanel(); return; }
  activate(g.userData.spot);
});

function flyIn() {
  entering = true; setHover(null); P.hideLabel();
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

/* ---------- marcadores táctiles ---------- */
// en pantallas táctiles no hay hover: cada objeto lleva un punto con su nombre
const PINS = [
  ['monitor', 'Entrar', [0, 1.37, -0.57]],
  ['notebook', 'Sobre mí', [-0.58, 0.8, -0.12]],
  ['tray', 'Experiencia', [0.84, 0.84, -0.42]],
  ['notes', 'Habilidades', [0.56, 1.52, -1.18]],
  ['frames', 'Formación', [-0.34, 1.96, -1.18]],
  ['camera', 'Audiovisual', [1.05, 1.76, -1.08]],
  ['mug', 'Disponible', [0.52, 0.89, -0.3]],
  ['phone', 'Contacto', [0.6, 0.79, -0.04]],
  ['lamp', 'Luz', [-0.42, 1.46, -0.42]],
];
const pinLayer = document.createElement('div'); pinLayer.className = 'pins'; pinLayer.hidden = !coarse;
const pins = PINS.map(([spot, label, at]) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pin'; b.dataset.spot = spot;
  b.innerHTML = `<i></i><span>${label}</span>`; b.setAttribute('aria-label', label);
  b.addEventListener('click', ev => { ev.stopPropagation(); activate(spot); });
  pinLayer.appendChild(b);
  return { b, at: new THREE.Vector3(...at) };
});
container.appendChild(pinLayer);
const pinV = new THREE.Vector3();
function updatePins() {
  if (pinLayer.hidden) return;
  const show = !zoomed && !entering && !camTweening();
  pinLayer.classList.toggle('is-off', !show);
  if (!show) return;
  const w = container.clientWidth, h = container.clientHeight;
  for (const p of pins) {
    pinV.copy(p.at).project(camera);
    const x = (pinV.x * .5 + .5) * w, y = (-pinV.y * .5 + .5) * h;
    const inView = x > 12 && x < w - 12 && y > 60 && y < h - 70;
    p.b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    p.b.classList.toggle('is-out', !inView);
  }
}

// aviso de “desliza” en pantallas verticales, se quita al primer arrastre
const panHint = document.createElement('div'); panHint.className = 'pan-hint'; panHint.innerHTML = '<span>⟵</span> desliza para ver todo el escritorio <span>⟶</span>';
container.appendChild(panHint);
let panHintShown = false;
function hidePanHint() { panHint.classList.remove('is-on'); }

/* ---------- bucle ---------- */
const look = new THREE.Vector3();
let rainTick = 0;
let last = 0, frames = 0, slowFrames = 0, qualityChecked = false;
function render() { composer ? composer.render() : renderer.render(scene, camera); }
function animate(now) {
  requestAnimationFrame(animate);
  // con OmarOS abierto la escena no se ve: no gastar GPU
  if (sceneWrap.classList.contains('is-hidden')) { last = now; return; }
  runTweens(now);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const t = now / 1000;
  const k = 1 - Math.exp(-dt * 6);
  const still = entering || zoomed;
  const px = still || coarse ? 0 : camState.fx * 0.14, py = still || coarse ? 0 : camState.fy * 0.07;
  pan.value += (pan.target - pan.value) * (1 - Math.exp(-dt * 10));
  pan.applied += ((still ? 0 : pan.value) - pan.applied) * k;
  camera.position.x += (camState.x + px + pan.applied - camera.position.x) * k;
  camera.position.y += (camState.y + py - camera.position.y) * k;
  camera.position.z += (camState.z - camera.position.z) * k;
  // leve respiración de cámara en mano, apagada al acercarse a un objeto
  const br = still || reduceMotion ? 0 : 1;
  look.set(camState.lx + pan.applied + Math.sin(t * .37) * .004 * br, camState.ly + Math.sin(t * .51) * .003 * br, camState.lz); camera.lookAt(look);

  if (!reduceMotion) {
    // vapor del café
    for (const sp of steam) {
      const p = (t * 0.32 + sp.userData.phase) % 1;
      sp.position.set(0.52 + Math.sin(p * 6 + sp.userData.phase * 9) * 0.012 * p, 0.84 + p * 0.16, -0.3 + Math.cos(p * 5) * 0.006);
      sp.scale.setScalar(0.025 + p * 0.05);
      sp.material.opacity = Math.sin(p * Math.PI) * 0.22;
    }
    // polvo en el haz
    const pos = dust.pts.geometry.attributes.position;
    dust.seed.forEach((s, i) => pos.setXYZ(i, s.base.x + Math.sin(t * s.sp + s.ph) * 0.03, s.base.y + Math.sin(t * s.sp * .7 + s.ph * 2) * 0.025, s.base.z + Math.cos(t * s.sp + s.ph) * 0.03));
    pos.needsUpdate = true;
    // estrellas y hojas
    stars.forEach(s => { s.material.opacity = 0.55 + Math.sin(t * 1.3 + s.userData.phase) * 0.35; });
    plantLeaves.forEach(l => { l.rotation.x = l.userData.rx + Math.sin(t * 0.9 + l.userData.ph) * 0.025; });
    plantPivot.rotation.z = Math.sin(t * 0.7) * 0.012; plantPivot.rotation.x = Math.sin(t * 0.53 + 1) * 0.008;
    // el teléfono vibra cada tanto para invitar a tocarlo
    const v = t % 7;
    phoneGroup.position.x = v < 0.45 && !zoomed ? Math.sin(t * 90) * 0.0018 : 0;
    phoneScreen.material.emissiveIntensity = v < 2.4 ? .9 : .5;
    powerLed.material.emissiveIntensity = 1.4 + Math.sin(t * 2) * .6;
    rainTick += dt; if (rainTick > 1 / 30) { rain.update(rainTick, true); rainTick = 0; }
    // un carro pasa: el haz cruza la pared de izquierda a derecha (o al revés)
    if (car.t < 0 && t > car.next) { car.t = 0; car.dir = Math.random() < .5 ? 1 : -1; }
    if (car.t >= 0) {
      car.t += dt / 3.2; const u = car.dir > 0 ? car.t : 1 - car.t;
      carLight.target.position.set(-1.4 + u * 3.2, 1.5 + Math.sin(u * Math.PI) * .25, -1.2);
      carLight.intensity = Math.sin(Math.min(car.t, 1) * Math.PI) * (lightsOn ? 5 : 8);
      if (car.t >= 1) { car.t = -1; carLight.intensity = 0; car.next = t + 9 + Math.random() * 14; }
    }
  }
  drawScreen();
  updatePins();
  render();

  // si los primeros segundos van lentos, bajar la resolución y quitar el bloom
  if (!qualityChecked && now - startedAt > 2500) {
    frames++; if (dt > 0.028) slowFrames++;
    if (frames >= 90) {
      qualityChecked = true;
      if (slowFrames > 35) {
        composer = null;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
        renderer.setSize(container.clientWidth, container.clientHeight);
      }
    }
  }
}

let resizeTimer = 0;
function onResize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h); camera.aspect = w / h; fitCamera();
  if (composer) { composer.setSize(w, h); }
  panHint.hidden = panMax === 0;
}
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(onResize, 120); });

/* ---------- arranque ---------- */
progress(80, 'Encendiendo la lámpara…');
drawScreen();
renderer.compile(scene, camera);
render();
progress(100, 'Listo');
window.__scene3dReady = true;
const minShow = 1200;
setTimeout(() => {
  pre.classList.add('is-done');
  setTimeout(() => { pre.hidden = true; }, 600);
  introCamera(3600);
  requestAnimationFrame(animate);
  if (panMax > 0 && !panHintShown) {
    panHintShown = true;
    setTimeout(() => panHint.classList.add('is-on'), 2300);
    setTimeout(hidePanHint, 8000);
  }
}, Math.max(0, minShow - (performance.now() - startedAt)));
