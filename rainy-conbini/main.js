import {
  THREE, renderer, scene, camera, controls, world, clock,
  glassUniforms
} from './js/core.js';
import { buildGround } from './js/ground.js';
import { buildStore } from './js/store.js';
import { buildStreet, updatePuddles } from './js/props.js';
import { buildRain, buildRipples, buildDrips } from './js/effects.js';

/* ---------------- 搭建场景 ---------------- */
buildGround(world);
const storeAnim = buildStore(world);
const streetAnim = buildStreet(world);

const ripples = buildRipples(world, 46);
const rain = buildRain(world, 2400);
const drips = buildDrips(world, ripples);

/* ---------------- 闪烁灯箱的基础色 ---------------- */
const flickerItems = storeAnim.flicker.map((m, i) => ({
  m, base: m.material.color.clone(), seed: i * 1.7
}));

/* ---------------- 自动门 ---------------- */
let doorT = 4.0;
const DOOR_CYCLE = 13.0;
const smooth = t => t * t * (3 - 2 * t);

/* ---------------- 交通信号灯 ---------------- */
let sigT = 0;
const SIG = [
  { c: 0xff4433, d: 7.0 },   // 红
  { c: 0x44dd66, d: 6.5 },   // 绿
  { c: 0xffcc33, d: 1.6 }    // 黄
];
let sigIdx = 0;

/* ---------------- 主循环 ---------------- */
let t = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;

  /* 雨 / 涟漪 / 滴水 */
  rain.update(dt);
  ripples.update(dt);
  drips.update(dt);
  glassUniforms.uTime.value = t;
  updatePuddles(t);

  /* 招牌与灯箱轻微闪烁 */
  for (let i = 0; i < flickerItems.length; i++) {
    const f = flickerItems[i];
    let k = 0.94 + 0.06 * Math.sin(t * 6.7 + f.seed) + 0.03 * Math.sin(t * 23.1 + f.seed * 3);
    if (Math.random() < 0.0035) k -= 0.4;
    k = Math.max(0.6, Math.min(1.04, k));
    f.m.material.color.copy(f.base).multiplyScalar(k);
  }
  if (storeAnim.signLight) {
    storeAnim.signLight.intensity = 30 + Math.sin(t * 6.7) * 1.6 + (Math.random() < 0.004 ? -12 : 0);
  }

  /* 自动门偶尔开合 */
  doorT = (doorT + dt) % DOOR_CYCLE;
  let k = 0;
  if (doorT < 1.1) k = smooth(doorT / 1.1);
  else if (doorT < 4.2) k = 1;
  else if (doorT < 5.3) k = 1 - smooth((doorT - 4.2) / 1.1);
  for (const d of storeAnim.doors) {
    d.obj.position.x = d.sgn * (d.closed + (d.open - d.closed) * k);
  }

  /* 交通信号灯变化 */
  sigT += dt;
  if (sigT > SIG[sigIdx].d) { sigT = 0; sigIdx = (sigIdx + 1) % SIG.length; }
  const activeIdx = [0, 2, 1][sigIdx]; // 红->index0, 绿->index2, 黄->index1
  for (const head of streetAnim.signals) {
    for (let i = 0; i < 3; i++) {
      const on = (i === activeIdx);
      head[i].on.visible = on;
      head[i].off.visible = !on;
    }
  }
  if (streetAnim.signalLight) {
    streetAnim.signalLight.color.setHex(SIG[sigIdx].c);
    streetAnim.signalLight.intensity = 6 + Math.sin(t * 3.3) * 0.8;
  }

  /* 关东煮热气 */
  for (const s of storeAnim.steam) {
    s.position.y += s.userData.sp * dt;
    s.position.x = s.userData.x0 + Math.sin(t * 1.6 + s.userData.t * 9) * 0.05;
    if (s.position.y > 1.25) {
      s.position.y = 0.28;
      s.userData.x0 = (Math.random() - 0.5) * 0.5;
    }
    const h = (s.position.y - 0.28) / 0.97;
    s.material.opacity = 0.18 * (1 - h) * (1 - h * 0.4);
    s.scale.setScalar(0.7 + h * 1.8);
  }

  controls.update();
  renderer.render(scene, camera);
}
renderer.render(scene, camera); // 首帧立即可见
animate();
