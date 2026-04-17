'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════
const TERRAIN_SIZE  = 200;
const TERRAIN_SEGS  = 80;
const ALIEN_COUNT_A = 5;
const ALIEN_COUNT_B = 5;
const TOTAL_ALIENS  = ALIEN_COUNT_A + ALIEN_COUNT_B;
const CAPTURE_RANGE = 18;
const PLAYER_SPEED  = 9;
const SPRINT_MUL    = 1.9;
const JUMP_VEL      = 11;
const GRAVITY       = -28;
const EYE_HEIGHT    = 1.72;
const SNOW_COUNT    = 3500;
const FREEZE_SEC    = 5.5;
const SPD_WANDER    = 2.8;
const SPD_FLEE      = 6.5;
const SPD_CHASE     = 5.2;

// ══════════════════════════════════════════════════════════════════════════════
// WORLD SCENE + RENDERER
// ══════════════════════════════════════════════════════════════════════════════
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x7aaacc, 0.012);
scene.background = new THREE.Color(0x4d88bb);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.autoClear = false;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.rotation.order = 'YXZ';
camera.position.set(0, EYE_HEIGHT, 0);

const gunScene  = new THREE.Scene();
const gunCamera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.01, 20);
gunScene.add(new THREE.AmbientLight(0xffffff, 1.0));
const gunLight = new THREE.PointLight(0x00eeff, 2.0, 3);
gunLight.position.set(0, 0.3, -0.2);
gunScene.add(gunLight);

const muzzleFlash = new THREE.PointLight(0x00ffcc, 0, 2.5);
muzzleFlash.position.set(0, 0.01, -0.68);
gunScene.add(muzzleFlash);

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = gunCamera.aspect = w / h;
  camera.updateProjectionMatrix();
  gunCamera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ══════════════════════════════════════════════════════════════════════════════
// GUN MODEL
// ══════════════════════════════════════════════════════════════════════════════
const gunGroup = new THREE.Group();

const gBodyMat  = new THREE.MeshLambertMaterial({ color: 0x0d2045 });
const gAccMat   = new THREE.MeshLambertMaterial({ color: 0x1a3a80 });
const gCryoMat  = new THREE.MeshLambertMaterial({ color: 0x00bbee });
const gGlowMat  = new THREE.MeshBasicMaterial  ({ color: 0x00ffcc });

const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.075, 0.38), gBodyMat);
gBody.position.set(0, 0, -0.10);
gunGroup.add(gBody);

const gRail = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.025, 0.32), gAccMat);
gRail.position.set(0, 0.052, -0.10);
gunGroup.add(gRail);

const gBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.60, 8), gCryoMat);
gBarrel.rotation.x = Math.PI / 2;
gBarrel.position.set(0, 0.010, -0.44);
gunGroup.add(gBarrel);

const gTip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), gGlowMat);
gTip.position.set(0, 0.010, -0.74);
gunGroup.add(gTip);

const gHandle = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.13, 0.09), gBodyMat);
gHandle.position.set(0, -0.10, 0.04);
gunGroup.add(gHandle);

const gTank = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), gCryoMat);
gTank.rotation.z = Math.PI / 2;
gTank.position.set(0.072, -0.018, -0.05);
gunGroup.add(gTank);

const gScope = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 6, 14), gAccMat);
gScope.rotation.x = Math.PI / 2;
gScope.position.set(0, 0.062, -0.20);
gunGroup.add(gScope);

gunGroup.position.set(0, -0.135, -0.30);
gunScene.add(gunGroup);

// ══════════════════════════════════════════════════════════════════════════════
// LIGHTING
// ══════════════════════════════════════════════════════════════════════════════
scene.add(new THREE.AmbientLight(0x5566aa, 0.8));

const sun = new THREE.DirectionalLight(0xfff5cc, 1.0);
sun.position.set(400, 250, 200);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 700;
sun.shadow.camera.left = sun.shadow.camera.bottom = -140;
sun.shadow.camera.right = sun.shadow.camera.top   =  140;
scene.add(sun);

const aurora0 = new THREE.PointLight(0x00ff88, 0.55, 400);
aurora0.position.set(-60, 80, -80);
scene.add(aurora0);

const aurora1 = new THREE.PointLight(0x8844ff, 0.40, 400);
aurora1.position.set( 70, 90, -60);
scene.add(aurora1);

// ── BIG SUN SPHERE ─────────────────────────────────────────────────────────
const SUN_POS = new THREE.Vector3(400, 250, 200);

const sunCore = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xffffaa }));
sunCore.position.copy(SUN_POS);
scene.add(sunCore);

const sunHalo1 = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xfff0aa, transparent: true, opacity: 0.18 }));
sunHalo1.position.copy(SUN_POS);
scene.add(sunHalo1);

const sunHalo2 = new THREE.Mesh(new THREE.SphereGeometry(44, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.07 }));
sunHalo2.position.copy(SUN_POS);
scene.add(sunHalo2);

// ══════════════════════════════════════════════════════════════════════════════
// TERRAIN
// ══════════════════════════════════════════════════════════════════════════════
function terrainH(x, z) {
  const d = Math.hypot(x, z);
  if (d < 12) return 0;
  let h = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 2.5
        + Math.sin(x * 0.04 + 0.5) * Math.sin(z * 0.06) * 4.0
        + Math.sin(x * 0.15) * Math.sin(z * 0.13) * 1.2;
  h = Math.max(0, h);
  if (d > 78) h += (d - 78) * 0.28;
  return h;
}

const tGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGS, TERRAIN_SEGS);
tGeo.rotateX(-Math.PI / 2);
const tPos = tGeo.attributes.position;
for (let i = 0; i < tPos.count; i++) {
  tPos.setY(i, terrainH(tPos.getX(i), tPos.getZ(i)));
}
tGeo.computeVertexNormals();
const terrainMesh = new THREE.Mesh(tGeo, new THREE.MeshLambertMaterial({ color: 0xddeeff }));
terrainMesh.receiveShadow = true;
scene.add(terrainMesh);

const lake = new THREE.Mesh(
  (() => { const g = new THREE.CircleGeometry(11, 32); g.rotateX(-Math.PI / 2); return g; })(),
  new THREE.MeshLambertMaterial({ color: 0x88bbcc, transparent: true, opacity: 0.65 })
);
lake.position.y = 0.02;
scene.add(lake);

// ══════════════════════════════════════════════════════════════════════════════
// ICE FORMATIONS
// ══════════════════════════════════════════════════════════════════════════════
const iceColors  = [0xaaccdd, 0xbbddee, 0x99bbcc, 0xc8e4f0];
const geoFactories = [
  s => new THREE.DodecahedronGeometry(s, 0),
  s => new THREE.ConeGeometry(s * 0.55, s * 2.2, 5),
  s => new THREE.OctahedronGeometry(s, 0),
];
for (let i = 0; i < 95; i++) {
  const ang  = Math.random() * Math.PI * 2;
  const dist = 16 + Math.random() * 76;
  const x    = Math.cos(ang) * dist;
  const z    = Math.sin(ang) * dist;
  const s    = 0.4 + Math.random() * 2.8;
  const geo  = geoFactories[Math.floor(Math.random() * geoFactories.length)](s);
  const mat  = new THREE.MeshLambertMaterial({ color: iceColors[i % iceColors.length] });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, terrainH(x, z) + s * 0.4, z);
  mesh.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
}

// ══════════════════════════════════════════════════════════════════════════════
// SNOW PARTICLES
// ══════════════════════════════════════════════════════════════════════════════
const snowBuf = new Float32Array(SNOW_COUNT * 3);
const snowSpd = new Float32Array(SNOW_COUNT);
for (let i = 0; i < SNOW_COUNT; i++) {
  snowBuf[i * 3]     = (Math.random() - 0.5) * 120;
  snowBuf[i * 3 + 1] = Math.random() * 50;
  snowBuf[i * 3 + 2] = (Math.random() - 0.5) * 120;
  snowSpd[i] = 0.4 + Math.random() * 0.9;
}
const snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowBuf, 3));
const snowPts = new THREE.Points(snowGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.13, transparent: true, opacity: 0.75, sizeAttenuation: true })
);
scene.add(snowPts);

// ══════════════════════════════════════════════════════════════════════════════
// INPUT
// ══════════════════════════════════════════════════════════════════════════════
const keys        = new Set();
let   mouseDX     = 0, mouseDY = 0;
let   fireQueued  = false;
let   pointerLocked  = false;
let   gameStarted = false;

document.addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'Space') e.preventDefault(); });
document.addEventListener('keyup',   e => keys.delete(e.code));

document.addEventListener('mousemove', e => {
  if (!pointerLocked) return;
  mouseDX += e.movementX;
  mouseDY += e.movementY;
});
document.addEventListener('mousedown', e => {
  if (e.button === 0 && pointerLocked) fireQueued = true;
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  if (pointerLocked && !gameStarted) {
    gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
  }
});
document.getElementById('startScreen').addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

// ══════════════════════════════════════════════════════════════════════════════
// TEXTURE LOADER
// ══════════════════════════════════════════════════════════════════════════════
function loadTex(url, fallbackHue, label) {
  return new Promise(resolve => {
    new THREE.TextureLoader().load(
      url,
      tex => { tex.colorSpace = THREE.SRGBColorSpace; resolve(tex); },
      undefined,
      () => {
        const c = document.createElement('canvas');
        c.width = c.height = 512;
        const ctx = c.getContext('2d');
        const bg = ctx.createLinearGradient(0, 0, 0, 512);
        bg.addColorStop(0, fallbackHue === 'blue' ? '#0a1535' : '#2a0a05');
        bg.addColorStop(1, fallbackHue === 'blue' ? '#050a1a' : '#150502');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#ffccaa';
        ctx.beginPath(); ctx.ellipse(256, 205, 115, 140, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = fallbackHue === 'blue' ? '#1166ff' : '#aa4400';
        [155, 357].forEach(ex => { ctx.beginPath(); ctx.arc(ex, 185, 18, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = 'rgba(255,80,80,0.9)';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ Image not found', 256, 390);
        ctx.font = '20px monospace';
        ctx.fillStyle = 'rgba(255,200,100,0.8)';
        ctx.fillText('assets/' + label, 256, 425);
        ctx.fillText('→  save image here', 256, 455);
        resolve(new THREE.CanvasTexture(c));
      }
    );
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ALIEN FACTORY
// ══════════════════════════════════════════════════════════════════════════════
const aliens = [];

function makeAlien(type, faceTex) {
  const isA      = type === 'A';
  const bodyCol  = isA ? 0x1e4488 : 0x993311;
  const mat      = new THREE.MeshLambertMaterial({ color: bodyCol });

  const g = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 4, 8), mat);
  torso.position.y = 0.82;
  torso.castShadow = true;
  g.add(torso);

  [-1, 1].forEach(s => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.55, 4, 6), mat);
    arm.position.set(s * 0.48, 0.88, 0);
    arm.rotation.z = s * 0.45;
    arm.castShadow = true;
    g.add(arm);
  });

  [-1, 1].forEach(s => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.48, 4, 6), mat);
    leg.position.set(s * 0.17, 0.24, 0);
    leg.castShadow = true;
    g.add(leg);
  });

  const headSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.40, 12, 10),
    new THREE.MeshLambertMaterial({ color: bodyCol })
  );
  headSphere.position.y = 1.82;
  headSphere.castShadow = true;
  g.add(headSphere);

  // Face image — MeshBasicMaterial = full brightness, no lighting darkening
  const facePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 2.5),
    new THREE.MeshBasicMaterial({ map: faceTex, transparent: false })
  );
  facePlane.position.set(0, 1.15, 0.46);
  g.add(facePlane);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.01, 0.001, 3, 3),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  g.add(ring);

  const freeze = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 9, 9),
    new THREE.MeshBasicMaterial({ color: 0x88eeff, transparent: true, opacity: 0, wireframe: true })
  );
  freeze.position.y = 0.9;
  g.add(freeze);

  let sx = 0, sz = 0, att = 0;
  do {
    const ang = Math.random() * Math.PI * 2;
    const r   = 20 + Math.random() * 60;
    sx = Math.cos(ang) * r;
    sz = Math.sin(ang) * r;
  } while (Math.hypot(sx, sz) < 14 && ++att < 40);

  g.position.set(sx, terrainH(sx, sz), sz);
  scene.add(g);

  const obj = {
    group: g, headSphere, facePlane, ring, freeze,
    type, state: 'wander', captured: false,
    wanderTarget: new THREE.Vector3(),
    wanderTimer: 0, freezeTimer: 0,
    bobOffset: Math.random() * Math.PI * 2,
  };
  newWanderTarget(obj);
  aliens.push(obj);
}

function newWanderTarget(a) {
  const p   = a.group.position;
  const ang = Math.random() * Math.PI * 2;
  const r   = 10 + Math.random() * 22;
  a.wanderTarget.set(
    THREE.MathUtils.clamp(p.x + Math.cos(ang) * r, -82, 82), 0,
    THREE.MathUtils.clamp(p.z + Math.sin(ang) * r, -82, 82)
  );
  a.wanderTimer = 4 + Math.random() * 6;
}

// ══════════════════════════════════════════════════════════════════════════════
// CAPTURE / SHOOT
// ══════════════════════════════════════════════════════════════════════════════
const raycaster = new THREE.Raycaster();
let beamMesh  = null;
let beamTimer = 0;
const _camDir = new THREE.Vector3();

function fireCapture() {
  if (beamMesh) { scene.remove(beamMesh); beamMesh = null; }

  muzzleFlash.intensity = 5;
  setTimeout(() => { muzzleFlash.intensity = 0; }, 100);

  gunGroup.position.z += 0.045;
  setTimeout(() => { gunGroup.position.z -= 0.045; }, 80);

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const targets = [];
  for (const a of aliens) {
    if (a.state !== 'captured') {
      a.group.traverse(o => { if (o.isMesh) targets.push(o); });
    }
  }

  const hits = raycaster.intersectObjects(targets, false);

  camera.getWorldDirection(_camDir);
  const beamStart = camera.position.clone().addScaledVector(_camDir, 0.55);
  const beamEnd   = hits.length > 0
    ? hits[0].point.clone()
    : camera.position.clone().addScaledVector(_camDir, CAPTURE_RANGE + 4);

  beamMesh = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([beamStart, beamEnd]),
    new THREE.LineBasicMaterial({ color: 0x00ffcc })
  );
  scene.add(beamMesh);
  beamTimer = 0.20;

  const flash = document.getElementById('beamFlash');
  flash.style.opacity = '1';
  setTimeout(() => { flash.style.opacity = '0'; }, 70);

  if (!hits.length) return;

  let hitAlien = null;
  outer: for (const a of aliens) {
    if (a.state === 'captured') continue;
    const ms = [];
    a.group.traverse(o => { if (o.isMesh) ms.push(o); });
    for (const m of ms) {
      if (m === hits[0].object) { hitAlien = a; break outer; }
    }
  }
  if (!hitAlien) return;

  const dist = camera.position.distanceTo(hitAlien.group.position);
  if (dist > CAPTURE_RANGE) {
    showMsg('warn', `OUT OF RANGE  (${dist.toFixed(1)} m  /  max ${CAPTURE_RANGE} m)`);
    return;
  }

  if (hitAlien.state === 'frozen') {
    hitAlien.state = 'captured';
    hitAlien.captured = true;
    scene.remove(hitAlien.group);
    if (hitAlien.type === 'A') { capturedA++; document.getElementById('invA').textContent = capturedA; }
    else                       { capturedB++; document.getElementById('invB').textContent = capturedB; }
    showMsg('cap', `CAPTURED!  Alien Type-${hitAlien.type} secured.`);
    updateHUD();
    checkWin();
  } else {
    hitAlien.state       = 'frozen';
    hitAlien.freezeTimer = FREEZE_SEC;
    showMsg('cap', `FROZEN!  Shoot again to capture!`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// HUD / WIN
// ══════════════════════════════════════════════════════════════════════════════
let capturedA = 0, capturedB = 0;
let gameWon   = false;

function updateHUD() {
  const captured  = capturedA + capturedB;
  const remaining = aliens.filter(a => !a.captured).length;
  document.getElementById('capturedCount').textContent  = captured;
  document.getElementById('targetCount').textContent    = TOTAL_ALIENS;
  document.getElementById('remainingCount').textContent = remaining;
}

function checkWin() {
  if (capturedA + capturedB < TOTAL_ALIENS) return;
  gameWon = true;
  document.getElementById('winScreen').style.display = 'flex';
  document.getElementById('finalScore').textContent =
    `Type-A: ${capturedA}   |   Type-B: ${capturedB}   |   Total: ${capturedA + capturedB}`;
  if (document.pointerLockElement) document.exitPointerLock();
}

function showMsg(type, text) {
  const el = document.getElementById(type === 'warn' ? 'warningMsg' : 'captureMsg');
  el.textContent = text;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, type === 'warn' ? 2200 : 2600);
}

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE — PLAYER
// ══════════════════════════════════════════════════════════════════════════════
let playerYaw   = 0;
let playerPitch = 0;
const playerVel = new THREE.Vector3();
let   playerOnGround = true;

function updatePlayer(dt) {
  if (pointerLocked) {
    playerYaw   -= mouseDX * 0.0022;
    playerPitch -= mouseDY * 0.0022;
    playerPitch  = THREE.MathUtils.clamp(playerPitch, -Math.PI * 0.44, Math.PI * 0.44);
    mouseDX = mouseDY = 0;
  }

  const cosY = Math.cos(playerYaw), sinY = Math.sin(playerYaw);
  const fwd   = new THREE.Vector3(-sinY, 0, -cosY);
  const right = new THREE.Vector3( cosY, 0, -sinY);
  const move  = new THREE.Vector3();

  if (keys.has('KeyW') || keys.has('ArrowUp'))    move.add(fwd);
  if (keys.has('KeyS') || keys.has('ArrowDown'))  move.sub(fwd);
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  move.sub(right);
  if (keys.has('KeyD') || keys.has('ArrowRight')) move.add(right);

  const spd = PLAYER_SPEED * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? SPRINT_MUL : 1.0);
  if (move.lengthSq() > 0) {
    move.normalize();
    playerVel.x = move.x * spd;
    playerVel.z = move.z * spd;
  } else {
    playerVel.x *= 0.72;
    playerVel.z *= 0.72;
  }

  if (keys.has('Space') && playerOnGround) {
    playerVel.y   = JUMP_VEL;
    playerOnGround = false;
  }
  playerVel.y += GRAVITY * dt;

  camera.position.x += playerVel.x * dt;
  camera.position.y += playerVel.y * dt;
  camera.position.z += playerVel.z * dt;

  const groundY = terrainH(camera.position.x, camera.position.z) + EYE_HEIGHT;
  if (camera.position.y <= groundY) {
    camera.position.y = groundY;
    playerVel.y   = 0;
    playerOnGround = true;
  } else {
    playerOnGround = false;
  }

  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -88, 88);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -88, 88);

  camera.rotation.y = playerYaw;
  camera.rotation.x = playerPitch;
}

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE — GUN BOB
// ══════════════════════════════════════════════════════════════════════════════
function updateGunBob(t) {
  const moving = keys.has('KeyW') || keys.has('KeyS') || keys.has('KeyA') || keys.has('KeyD');
  const spd    = moving ? (keys.has('ShiftLeft') ? 12 : 8) : 3;
  const amt    = moving ? 0.007 : 0.002;
  gunGroup.position.y = -0.135 + Math.sin(t * spd) * amt;
  gunGroup.position.x =          Math.sin(t * spd * 0.5) * amt * 0.6;
}

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE — ALIENS
// ══════════════════════════════════════════════════════════════════════════════
function updateAliens(dt) {
  const pp  = camera.position;
  const now = performance.now() * 0.001;
  const radarLines = [];

  for (const a of aliens) {
    if (a.state === 'captured') continue;
    const ap   = a.group.position;
    const dist = ap.distanceTo(pp);

    radarLines.push({ dist, str: `Type-${a.type} — ${dist.toFixed(0)}m${a.state === 'frozen' ? ' [FROZEN]' : ''}`, close: dist < 12 });

    a.ring.rotation.z += dt * 1.9;

    if (a.state === 'frozen') {
      a.freezeTimer -= dt;
      a.freeze.material.opacity = 0.12 + Math.abs(Math.sin(now * 5)) * 0.28;
      if (a.freezeTimer <= 0) {
        a.state = 'wander';
        a.freeze.material.opacity = 0;
        showMsg('warn', `Alien Type-${a.type} THAWED — too slow!`);
      }
      continue;
    }
    a.freeze.material.opacity = 0;

    // All aliens chase the player
    a.state = dist < 35 ? 'chase' : 'wander';

    const dir = new THREE.Vector3();

    if (a.state === 'chase') {
      dir.subVectors(pp, ap).setY(0).normalize();
      ap.addScaledVector(dir, SPD_CHASE * dt);
      if (dist < 1.5) showMsg('warn', '⚠ ALIEN CONTACT!  Freeze it first!');
    } else {
      a.wanderTimer -= dt;
      if (a.wanderTimer <= 0) newWanderTarget(a);
      dir.copy(a.wanderTarget).setY(ap.y).sub(ap);
      if (dir.lengthSq() > 0.25) {
        dir.setY(0).normalize();
        ap.addScaledVector(dir, SPD_WANDER * dt);
      } else {
        newWanderTarget(a);
      }
    }

    ap.y = terrainH(ap.x, ap.z);
    ap.x = THREE.MathUtils.clamp(ap.x, -88, 88);
    ap.z = THREE.MathUtils.clamp(ap.z, -88, 88);

    if (dir.lengthSq() > 0.0001) {
      a.group.rotation.y = Math.atan2(dir.x, dir.z);
    }

    const bob = Math.sin(now * 2.8 + a.bobOffset) * 0.04;
    a.headSphere.position.y = 1.82 + bob;
    a.facePlane.position.y  = 1.15 + bob;
  }

  radarLines.sort((x, y) => x.dist - y.dist);
  document.getElementById('alienRadar').innerHTML =
    radarLines.slice(0, 4).map(r =>
      `<div class="radar-entry${r.close ? ' close' : ''}">${r.str}</div>`
    ).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE — SNOW, BEAM, AURORA
// ══════════════════════════════════════════════════════════════════════════════
function updateSnow(dt) {
  const pos = snowGeo.attributes.position;
  const cp  = camera.position;
  const t   = performance.now() * 0.001;
  for (let i = 0; i < SNOW_COUNT; i++) {
    pos.array[i * 3 + 1] -= snowSpd[i] * dt;
    pos.array[i * 3]     += Math.sin(t * 0.25 + i * 0.55) * 0.009;
    if (pos.array[i * 3 + 1] < cp.y - 12) {
      pos.array[i * 3]     = cp.x + (Math.random() - 0.5) * 110;
      pos.array[i * 3 + 1] = cp.y + 40;
      pos.array[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 110;
    }
  }
  pos.needsUpdate = true;
}

function updateBeam(dt) {
  if (!beamMesh) return;
  beamTimer -= dt;
  if (beamTimer <= 0) { scene.remove(beamMesh); beamMesh = null; }
}

function updateAurora(t) {
  aurora0.intensity = 0.45 + Math.sin(t * 0.38) * 0.22;
  aurora1.intensity = 0.30 + Math.cos(t * 0.27) * 0.15;
  aurora0.position.x = Math.sin(t * 0.07) * 75;
  aurora1.position.z = Math.cos(t * 0.11) * 70;
  sunHalo1.material.opacity = 0.14 + Math.sin(t * 0.5) * 0.06;
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER LOOP
// ══════════════════════════════════════════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.getElapsedTime();

  if (gameStarted && !gameWon) {
    updatePlayer(dt);
    updateAliens(dt);
    updateSnow(dt);
    updateBeam(dt);
    updateAurora(t);
    updateGunBob(t);

    if (fireQueued) {
      fireQueued = false;
      fireCapture();
    }
  }

  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth();
  renderer.render(gunScene, gunCamera);
}

// ══════════════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════════════
async function init() {
  const [texA, texB] = await Promise.all([
    loadTex('assets/alien_a.jpg', 'blue',   'alien_a.jpg'),
    loadTex('assets/alien_b.jpg', 'orange', 'alien_b.jpg'),
  ]);

  for (let i = 0; i < ALIEN_COUNT_A; i++) makeAlien('A', texA);
  for (let i = 0; i < ALIEN_COUNT_B; i++) makeAlien('B', texB);

  updateHUD();
  animate();
}

init();
