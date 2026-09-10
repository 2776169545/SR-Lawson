import { THREE, rnd, WALK_Y, ROAD_Y } from './core.js';
import { SX0, SX1, SZ0, SZ1 } from './layout.js';

/* 建筑内部区域（不产生降雨/涟漪） */
function insideBuilding(x, z) {
  if (x > SX0 - 0.2 && x < SX1 + 0.35 && z > SZ0 - 0.2 && z < SZ1 + 0.35) return true;  // 便利店
  if (x < -4.55 && z < 1.35) return true;                                               // 邻楼
  return false;
}
function randOutside() {
  for (let i = 0; i < 24; i++) {
    const x = rnd(-6.2, 6.2), z = rnd(-6.2, 6.2);
    if (!insideBuilding(x, z)) return { x, z };
  }
  return { x: 0, z: 4 };
}

/* =============================== 降雨 =============================== */
export function buildRain(world, count = 2400) {
  const N = count;
  const pos = new Float32Array(N * 6);
  const drop = new Array(N);
  for (let i = 0; i < N; i++) {
    const p = randOutside();
    drop[i] = { x: p.x, y: rnd(0, 8), z: p.z, v: rnd(11, 17) };
  }
  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', attr);
  const mat = new THREE.LineBasicMaterial({
    color: 0xa9c9ff, transparent: true, opacity: 0.28, depthWrite: false
  });
  const rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false;
  world.add(rain);

  // 稀疏的第二层（更亮、更长，近处雨丝）
  const N2 = 320;
  const pos2 = new Float32Array(N2 * 6);
  const drop2 = new Array(N2);
  for (let i = 0; i < N2; i++) {
    const p = randOutside();
    drop2[i] = { x: p.x, y: rnd(0, 8), z: p.z, v: rnd(16, 21) };
  }
  const geo2 = new THREE.BufferGeometry();
  const attr2 = new THREE.BufferAttribute(pos2, 3);
  attr2.setUsage(THREE.DynamicDrawUsage);
  geo2.setAttribute('position', attr2);
  const rain2 = new THREE.LineSegments(geo2, new THREE.LineBasicMaterial({
    color: 0xd8e8ff, transparent: true, opacity: 0.22, depthWrite: false
  }));
  rain2.frustumCulled = false;
  world.add(rain2);

  const WIND = 0.16, WINDZ = 0.06;
  function update(dt) {
    for (let i = 0; i < N; i++) {
      const d = drop[i];
      d.y -= d.v * dt;
      d.x += WIND * d.v * dt * 0.35;
      d.z += WINDZ * d.v * dt * 0.35;
      if (d.y < 0.02) {
        const p = randOutside();
        d.x = p.x; d.z = p.z; d.y = rnd(6.5, 9.5); d.v = rnd(11, 17);
      }
      const j = i * 6;
      pos[j] = d.x; pos[j + 1] = d.y; pos[j + 2] = d.z;
      pos[j + 3] = d.x + WIND * 0.28; pos[j + 4] = d.y + 0.3; pos[j + 5] = d.z + WINDZ * 0.28;
    }
    attr.needsUpdate = true;
    for (let i = 0; i < N2; i++) {
      const d = drop2[i];
      d.y -= d.v * dt;
      d.x += WIND * d.v * dt * 0.35;
      d.z += WINDZ * d.v * dt * 0.35;
      if (d.y < 0.02) {
        const p = randOutside();
        d.x = p.x; d.z = p.z; d.y = rnd(6.5, 9.5); d.v = rnd(16, 21);
      }
      const j = i * 6;
      pos2[j] = d.x; pos2[j + 1] = d.y; pos2[j + 2] = d.z;
      pos2[j + 3] = d.x + WIND * 0.4; pos2[j + 4] = d.y + 0.55; pos2[j + 5] = d.z + WINDZ * 0.4;
    }
    attr2.needsUpdate = true;
  }
  return { update };
}

/* =============================== 地面积水涟漪 =============================== */
export function buildRipples(world, count = 44) {
  const geo = new THREE.RingGeometry(0.055, 0.1, 20);
  const pool = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xcfe4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    }));
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    world.add(m);
    pool.push({ m, life: 0, dur: 1, active: false, x: 0, z: 0, y: 0 });
  }
  let cursor = 0;
  function spawn(x, z, y) {
    const r = pool[cursor];
    cursor = (cursor + 1) % pool.length;
    r.active = true; r.life = 0; r.dur = rnd(0.8, 1.35);
    r.x = x; r.z = z; r.y = y;
    r.m.visible = true;
    r.m.position.set(x, y + 0.006, z);
    r.m.scale.setScalar(0.3);
    r.m.material.opacity = 0.5;
  }
  let acc = 0;
  function update(dt) {
    // 全局随机雨点涟漪
    acc += dt;
    const interval = 0.035;
    while (acc > interval) {
      acc -= interval;
      const p = randOutside();
      const onWalk = (p.x < 2.4 && p.z < 2.4 && p.x > -5 && p.z > -5);
      spawn(p.x, p.z, onWalk ? WALK_Y : ROAD_Y);
    }
    for (const r of pool) {
      if (!r.active) continue;
      r.life += dt;
      const t = r.life / r.dur;
      if (t >= 1) { r.active = false; r.m.visible = false; continue; }
      r.m.scale.setScalar(0.3 + t * 1.35);
      r.m.material.opacity = 0.5 * (1 - t) * (1 - t);
    }
  }
  return { update, spawn };
}

/* =============================== 屋檐滴水 =============================== */
export function buildDrips(world, ripples) {
  const drips = [];
  const geo = new THREE.BoxGeometry(0.035, 0.14, 0.035);
  const mat = new THREE.MeshBasicMaterial({ color: 0xd6ecff, transparent: true, opacity: 0.75, depthWrite: false });

  // 正面雨棚前沿
  for (let i = 0; i < 6; i++) {
    const x = -3.1 + i * 0.78;
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    world.add(m);
    drips.push({ m, x, z: 1.82, y0: 2.55, gy: WALK_Y, t: Math.random() * 3, period: rnd(1.6, 3.2), on: false, v: 0 });
  }
  // 侧面雨棚前沿
  for (let i = 0; i < 5; i++) {
    const z = -3.5 + i * 0.92;
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    world.add(m);
    drips.push({ m, x: 1.82, z, y0: 2.55, gy: WALK_Y, t: Math.random() * 3, period: rnd(1.8, 3.4), on: false, v: 0 });
  }
  // 屋顶边缘
  for (let i = 0; i < 3; i++) {
    const x = -2.4 + i * 1.9;
    const m = new THREE.Mesh(geo, mat);
    m.visible = false;
    world.add(m);
    drips.push({ m, x, z: -3.78, y0: 3.15, gy: WALK_Y, t: Math.random() * 3, period: rnd(2.4, 4.2), on: false, v: 0 });
  }

  function update(dt) {
    for (const d of drips) {
      if (!d.on) {
        d.t -= dt;
        if (d.t <= 0) { d.on = true; d.y = d.y0; d.v = 0; d.m.visible = true; }
        continue;
      }
      d.v += 9.0 * dt;
      d.y -= d.v * dt;
      d.m.position.set(d.x, d.y, d.z);
      d.m.scale.set(1, Math.min(1 + d.v * 0.28, 3.2), 1);
      if (d.y <= d.gy + 0.05) {
        d.on = false; d.t = d.period; d.m.visible = false;
        ripples.spawn(d.x, d.z, d.gy);
      }
    }
  }
  return { update };
}
