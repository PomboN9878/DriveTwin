// Modelo de simulação longitudinal (Drive Twin). Requer THREE global (vendor/three.min.js).
const G = 9.81, RHO = 1.2, EFF = 0.9, WR = 0.32;
const ROAD = { seca: { mu: .9, crr: .012 }, molhada: { mu: .55, crr: .013 }, cascalho: { mu: .4, crr: .025 }, gelo: { mu: .12, crr: .015 } };
const $ = id => document.getElementById(id);
const fmt = { m: v => v + ' kg', p: v => v + ' kW', cd: v => (+v).toFixed(2), a: v => (+v).toFixed(2) + ' m²', s: v => v + ' %', t: v => v + ' km/h' };
function P() { const r = ROAD[$('r').value]; return { m: +$('m').value, pw: +$('p').value * 1000 * EFF, cd: +$('cd').value, A: +$('a').value, th: Math.atan(+$('s').value / 100), vt: +$('t').value / 3.6, mu: r.mu, crr: r.crr } }
// passo da física: retorna aceleração e flags
function step(v, dt, p, mode) {
  const drag = .5 * RHO * p.cd * p.A * v * v, roll = p.crr * p.m * G * Math.cos(p.th), grade = p.m * G * Math.sin(p.th);
  const cap = p.mu * p.m * G * .5; let F, limited = false;
  if (mode === 'brake') { // frenagem limitada pelo atrito nas 4 rodas
    const fb = p.mu * p.m * G * .95; F = -fb - (v > 0 ? drag + roll : 0) - grade; limited = true;
  } else {
    const thr = mode === 'full' ? 1 : Math.min(1, Math.max(0, (p.vt - v) * .8));
    const fe = Math.min(thr * p.pw / Math.max(v, 1), 1e9); limited = fe > cap; F = Math.min(fe, cap) - drag - roll - grade;
    if (thr === 0 && v === 0) F = Math.min(0, F) < 0 ? 0 : F;
  }
  let a = F / p.m, nv = v + a * dt; if (nv < 0) { nv = 0; a = 0 }
  return { v: nv, a, drag, limited };
}
function kpis(p) {
  let v = 0, t = 0, t100 = null;
  while (t < 90) { v = step(v, .01, p, 'full').v; t += .01; if (v >= 27.78) { t100 = t; break } }
  let vm = 0; for (let i = 0; i < 8000; i++)vm = step(vm, .05, p, 'full').v;
  let b = 27.78, d = 0; for (let i = 0; i < 20000 && b > 0; i++) { const s = step(b, .005, p, 'brake'); d += (b + s.v) / 2 * .005; b = s.v }
  $('k0').textContent = t100 ? t100.toFixed(1) + ' s' : 'não atinge';
  $('kv').textContent = Math.round(vm * 3.6) + ' km/h';
  $('kb').textContent = Math.round(d) + ' m';
}
// ---- 3D ----
const view = $('view');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); view.appendChild(renderer.domElement);
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 2, .1, 300);
cam.position.set(-6.5, 2.6, 6.5); cam.lookAt(0, .6, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x556070, .9));
const sun = new THREE.DirectionalLight(0xffffff, .8); sun.position.set(-5, 10, 6); scene.add(sun);
const world = new THREE.Group(); scene.add(world);
const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 7), new THREE.MeshLambertMaterial({ color: 0x3a3f47 }));
road.rotation.x = -Math.PI / 2; world.add(road);
const grass = new THREE.Mesh(new THREE.PlaneGeometry(300, 60), new THREE.MeshLambertMaterial({ color: 0x4d7a45 }));
grass.rotation.x = -Math.PI / 2; grass.position.y = -.02; world.add(grass);
const stripes = []; const sm = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.4, .02, .18), sm); s.position.y = .01; world.add(s); stripes.push(s) }
const car = new THREE.Group(); world.add(car);
const bodyMat = new THREE.MeshLambertMaterial({ color: 0xe8590c });
const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, .7, 1.8), bodyMat); body.position.y = .65; car.add(body);
const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, .6, 1.6), new THREE.MeshLambertMaterial({ color: 0x222b36 })); cab.position.set(-.2, 1.25, 0); car.add(cab);
const wheels = [];
[[1.35, .9], [1.35, -.9], [-1.35, .9], [-1.35, -.9]].forEach(([x, z]) => {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, .25, 20), new THREE.MeshLambertMaterial({ color: 0x111111 }));
  w.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.position.set(x, WR, z); g.add(w);
  const sp = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .27), new THREE.MeshBasicMaterial({ color: 0xcccccc })); w.add(sp);
  car.add(g); wheels.push(w)
});
function resize() { const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }
addEventListener('resize', resize); resize();
// ---- estado ----
let S, mode = 'idle', hist = [], braking = false, lastT = performance.now(), acc = 0, pitch = 0;
function reset() { S = { v: 0, x: 0, t: 0, a: 0, drag: 0, limited: false }; hist = []; mode = 'idle'; $('go').textContent = 'Acelerar' }
reset();
function refresh() {
  for (const k of ['m', 'p', 'cd', 'a', 's', 't']) $('o_' + k).textContent = fmt[k]($(k).value);
  kpis(P());
}
document.querySelectorAll('.sim input,.sim select').forEach(e => e.addEventListener('input', refresh)); refresh();
$('go').onclick = () => { mode = mode === 'cruise' ? 'idle' : 'cruise'; $('go').textContent = mode === 'cruise' ? 'Soltar acelerador' : 'Acelerar' };
$('rs').onclick = reset;
const bd = () => { braking = true }, bu = () => { braking = false };
$('br').addEventListener('pointerdown', bd); addEventListener('pointerup', bu);
addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|SELECT|BUTTON/.test(e.target.tagName)) { braking = true; e.preventDefault() } });
addEventListener('keyup', e => { if (e.code === 'Space') braking = false });

// Carrega os parâmetros físicos de um carro do catálogo no simulador.
export function loadCar(data) {
  $('m').value = data.mass_kg; $('p').value = data.power_kw; $('cd').value = data.drag_coefficient; $('a').value = data.frontal_area;
  refresh(); reset();
}

// gráfico
const ch = $('chart'), cx = ch.getContext('2d');
function chart() {
  const dpr = devicePixelRatio || 1, w = ch.clientWidth, h = ch.clientHeight; ch.width = w * dpr; ch.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement);
  cx.clearRect(0, 0, w, h); cx.strokeStyle = cs.getPropertyValue('--bd'); cx.fillStyle = cs.getPropertyValue('--mut'); cx.font = '11px system-ui';
  const ymax = Math.max(60, ...hist.map(p => p.v)) * 1.1;
  for (let i = 0; i <= 4; i++) { const y = h - 18 - (h - 26) * i / 4; cx.beginPath(); cx.moveTo(30, y); cx.lineTo(w, y); cx.stroke(); cx.fillText(Math.round(ymax * i / 4), 0, y + 4) }
  if (hist.length < 2) return;
  cx.strokeStyle = cs.getPropertyValue('--ac'); cx.lineWidth = 2; cx.beginPath();
  const t1 = hist[hist.length - 1].t, t0 = Math.min(hist[0].t, t1 - 30);
  hist.forEach((p, i) => { const X = 30 + (w - 34) * (p.t - t0) / 30, Y = h - 18 - (h - 26) * p.v / ymax; i ? cx.lineTo(X, Y) : cx.moveTo(X, Y) }); cx.stroke(); cx.lineWidth = 1;
}
let off = 0, frame = 0;
function loop(now) {
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; acc += dt; const p = P();
  while (acc >= 1 / 60) {
    const m = braking ? 'brake' : mode === 'cruise' ? 'cruise' : 'coast';
    const r = m === 'coast' ? step(S.v, 1 / 60, { ...p, vt: 0 }, 'cruise') : step(S.v, 1 / 60, p, m);
    S.v = r.v; S.a = r.a; S.drag = r.drag; S.limited = r.limited && (m === 'brake' || (mode === 'cruise' && p.vt > S.v));
    S.x += S.v / 60; S.t += 1 / 60; acc -= 1 / 60; off += S.v / 60;
    if (frame++ % 6 === 0) { hist.push({ t: S.t, v: S.v * 3.6 }); if (hist.length > 300) hist.shift() }
  }
  stripes.forEach((s, i) => { let x = (i * 6 - (off % 6)); x = ((x + 90) % 180 + 180) % 180 - 90; s.position.x = x });
  const th = P().th; world.rotation.z = th;
  const tp = Math.max(-.08, Math.min(.08, S.a * .012)); pitch += (tp - pitch) * .1; car.rotation.z = pitch;
  wheels.forEach(w => w.parent.children[0].rotation.y += S.v / WR / 60 * (S.limited && !braking ? 1.6 : 1));
  bodyMat.color.set(S.limited ? 0xd92d20 : 0xe8590c);
  $('warn').style.display = S.limited && S.v < 150 ? 'block' : 'none';
  $('hv').textContent = Math.round(S.v * 3.6); $('ka').textContent = S.a.toFixed(1) + ' m/s²';
  $('kd').textContent = Math.round(S.drag) + ' N'; $('kx').textContent = Math.round(S.x) + ' m';
  renderer.render(scene, cam); if (frame % 3 === 0) chart();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
