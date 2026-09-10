import {
  THREE, M, GLOW, toon, basic, box, cyl, plane, chamferSlab, tex, texMat,
  instProducts, rnd, PROD_COLORS, glassMat, gradientMap, JP, WALK_Y, FLOOR_Y, CEIL_Y
} from './core.js';
import { SX0, SX1, SZ0, SZ1, CH, T, WH, SILL, WTOP } from './layout.js';

const FY = FLOOR_Y;

export function buildStore(world) {
  const store = new THREE.Group();
  world.add(store);

  const anim = { doors: [], flicker: [], steam: [], signLight: null };

  /* ================= 地板 ================= */
  chamferSlab(store, SX0, SX1, SZ0, SZ1, CH, 0.08, M.floorIn, WALK_Y, { ol: 0.014, cast: false });

  /* ================= 外墙 ================= */
  const FWL = 3.26, FCX = -1.43;          // 正面墙 x: -3.06 .. 0.20
  const SWL = 3.86, SCZ = -1.73;          // 侧墙 z: -3.66 .. 0.20

  // 正面：下墙 / 檐口 / 左实墙
  box(store, FWL, SILL, T, M.wall, FCX, SILL / 2, SZ1, { ol: 0.016 });
  box(store, FWL, WH - WTOP, T, M.fascia, FCX, (WH + WTOP) / 2, SZ1, { ol: 0.016 });
  box(store, 0.46, WTOP - SILL, T, M.wall, -2.83, (WTOP + SILL) / 2, SZ1, { ol: 0.016 });
  // 侧面：下墙 / 檐口 / 后段实墙
  box(store, T, SILL, SWL, M.wall, SX1, SILL / 2, SCZ, { ol: 0.016 });
  box(store, T, WH - WTOP, SWL, M.fascia, SX1, (WH + WTOP) / 2, SCZ, { ol: 0.016 });
  box(store, T, WTOP - SILL, 1.46, M.wall, SX1, (WTOP + SILL) / 2, -2.93, { ol: 0.016 });
  // 后墙 / 左墙
  box(store, 4.32, WH, T, M.wallSide, -0.9, WH / 2, SZ0, { ol: 0.018 });
  box(store, T, WH, 4.92, M.wallSide, SX0, WH / 2, -1.2, { ol: 0.018 });
  // 墙裙
  box(store, FWL, 0.16, 0.05, M.wallDark, FCX, 0.235, SZ1 + 0.06, { ol: 0 });
  box(store, 0.05, 0.16, SWL, M.wallDark, SX1 + 0.06, 0.235, SCZ, { ol: 0 });
  box(store, 4.32, 0.16, 0.05, M.wallDark, -0.9, 0.235, SZ0 - 0.06, { ol: 0 });
  box(store, 0.05, 0.16, 4.92, M.wallDark, SX0 - 0.06, 0.235, -1.2, { ol: 0 });

  // 左侧雨水管
  cyl(store, 0.055, 0.055, WH, M.metal, SX0 - 0.11, WH / 2, 1.02, { ol: 0.012, seg: 10 });
  for (let y = 0.6; y < WH; y += 0.9) cyl(store, 0.075, 0.075, 0.06, M.metalDark, SX0 - 0.11, y, 1.02, { ol: 0, seg: 10 });

  /* ================= 屋顶 ================= */
  chamferSlab(store, SX0 - 0.16, SX1 + 0.16, SZ0 - 0.16, SZ1 + 0.16, CH + 0.16, 0.2, toon(0x414958), WH, { ol: 0.018 });
  box(store, 4.68, 0.24, 0.1, toon(0x545d6c), -0.9, WH + 0.31, SZ1 + 0.26, { ol: 0.014 });
  box(store, 0.1, 0.24, 5.28, toon(0x545d6c), SX1 + 0.26, WH + 0.31, -1.2, { ol: 0.014 });
  // 屋顶护栏
  for (let x = -3.0; x <= 1.2; x += 0.42) cyl(store, 0.022, 0.022, 0.4, M.metalDark, x, WH + 0.6, SZ1 + 0.2, { ol: 0, seg: 6 });
  box(store, 4.5, 0.035, 0.035, M.metalDark, -0.9, WH + 0.78, SZ1 + 0.2, { ol: 0 });
  for (let z = -3.2; z <= 0.8; z += 0.42) cyl(store, 0.022, 0.022, 0.4, M.metalDark, SX1 + 0.2, WH + 0.6, z, { ol: 0, seg: 6 });
  box(store, 0.035, 0.035, 4.4, M.metalDark, SX1 + 0.2, WH + 0.78, -1.2, { ol: 0 });
  // 屋顶设备
  box(store, 0.78, 0.5, 0.7, M.metal, -2.3, WH + 0.45, -2.6, { ol: 0.016 });
  cyl(store, 0.26, 0.26, 0.05, M.metalDark, -2.3, WH + 0.72, -2.6, { ol: 0.012, seg: 12 });
  box(store, 0.34, 0.42, 0.34, M.metalDark, 0.3, WH + 0.31, -3.1, { ol: 0.014 });
  box(store, 1.5, 0.06, 0.06, M.metalDark, -1.2, WH + 0.28, -0.4, { ol: 0 });

  /* ================= 屋檐雨棚 ================= */
  const CY = 2.63, DEP = 0.72;
  const canopy = toon(0x35817a);
  box(store, 3.34, 0.13, DEP, canopy, FCX, CY, SZ1 + DEP / 2 - 0.1, { ol: 0.016 });
  box(store, DEP, 0.13, 3.94, canopy, SX1 + DEP / 2 - 0.1, CY, -1.73, { ol: 0.016 });
  box(store, 1.9, 0.13, DEP, canopy, 1.028, CY, 1.028, { ry: Math.PI / 4, ol: 0.016 });
  box(store, 3.34, 0.1, 0.08, toon(0xece5d4), FCX, CY - 0.03, SZ1 + DEP - 0.1, { ol: 0 });
  box(store, 0.08, 0.1, 3.94, toon(0xece5d4), SX1 + DEP - 0.1, CY - 0.03, -1.73, { ol: 0 });
  box(store, 1.9, 0.1, 0.08, toon(0xece5d4), 1.028 + 0.45, CY - 0.03, 1.028 + 0.45, { ry: Math.PI / 4, ol: 0 });
  // 檐下暖灯
  for (let i = 0; i < 4; i++) box(store, 0.22, 0.05, 0.22, GLOW.warm, -2.6 + i * 0.95, CY - 0.09, SZ1 + 0.44, { ol: 0, cast: false });
  for (let i = 0; i < 3; i++) box(store, 0.22, 0.05, 0.22, GLOW.warm, SX1 + 0.44, CY - 0.09, -0.35 - i * 1.25, { ol: 0, cast: false });

  /* ================= 玻璃橱窗 ================= */
  const wy = (WTOP + SILL) / 2, wh = WTOP - SILL;
  // 正面
  plane(store, 2.8, wh, glassMat, -1.2, wy, SZ1 + 0.008, { recv: false });
  plane(store, 2.8, wh, glassMat, -1.2, wy, SZ1 - 0.008, { recv: false });
  for (let i = 0; i <= 3; i++) box(store, 0.045, wh, 0.15, M.frame, -2.6 + i * (2.8 / 3), wy, SZ1, { ol: 0.009 });
  box(store, 2.8, 0.04, 0.15, M.frame, -1.2, 1.78, SZ1, { ol: 0.009 });
  // 侧面
  plane(store, 2.4, wh, glassMat, SX1 + 0.008, wy, -1.0, { ry: Math.PI / 2, recv: false });
  plane(store, 2.4, wh, glassMat, SX1 - 0.008, wy, -1.0, { ry: Math.PI / 2, recv: false });
  for (let i = 0; i <= 3; i++) box(store, 0.15, wh, 0.045, M.frame, SX1, wy, -2.2 + i * 0.8, { ol: 0.009 });
  box(store, 0.15, 0.04, 2.4, M.frame, SX1, 1.78, -1.0, { ol: 0.009 });

  /* ================= 招牌腰线 ================= */
  {
    const st = tex(512, 48, (g, w, h) => {
      g.fillStyle = '#e6e0d2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2b847b'; g.fillRect(0, 0, w, h * 0.4);
      g.fillStyle = '#d97b32'; g.fillRect(0, h * 0.48, w, h * 0.18);
      g.fillStyle = '#b23b36'; g.fillRect(0, h * 0.71, w, h * 0.14);
    });
    const matA = new THREE.MeshToonMaterial({ map: st, gradientMap });
    box(store, FWL, 0.3, 0.05, matA, FCX, 2.72, SZ1 + 0.075, { ol: 0 });
    box(store, 0.05, 0.3, SWL, matA, SX1 + 0.075, 2.72, SCZ, { ol: 0 });
  }

  /* ================= 屋顶招牌（闪烁） ================= */
  {
    const signTex = tex(1024, 256, (g, w, h) => {
      g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2f8f86'; g.fillRect(0, 0, w, 28);
      g.fillStyle = '#e0853c'; g.fillRect(0, 36, w, 14);
      g.fillStyle = '#c0453f'; g.fillRect(0, 58, w, 10);
      g.fillStyle = '#1d2b3a';
      g.font = `bold 104px ${JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('コンビニ', w / 2 - 45, h / 2 + 14);
      g.fillStyle = '#2f8f86'; g.fillRect(w - 240, h / 2 - 54, 200, 108);
      g.fillStyle = '#ffffff'; g.font = `bold 60px ${JP}`;
      g.fillText('２４Ｈ', w - 140, h / 2 + 4);
    });
    const sm = new THREE.MeshBasicMaterial({ map: signTex });
    box(store, 3.34, 0.84, 0.12, toon(0x2a3340), -1.0, WH + 0.66, SZ1 + 0.24, { ol: 0.014 });
    box(store, 0.1, 0.6, 0.1, M.metalDark, -2.4, WH + 0.36, SZ1 + 0.3, { ol: 0 });
    box(store, 0.1, 0.6, 0.1, M.metalDark, 0.4, WH + 0.36, SZ1 + 0.3, { ol: 0 });
    const s1 = box(store, 3.14, 0.74, 0.06, sm, -1.0, WH + 0.66, SZ1 + 0.32, { ol: 0, cast: false });
    const s2 = box(store, 0.06, 0.62, 2.7, sm, SX1 + 0.32, WH + 0.66, -1.7, { ol: 0, cast: false });
    box(store, 0.12, 0.74, 2.9, toon(0x2a3340), SX1 + 0.24, WH + 0.66, -1.7, { ol: 0.014 });
    anim.flicker.push(s1, s2);

    const sl = new THREE.PointLight(0xfff1d6, 30, 10, 2);
    sl.position.set(-0.7, WH + 0.9, 1.7);
    store.add(sl);
    anim.signLight = sl;
  }

  /* ================= 墙面灯箱 / 海报柱 ================= */
  {
    const lb = texMat(256, 512, (g, w, h) => {
      g.fillStyle = '#1e2a38'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f6ead2';
      for (let i = 0; i < 4; i++) {
        g.fillRect(24, 30 + i * 118, w - 48, 92);
        g.fillStyle = ['#e0853c', '#2f8f86', '#c0453f', '#5b7fb5'][i];
        g.fillRect(34, 40 + i * 118, 74, 72);
        g.fillStyle = '#3a3a3a';
        g.fillRect(122, 52 + i * 118, w - 160, 14);
        g.fillRect(122, 78 + i * 118, w - 190, 10);
        g.fillStyle = '#f6ead2';
      }
    });
    const m1 = plane(store, 0.44, 1.62, lb, -2.83, 1.5, SZ1 + 0.09, { recv: false });
    anim.flicker.push(m1);
    box(store, 0.5, 1.7, 0.06, M.metalDark, -2.83, 1.5, SZ1 + 0.045, { ol: 0.014 });

    // 橱窗上的营业中贴纸
    const st = texMat(256, 128, (g, w, h) => {
      g.fillStyle = '#c0453f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff';
      g.font = `bold 52px ${JP}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('営業中', w / 2, h / 2);
    }, { transparent: true, opacity: 0.92 });
    plane(store, 0.5, 0.25, st, 0.05, 2.05, SZ1 + 0.03, { recv: false });
  }

  /* ================= 入口：自动门 ================= */
  {
    const g = new THREE.Group();
    g.position.set(0.7, 0, 0.7);
    g.rotation.y = Math.PI / 4;
    store.add(g);
    // 立柱 & 顶框
    box(g, 0.06, 2.5, 0.18, M.frame, -0.68, 1.25, 0, { ol: 0.012 });
    box(g, 0.06, 2.5, 0.18, M.frame, 0.68, 1.25, 0, { ol: 0.012 });
    box(g, 1.42, 0.3, 0.18, M.fascia, 0, 2.65, 0, { ol: 0.014 });
    // 固定玻璃
    plane(g, 0.26, 2.2, glassMat, -0.53, 1.15, -0.02, { recv: false });
    plane(g, 0.26, 2.2, glassMat, 0.53, 1.15, -0.02, { recv: false });
    // 亮子（门楣玻璃）
    plane(g, 1.3, 0.24, glassMat, 0, 2.38, -0.02, { recv: false });
    // 滑动门（两扇）
    const dmat = new THREE.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
    for (const sgn of [-1, 1]) {
      const d = new THREE.Group();
      d.position.set(sgn * 0.2, 0, 0);
      g.add(d);
      const p = plane(d, 0.4, 2.2, dmat, 0, 1.15, 0, { recv: false });
      // 门框（细边条，中间保持通透）
      box(d, 0.4, 0.06, 0.045, M.frame, 0, 0.08, -0.02, { ol: 0.008 });
      box(d, 0.4, 0.06, 0.045, M.frame, 0, 2.22, -0.02, { ol: 0.008 });
      box(d, 0.05, 2.2, 0.045, M.frame, sgn * 0.19, 1.15, -0.02, { ol: 0.008 });
      box(d, 0.05, 2.2, 0.045, M.frame, -sgn * 0.19, 1.15, -0.02, { ol: 0.008 });
      // 门把手
      box(d, 0.03, 0.5, 0.05, M.metal, sgn * 0.13, 1.15, 0.03, { ol: 0 });
      anim.doors.push({ obj: d, sgn, closed: 0.2, open: 0.53 });
    }
    // 门楣灯箱
    const dm = plane(g, 1.0, 0.2, texMat(512, 96, (gg, w, h) => {
      gg.fillStyle = '#20404f'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#ffe9c0'; gg.font = `bold 46px ${JP}`; gg.textAlign = 'center'; gg.textBaseline = 'middle';
      gg.fillText('いらっしゃいませ', w / 2, h / 2 + 2);
    }), 0, 2.65, 0.1, { recv: false });
    anim.flicker.push(dm);

    // 门口地垫
    const mat = texMat(512, 256, (gg, w, h) => {
      gg.fillStyle = '#4a3f38'; gg.fillRect(0, 0, w, h);
      gg.strokeStyle = '#7a6a58'; gg.lineWidth = 10; gg.strokeRect(14, 14, w - 28, h - 28);
      gg.fillStyle = '#cbbba4'; gg.font = `bold 54px ${JP}`; gg.textAlign = 'center'; gg.textBaseline = 'middle';
      gg.fillText('ＷＥＬＣＯＭＥ', w / 2, h / 2);
    });
    const m = plane(store, 0.92, 0.44, mat, 0, 0, 0, { rx: -Math.PI / 2, ry: Math.PI / 4, recv: false });
    m.position.set(0.46, FY + 0.012, 0.46);
  }

  /* ============================ 店内 ============================ */
  const interior = new THREE.Group();
  store.add(interior);

  // 吊顶 + 灯箱
  box(interior, 4.3, 0.08, 4.9, M.ceil, -0.9, CEIL_Y + 0.04, -1.2, { ol: 0, cast: false });
  [[-1.55, -1.15], [-1.55, -2.6], [0.2, -1.15], [0.2, -2.6]].forEach(([x, z]) => {
    const p = box(interior, 1.4, 0.07, 0.34, basic(0xffeecb), x, CEIL_Y - 0.05, z, { ol: 0, cast: false });
    anim.flicker.push(p);
  });
  // 店内暖光
  [[-1.6, -1.2], [-1.6, -2.9], [0.3, -1.3]].forEach(([x, z]) => {
    const l = new THREE.PointLight(0xffc987, 5.5, 9, 2);
    l.position.set(x, CEIL_Y - 0.4, z);
    interior.add(l);
  });
  const doorLight = new THREE.PointLight(0xffd9a8, 5.2, 8, 2);
  doorLight.position.set(0.6, 2.3, 0.6);
  interior.add(doorLight);

  // 地面导视
  box(interior, 0.55, 0.008, 2.5, toon(0xd6d0c0), -0.25, FY + 0.006, -1.3, { ol: 0, cast: false });
  box(interior, 1.6, 0.008, 0.55, toon(0xd6d0c0), -0.6, FY + 0.006, -0.15, { ol: 0, cast: false });

  // 后墙海报
  {
    const mk = (seed) => tex(256, 352, (g, w, h) => {
      const pal = ['#f6ecd6', '#ffeede', '#e8f2ec', '#fdeaf2'][seed % 4];
      const acc = ['#d97b32', '#2b847b', '#b23b36', '#4a6c9a'][seed % 4];
      g.fillStyle = pal; g.fillRect(0, 0, w, h);
      g.fillStyle = acc; g.fillRect(0, 0, w, 60);
      g.fillStyle = '#ffffff'; g.font = `bold 34px ${JP}`; g.textAlign = 'center';
      g.fillText(['新発売', 'お弁当', 'セール', '珈琲'][seed % 4], w / 2, 41);
      // 商品照片区（方角构图，避免圆形）
      g.fillStyle = acc; g.fillRect(26, 88, w - 52, 150);
      g.fillStyle = '#ffffff'; g.fillRect(48, 112, w - 96, 46);
      g.fillStyle = acc; g.fillRect(70, 170, w - 140, 44);
      g.fillStyle = '#3a3a3a';
      g.fillRect(26, 272, w - 52, 20); g.fillRect(26, 304, w - 96, 20);
      g.fillStyle = acc; g.fillRect(w - 90, 250, 64, 26);
    });
    for (let i = 0; i < 3; i++) {
      plane(interior, 0.6, 0.5, new THREE.MeshBasicMaterial({ map: mk(i) }), -2.35 + i * 0.95, 2.55, SZ0 + 0.09, { recv: false });
    }
    plane(interior, 0.5, 0.7, new THREE.MeshBasicMaterial({ map: mk(2) }), SX0 + 0.09, 1.95, -1.0, { ry: Math.PI / 2, recv: false });
    plane(interior, 0.5, 0.7, new THREE.MeshBasicMaterial({ map: mk(1) }), SX0 + 0.09, 1.95, -2.0, { ry: Math.PI / 2, recv: false });
  }

  /* --- 饮料冷柜 --- */
  function makeCooler(x, z, w) {
    const g = new THREE.Group(); g.position.set(x, FY, z); interior.add(g);
    const H = 2.15, D = 0.56, t = 0.05;
    const shell = toon(0xc6cfd8);
    // 骨架式柜体：侧板 + 顶/底板 + 发光背板
    box(g, t, H, D, shell, -w / 2 + t / 2, H / 2, 0, { ol: 0.014 });
    box(g, t, H, D, shell, w / 2 - t / 2, H / 2, 0, { ol: 0.014 });
    box(g, w, t, D, shell, 0, H - t / 2, 0, { ol: 0.014 });
    box(g, w, t, D, shell, 0, t / 2, 0, { ol: 0.014 });
    box(g, w - t * 2, H - t * 2, 0.03, basic(0xfff2dc), 0, H / 2, -D / 2 + 0.035, { ol: 0, cast: false });
    // 层板
    const lv = [0.40, 0.83, 1.26, 1.69];
    for (const y of lv) box(g, w - t * 2, 0.03, D - 0.09, toon(0xc2ccd6), 0, y, 0.03, { ol: 0, cast: false });
    // 饮料瓶陈列
    const perRow = Math.max(2, Math.floor((w - 0.14) / 0.115));
    instProducts(new THREE.CylinderGeometry(0.043, 0.043, 0.17, 10), perRow * 4, (d, c, i) => {
      const row = i % 4, col = Math.floor(i / 4);
      d.position.set(-(perRow - 1) * 0.0575 + col * 0.115, lv[row] + 0.015 + 0.086, 0.045);
      c.setHex(PROD_COLORS[(i * 7 + row) % PROD_COLORS.length]);
    }, { parent: g });
    // 玻璃门 + 门框
    plane(g, w - 0.06, H - 0.2, new THREE.MeshBasicMaterial({
      color: 0xdff0ff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide
    }), 0, H / 2, D / 2 - 0.012, { recv: false });
    box(g, 0.04, H - 0.2, 0.05, toon(0x9aa5b2), 0, H / 2, D / 2 + 0.002, { ol: 0, cast: false });
    box(g, w * 0.62, 0.05, 0.06, toon(0x9aa5b2), 0, 0.34, D / 2, { ol: 0, cast: false });
    return g;
  }
  makeCooler(-2.35, -3.18, 0.92);
  makeCooler(-1.4, -3.18, 0.92);
  makeCooler(-0.45, -3.18, 0.92);

  /* --- 货架（骨架式：侧板 + 背板 + 层板，正面商品可见） --- */
  function makeShelf(x, z, len, axis) {
    const g = new THREE.Group(); g.position.set(x, FY, z); interior.add(g);
    const inner = new THREE.Group();
    if (axis === 'z') inner.rotation.y = Math.PI / 2;
    g.add(inner);

    const L = len, D = 0.5, H = 1.32, t = 0.035;
    const limb = toon(0x8d8677, { emissive: 0x1c1409 });
    const bd = toon(0xe2dbcb);

    // 两侧立板
    box(inner, t * 1.8, H, D, limb, -L / 2 + t, H / 2, 0, { ol: 0.012 });
    box(inner, t * 1.8, H, D, limb, L / 2 - t, H / 2, 0, { ol: 0.012 });
    // 背板 / 顶板 / 底板
    box(inner, L - t * 2, H - t * 2, t, limb, 0, H / 2, -D / 2 + t / 2, { ol: 0 });
    box(inner, L, t, D, limb, 0, H - t / 2, 0, { ol: 0.012 });
    box(inner, L, t, D, limb, 0, t / 2, 0, { ol: 0.012 });

    const lv = [0.34, 0.70, 1.06];
    const gap = 0.162;
    const perRow = Math.max(2, Math.floor((L - 0.24) / gap));
    for (let r = 0; r < 3; r++) {
      const y = lv[r];
      // 层板
      box(inner, L - t * 2, t, D, bd, 0, y, 0, { ol: 0.01 });
      // 层板下方灯带（便利店货架照明）
      box(inner, (L - t * 2) * 0.94, 0.018, 0.055, basic(0xfff4de), 0, y - 0.026, D / 2 - 0.075, { ol: 0, cast: false });
      // 前缘价格标签条
      box(inner, (L - t * 2) * 0.9, 0.055, 0.014, toon(0xf4f1e8), 0, y - 0.048, D / 2 - 0.012, { ol: 0, cast: false });
      for (let k = 0; k < 5; k++) {
        box(inner, 0.09, 0.04, 0.016, toon(PROD_COLORS[(r * 5 + k) % PROD_COLORS.length]),
          -(L - t * 2) * 0.34 + k * (L - t * 2) * 0.17, y - 0.048, D / 2 - 0.004, { ol: 0, cast: false });
      }
      // 商品（整齐排列、色彩饱满）
      instProducts(new THREE.BoxGeometry(0.14, 0.26, 0.16), perRow, (dd, c, i) => {
        const along = -((perRow - 1) * gap) / 2 + i * gap;
        dd.position.set(along, y + t / 2 + 0.131, 0.095);
        dd.rotation.set(0, rnd(-0.08, 0.08), 0);
        dd.scale.set(1, rnd(0.9, 1.05), 1);
        c.setHex(PROD_COLORS[(i * 5 + r * 3 + 1) % PROD_COLORS.length]);
      }, { parent: inner });
    }
    return g;
  }
  makeShelf(-1.9, -1.0, 1.4, 'x');       // 前排（靠橱窗，正面商品可见）
  makeShelf(-1.425, -2.25, 2.05, 'x');   // 后排
  makeShelf(-2.78, -2.1, 1.4, 'z');      // 左墙零食架

  /* --- 便当 / 饭团区 --- */
  {
    const g = new THREE.Group(); g.position.set(-1.05, FY, 0.72); interior.add(g);
    box(g, 1.6, 0.9, 0.68, toon(0xd3d9df), 0, 0.45, 0, { ol: 0.016 });
    box(g, 1.5, 0.05, 0.58, basic(0xdff2ff), 0, 0.92, 0, { ol: 0, cast: false });
    // 柜体正面的推荐海报
    plane(g, 0.62, 0.42, texMat(256, 176, (gg, w, h) => {
      gg.fillStyle = '#b23b36'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#f8efe0'; gg.fillRect(10, 10, w - 20, h - 20);
      gg.fillStyle = '#3a3a3a'; gg.font = "bold 34px 'Yu Gothic','Meiryo',sans-serif";
      gg.textAlign = 'center'; gg.fillText('おすすめ', w / 2, 56);
      gg.fillStyle = '#d97b32'; gg.fillRect(28, 74, w - 56, 40);
      gg.fillStyle = '#3a3a3a'; gg.fillRect(28, 126, w - 90, 18);
    }), -0.42, 0.5, 0.35, { recv: false });
    plane(g, 0.62, 0.42, texMat(256, 176, (gg, w, h) => {
      gg.fillStyle = '#2b847b'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#f8efe0'; gg.fillRect(10, 10, w - 20, h - 20);
      gg.fillStyle = '#3a3a3a'; gg.font = "bold 34px 'Yu Gothic','Meiryo',sans-serif";
      gg.textAlign = 'center'; gg.fillText('新発売', w / 2, 56);
      gg.fillStyle = '#b23b36'; gg.fillRect(28, 74, w - 56, 40);
      gg.fillStyle = '#3a3a3a'; gg.fillRect(28, 126, w - 90, 18);
    }), 0.42, 0.5, 0.35, { recv: false });
    instProducts(new THREE.BoxGeometry(0.2, 0.055, 0.14), 24, (d, c, i) => {
      const r = Math.floor(i / 8), k = i % 8;
      d.position.set(-0.63 + k * 0.18, 0.955, -0.17 + r * 0.17);
      c.setHex(PROD_COLORS[(i * 3 + r) % PROD_COLORS.length]);
    }, { parent: g });
    instProducts(new THREE.CylinderGeometry(0.052, 0.052, 0.1, 12), 12, (d, c, i) => {
      const k = i % 6, r = Math.floor(i / 6);
      d.position.set(-0.5 + k * 0.19, 1.02, 0.16 + r * 0.15);
      d.rotation.set(0, rnd(0, 3.14), 0);
      c.setHex([0xf7f4ea, 0x3a3a3a, 0xf0e2c0, 0x8a9a6a][i % 4]);
    }, { parent: g });
    box(g, 0.42, 0.1, 0.02, basic(0xffe9b0), -0.5, 1.1, 0.35, { ol: 0, cast: false });
    box(g, 0.42, 0.1, 0.02, basic(0xffe9b0), 0.35, 1.1, 0.35, { ol: 0, cast: false });
  }

  /* --- 杂志架 --- */
  {
    const g = new THREE.Group(); g.position.set(-2.69, FY, 0.62);
    g.rotation.y = Math.PI / 2;
    interior.add(g);
    box(g, 1.0, 1.32, 0.34, toon(0x9d9687), 0, 0.66, 0, { ol: 0.016 });
    for (let i = 0; i < 3; i++) box(g, 1.03, 0.035, 0.36, toon(0x8b95a1), 0, 0.38 + i * 0.4, 0, { ol: 0.012 });
    for (let i = 0; i < 3; i++) box(g, 0.92, 0.06, 0.012, toon(0xf2efe6), 0, 0.355 + i * 0.4, 0.185, { ol: 0, cast: false });
    instProducts(new THREE.BoxGeometry(0.072, 0.4, 0.26), 30, (d, c, i) => {
      const row = Math.floor(i / 10), k = i % 10;
      d.position.set(-0.405 + k * 0.09, 0.6 - row * 0.4, 0.02);
      d.rotation.set(0.1, 0, 0);
      d.scale.set(1, rnd(0.88, 1.05), 1);
      c.setHex(PROD_COLORS[(i * 11 + row * 5) % PROD_COLORS.length]);
    }, { parent: g });
  }

  /* --- 冰淇淋冰柜 --- */
  {
    const g = new THREE.Group(); g.position.set(0.82, FY, -2.05); interior.add(g);
    // 敞开式冷藏箱：箱体 + 台面 + 顶部玻璃盖
    box(g, 0.66, 0.74, 1.2, toon(0xd0d7de), 0, 0.37, 0, { ol: 0.016 });
    box(g, 0.7, 0.035, 1.24, toon(0xe6ebef), 0, 0.757, 0, { ol: 0, cast: false });
    instProducts(new THREE.BoxGeometry(0.1, 0.07, 0.15), 30, (d, c, i) => {
      const r = Math.floor(i / 5), k = i % 5;
      d.position.set(-0.2 + k * 0.1, 0.812, -0.45 + r * 0.18);
      d.rotation.set(0, rnd(-0.25, 0.25), 0);
      c.setHex(PROD_COLORS[(i * 3) % PROD_COLORS.length]);
    }, { parent: g });
    plane(g, 0.62, 1.16, new THREE.MeshBasicMaterial({
      color: 0xcdeaff, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide
    }), 0, 0.9, 0, { rx: -Math.PI / 2, recv: false });
  }

  /* --- 收银台 / 后柜台 / 咖啡机 / 关东煮 --- */
  {
    // 主柜台
    const g = new THREE.Group(); g.position.set(-0.02, FY, -0.3); interior.add(g);
    box(g, 2.25, 0.95, 0.72, toon(0xd9cdb9), 0, 0.475, 0, { ol: 0.018 });
    box(g, 2.3, 0.05, 0.78, toon(0xbdae95), 0, 0.97, 0, { ol: 0.014 });
    box(g, 2.2, 0.5, 0.03, toon(0xc8bda8), 0, 0.3, 0.37, { ol: 0 });
    // 收银机
    box(g, 0.4, 0.22, 0.32, toon(0xf0ece2), 0.72, 1.11, -0.05, { ol: 0.014 });
    box(g, 0.3, 0.02, 0.05, basic(0x8fe6ff), 0.72, 1.23, -0.14, { ol: 0, cast: false });
    box(g, 0.14, 0.03, 0.1, toon(0xd8d2c4), 0.6, 1.0, -0.05, { ol: 0 });
    // 关东煮柜台（柜台左端）
    const o = new THREE.Group(); o.position.set(-0.78, 1.0, 0); g.add(o);
    box(o, 0.75, 0.22, 0.55, toon(0xe8e2d4), 0, 0.11, 0, { ol: 0.014 });
    box(o, 0.66, 0.06, 0.46, basic(0xffe0a8), 0, 0.24, 0, { ol: 0, cast: false });
    for (let i = 0; i < 5; i++) {
      box(o, 0.09, 0.09, 0.09, toon(0xd8a76a), -0.24 + i * 0.12, 0.3, -0.1 + (i % 2) * 0.18, { ol: 0 });
    }
    box(o, 0.7, 0.03, 0.5, toon(0xb9c2cb), 0, 0.26, 0, { ol: 0 });
    // 热气
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false })
      );
      s.position.set(rnd(-0.25, 0.25), rnd(0.3, 0.9), rnd(-0.15, 0.15));
      s.userData = { t: Math.random(), sp: rnd(0.25, 0.5), x0: s.position.x };
      o.add(s);
      anim.steam.push(s);
    }
    // 咖啡机（后柜台）
    const bc = new THREE.Group(); bc.position.set(0.2, FY, -1.02); interior.add(bc);
    box(bc, 1.9, 0.9, 0.5, toon(0xd2c9b8), 0, 0.45, 0, { ol: 0.016 });
    box(bc, 1.96, 0.05, 0.56, toon(0xbdae95), 0, 0.92, 0, { ol: 0.014 });
    box(bc, 0.4, 0.6, 0.42, toon(0x3a4450), 0.45, 1.22, 0, { ol: 0.015 });
    box(bc, 0.3, 0.16, 0.02, basic(0xffe0b0), 0.45, 1.38, 0.22, { ol: 0, cast: false });
    box(bc, 0.1, 0.12, 0.1, toon(0xf2efe6), 0.45, 1.02, 0.16, { ol: 0 });
    // 烟架
    box(bc, 0.9, 0.7, 0.12, toon(0xc9c4b6), -0.45, 1.28, -0.12, { ol: 0.014 });
    instProducts(new THREE.BoxGeometry(0.07, 0.11, 0.09), 40, (d, c, i) => {
      const r = Math.floor(i / 10), k = i % 10;
      d.position.set(-0.83 + k * 0.085, 1.05 + r * 0.14, -0.08);
      c.setHex(PROD_COLORS[(i * 3) % PROD_COLORS.length]);
    }, { parent: bc });
    // 菜单灯箱（后柜台上方）
    const menu = plane(interior, 1.7, 0.62, texMat(512, 200, (gg, w, h) => {
      gg.fillStyle = '#22303f'; gg.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        gg.fillStyle = ['#f6ead2', '#ffe9d2', '#e6f2ea'][i];
        gg.fillRect(20 + i * 165, 18, 150, h - 36);
        gg.fillStyle = ['#e0853c', '#2f8f86', '#c0453f'][i];
        gg.fillRect(30 + i * 165, 28, 60, 54);
        gg.fillStyle = '#4a4a4a';
        gg.fillRect(30 + i * 165, 92, 120, 12);
        gg.fillRect(30 + i * 165, 112, 90, 10);
        gg.fillRect(30 + i * 165, 130, 105, 10);
      }
    }), 0.2, 2.3, -1.29, { recv: false });
    anim.flicker.push(menu);
  }

  /* --- 后场门 --- */
  {
    const g = new THREE.Group(); g.position.set(0.68, FY, SZ0 - 0.03); interior.add(g);
    box(g, 0.85, 2.05, 0.06, toon(0x9aa4ae), 0, 1.025, 0, { ol: 0.016 });
    box(g, 0.3, 0.3, 0.02, basic(0xdfeaf5), 0, 1.6, 0.04, { ol: 0, cast: false });
    box(g, 0.06, 0.06, 0.06, M.metal, 0.32, 1.0, 0.05, { ol: 0 });
    box(g, 0.5, 0.14, 0.02, basic(0xffe9b0), 0, 2.18, 0.04, { ol: 0, cast: false });
  }

  /* --- 后场货架（饮料箱） --- */
  {
    const g = new THREE.Group(); g.position.set(-2.6, FY, -3.15); interior.add(g);
    instProducts(new THREE.BoxGeometry(0.28, 0.2, 0.22), 18, (d, c, i) => {
      const r = Math.floor(i / 3), k = i % 3;
      d.position.set((k - 1) * 0.3, 0.11 + r * 0.21, 0);
      c.setHex(PROD_COLORS[(i * 7) % PROD_COLORS.length]);
    }, { parent: g });
  }

  /* --- 促销堆头 / 购物篮 / 通道吊牌（补充色彩层次） --- */
  {
    // 靠窗促销堆头（阶梯式盒装陈列）
    const g = new THREE.Group(); g.position.set(-2.72, FY, -0.32); interior.add(g);
    box(g, 0.62, 0.34, 0.66, toon(0xd8d2c4), 0, 0.17, 0, { ol: 0.014 });
    for (let lv = 0; lv < 3; lv++) {
      const per = 3 - lv;
      instProducts(new THREE.BoxGeometry(0.17, 0.16, 0.19), per * 2, (d, c, i) => {
        const k = i % per, r = Math.floor(i / per);
        d.position.set(-(per - 1) * 0.09 + k * 0.18, 0.43 + lv * 0.165, -0.16 + r * 0.32);
        d.rotation.set(0, rnd(-0.08, 0.08), 0);
        c.setHex(PROD_COLORS[(lv * 5 + i * 3) % PROD_COLORS.length]);
      }, { parent: g });
    }
    plane(g, 0.32, 0.42, texMat(128, 168, (gg, w, h) => {
      gg.fillStyle = '#f6ead2'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#c0453f'; gg.fillRect(0, 0, w, 46);
      gg.fillStyle = '#ffffff'; gg.font = `bold 30px ${JP}`; gg.textAlign = 'center';
      gg.fillText('特価', w / 2, 33);
      gg.fillStyle = '#3a3a3a'; gg.fillRect(16, 66, w - 32, 12);
      gg.fillRect(16, 90, w - 52, 10); gg.fillRect(16, 112, w - 40, 10);
      gg.fillStyle = '#e0853c'; gg.fillRect(16, 136, 62, 22);
    }), 0, 0.56, 0.345, { recv: false });

    // 入口内侧堆叠购物篮
    const bk = new THREE.Group(); bk.position.set(0.74, FY, 0.24); interior.add(bk);
    const bc = [0x3f7a52, 0xc0453f, 0x3a5f8a];
    for (let i = 0; i < 3; i++) {
      box(bk, 0.4, 0.15, 0.28, toon(bc[i]), 0, 0.095 + i * 0.09, 0, { ol: 0.011 });
      box(bk, 0.34, 0.045, 0.22, toon(0x2a3038), 0, 0.18 + i * 0.09, 0, { ol: 0, cast: false });
    }

    // 通道上方促销吊牌
    const tags = ['SALE', 'NEW', 'おすすめ'];
    const tcol = ['#c0453f', '#2b847b', '#e0853c'];
    for (let k = 0; k < 3; k++) {
      const x = -2.0 + k * 0.55;
      box(interior, 0.018, 0.26, 0.018, M.metalDark, x, CEIL_Y - 0.16, -1.75, { ol: 0, cast: false });
      plane(interior, 0.32, 0.21, texMat(96, 64, (gg, w, h) => {
        gg.fillStyle = tcol[k]; gg.fillRect(0, 0, w, h);
        gg.fillStyle = '#ffffff'; gg.font = `bold 24px ${JP}`;
        gg.textAlign = 'center'; gg.textBaseline = 'middle';
        gg.fillText(tags[k], w / 2, h / 2);
      }), x, CEIL_Y - 0.42, -1.75, { recv: false });
    }
  }

  return anim;
}
