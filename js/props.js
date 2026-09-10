import {
  THREE, M, GLOW, toon, basic, box, cyl, plane, tex, texMat, rnd,
  WALK_Y, ROAD_Y
} from './core.js';
import { SX0, SX1, SZ0, SZ1, ALLEY_X0, FACADE_CX, BACK_Z } from './layout.js';

/* ---------- 柔和光斑贴图 ---------- */
let _glowTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  _glowTex = tex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0.0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    gr.addColorStop(0.65, 'rgba(255,255,255,0.14)');
    gr.addColorStop(1.0, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  return _glowTex;
}
/** 地面光池（灯光在湿地面上的漫反射） */
export function lightPool(parent, x, z, r, color, y = ROAD_Y + 0.02, op = 0.55) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(r * 2, r * 2),
    new THREE.MeshBasicMaterial({
      map: glowTex(), color, transparent: true, opacity: op,
      blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/* ---------- 积水（带抖动的倒影） ---------- */
const puddleUniforms = [];
export function makePuddle(parent, x, z, r, color, y) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  const base = new THREE.Mesh(
    new THREE.CircleGeometry(r, 22),
    new THREE.MeshBasicMaterial({ color: 0x121924, transparent: true, opacity: 0.72, depthWrite: false })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.002;
  g.add(base);
  const u = { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uSeed: { value: Math.random() * 10 } };
  puddleUniforms.push(u);
  const refl = new THREE.Mesh(
    new THREE.CircleGeometry(r * 1.02, 22),
    new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uColor; uniform float uSeed; varying vec2 vUv;
        void main(){
          vec2 p = vUv*2.0-1.0;
          float r = length(p);
          float mask = smoothstep(1.0, 0.25, r);
          float n = sin(p.y*15.0 + uTime*1.6 + uSeed)*0.5 + sin(p.x*10.0 - uTime*1.1 + uSeed*2.0)*0.5;
          float band = smoothstep(0.05, 0.95, n*0.5+0.5);
          float streak = smoothstep(1.0, 0.05, abs(p.x*1.05));
          float a = mask * (0.06 + 0.55*band*streak);
          gl_FragColor = vec4(uColor*(0.45 + 0.95*band), a);
        }`
    })
  );
  refl.rotation.x = -Math.PI / 2;
  refl.position.y = 0.004;
  refl.scale.set(1, rnd(0.75, 1.25), 1);
  g.add(refl);
  return g;
}
export function updatePuddles(t) { for (const u of puddleUniforms) u.uTime.value = t; }

/* ========================================================================== */
export function buildStreet(world) {
  const anim = { signals: [], lamps: [] };
  const puddles = [];

  /* ================= 邻楼外墙（小巷另一侧） ================= */
  {
    const g = new THREE.Group(); world.add(g);
    box(g, 0.38, 3.5, 6.2, toon(0x3b414d), FACADE_CX, 1.75, -1.9, { ol: 0.02 });
    box(g, 0.06, 0.12, 6.2, toon(0x4c5361), ALLEY_X0 + 0.03, 3.45, -1.9, { ol: 0 });
    // 邻楼窗（朝小巷）
    const winMat = [basic(0xffd9a0), basic(0x9fd0ff), basic(0xffcf8a), basic(0x2a3038)];
    let i = 0;
    for (let z = -4.3; z < 1.0; z += 1.35) {
      const y = [0.9, 1.9, 2.9][i % 3];
      const lit = winMat[(i * 3 + 1) % winMat.length];
      plane(g, 0.56, 0.66, lit, ALLEY_X0 - 0.01, y, z, { ry: -Math.PI / 2, recv: false });
      // 窗框
      box(g, 0.05, 0.72, 0.06, toon(0x2f333d), ALLEY_X0 + 0.02, y, z - 0.33, { ol: 0 });
      box(g, 0.05, 0.72, 0.06, toon(0x2f333d), ALLEY_X0 + 0.02, y, z + 0.33, { ol: 0 });
      box(g, 0.05, 0.06, 0.72, toon(0x2f333d), ALLEY_X0 + 0.02, y - 0.33, z, { ol: 0 });
      box(g, 0.05, 0.06, 0.72, toon(0x2f333d), ALLEY_X0 + 0.02, y + 0.33, z, { ol: 0 });
      box(g, 0.04, 0.68, 0.035, toon(0x393e47), ALLEY_X0 + 0.05, y, z, { ol: 0, cast: false });
      // 窗台滴水线
      box(g, 0.09, 0.05, 0.78, toon(0x5c636f), ALLEY_X0 + 0.02, y - 0.38, z, { ol: 0 });
      i++;
    }
    // 空调外机
    box(g, 0.42, 0.42, 0.36, M.metal, ALLEY_X0 - 0.0, 2.45, -3.2, { ol: 0.014 });
    box(g, 0.42, 0.42, 0.36, M.metal, ALLEY_X0 - 0.0, 2.45, -0.3, { ol: 0.014 });
    // 壁灯 + 光照
    box(g, 0.16, 0.16, 0.16, GLOW.warm, ALLEY_X0 - 0.14, 2.3, -1.35, { ol: 0, cast: false });
    box(g, 0.1, 0.1, 0.1, M.metalDark, ALLEY_X0 - 0.06, 2.3, -1.35, { ol: 0 });
    const al = new THREE.PointLight(0xffc98a, 14, 6, 2);
    al.position.set(ALLEY_X0 - 0.5, 2.15, -1.35);
    world.add(al);
    lightPool(world, ALLEY_X0 + 0.45, -1.35, 1.1, 0xffb974, WALK_Y + 0.02, 0.4);
    anim.lamps.push(al);
  }

  /* ================= 后院围墙 & 后场 ================= */
  {
    box(world, 5.86, 1.22, 0.14, M.concrete, -1.71, 0.61, BACK_Z, { ol: 0.016 });
    box(world, 5.9, 0.08, 0.2, toon(0x5a6270), -1.71, 1.26, BACK_Z, { ol: 0.012 });
    // 铁门
    box(world, 1.3, 1.1, 0.1, toon(0x3c4a55), 0.2, 0.55, BACK_Z + 0.02, { ol: 0.014 });
    for (let y = 0.12; y < 1.06; y += 0.16) box(world, 1.2, 0.04, 0.03, toon(0x525f6b), 0.2, y, BACK_Z + 0.09, { ol: 0 });
    // 后院深色地面
    box(world, 6.0, 0.02, 1.2, toon(0x2a2f3a), -1.85, WALK_Y + 0.008, -4.42, { ol: 0, cast: false });
    // 空调外机
    const mk = (x) => {
      const g = new THREE.Group(); g.position.set(x, WALK_Y, -3.98); world.add(g);
      box(g, 0.16, 0.42, 0.16, M.metalDark, -0.28, 0.21, 0.2, { ol: 0 });
      box(g, 0.16, 0.42, 0.16, M.metalDark, 0.28, 0.21, 0.2, { ol: 0 });
      box(g, 0.78, 0.52, 0.34, M.metal, 0, 0.68, 0, { ol: 0.016 });
      cyl(g, 0.2, 0.2, 0.05, M.metalDark, 0, 0.95, 0.02, { rx: Math.PI / 2, ol: 0.012, seg: 14 });
      box(g, 0.7, 0.04, 0.04, toon(0x6d7784), 0, 0.9, 0.18, { ol: 0 });
    };
    mk(-1.55); mk(-0.35);
    // 后门台阶 & 送货口
    box(world, 1.0, 0.1, 0.5, M.concrete, 0.68, WALK_Y + 0.05, -3.85, { ol: 0.012 });
    // 排水管
    cyl(world, 0.05, 0.05, 2.6, M.metalDark, 1.16, 1.3, -3.72, { ol: 0.012, seg: 8 });
    for (let y = 0.5; y < 2.6; y += 0.7) cyl(world, 0.07, 0.07, 0.05, M.metalDark, 1.16, y, -3.72, { ol: 0, seg: 8 });
    // 电表箱 / 通风格栅
    box(world, 0.36, 0.44, 0.12, toon(0x8d97a3), 1.0, 1.5, -3.7, { ol: 0.013 });
    box(world, 0.26, 0.2, 0.03, toon(0xd6dde4), 1.0, 1.56, -3.63, { ol: 0, cast: false });
    for (let x = -2.5; x < -1.4; x += 0.16) box(world, 0.09, 0.36, 0.05, toon(0x6e7883), x, 1.9, -3.66, { ol: 0, cast: false });
    // 后场提示牌
    box(world, 0.62, 0.2, 0.03, toon(0xe8e2d4), -0.5, 2.2, -3.65, { ol: 0.011 });
    box(world, 0.05, 0.05, 0.02, basic(0xc0453f), -0.5, 2.2, -3.62, { ol: 0, cast: false });
  }

  /* ================= 小巷 ================= */
  {
    // 巷道路面
    box(world, 1.62, 0.02, 6.2, toon(0x22262f), -3.81, WALK_Y + 0.008, -1.9, { ol: 0, cast: false });
    // 墙边排水明沟
    box(world, 0.2, 0.03, 6.0, toon(0x14181f), -3.08, WALK_Y + 0.012, -1.9, { ol: 0, cast: false });
    for (let z = -4.8; z < 1.1; z += 0.5) box(world, 0.16, 0.02, 0.34, M.metalDark, -3.08, WALK_Y + 0.035, z, { ol: 0, cast: false });
    // 限高杆
    box(world, 0.08, 1.95, 0.08, M.metal, -3.05, 0.98, 0.86, { ol: 0.012 });
    box(world, 0.08, 1.95, 0.08, M.metal, -4.55, 0.98, 0.86, { ol: 0.012 });
    cyl(world, 0.055, 0.055, 1.7, toon(0xd8b24a), -3.8, 1.78, 0.86, { rz: Math.PI / 2, ol: 0.012, seg: 10 });
    box(world, 0.3, 0.24, 0.02, basic(0xffe9b0), -3.8, 1.78, 0.95, { ol: 0, cast: false });
    // 巷内垃圾桶
    {
      const g = new THREE.Group(); g.position.set(-4.28, WALK_Y, -3.3); world.add(g);
      cyl(g, 0.24, 0.2, 0.9, M.green, 0, 0.45, 0, { ol: 0.016, seg: 14 });
      cyl(g, 0.26, 0.26, 0.07, toon(0x2f5d40), 0, 0.93, 0, { ol: 0.014, seg: 14 });
    }
    // 自行车
    {
      const b = new THREE.Group();
      b.position.set(-3.42, WALK_Y, -1.15);
      b.rotation.set(0, 0.08, -0.11);
      world.add(b);
      const wheelMat = toon(0x2b2f36);
      const rimMat = toon(0xb9c0c8);
      for (const zz of [-0.5, 0.5]) {
        cyl(b, 0.27, 0.27, 0.05, wheelMat, 0, 0.27, zz, { rx: 0, rz: Math.PI / 2, ol: 0.012, seg: 18 });
        cyl(b, 0.235, 0.235, 0.055, rimMat, 0, 0.27, zz, { rz: Math.PI / 2, ol: 0, seg: 18 });
        cyl(b, 0.03, 0.03, 0.07, M.metal, 0, 0.27, zz, { rz: Math.PI / 2, ol: 0, seg: 8 });
      }
      const fm = toon(0x37506b);
      // 车架
      cyl(b, 0.028, 0.028, 0.72, fm, 0, 0.45, 0.08, { rx: 1.15, ol: 0, seg: 8 });
      cyl(b, 0.028, 0.028, 0.62, fm, 0, 0.52, -0.28, { rx: 0.55, ol: 0, seg: 8 });
      cyl(b, 0.028, 0.028, 0.5, fm, 0, 0.62, -0.15, { rx: 1.45, ol: 0, seg: 8 });
      cyl(b, 0.028, 0.028, 0.42, fm, 0, 0.72, 0.34, { rx: 0.42, ol: 0, seg: 8 });
      cyl(b, 0.026, 0.026, 0.16, M.metalDark, 0, 0.86, 0.44, { ol: 0, seg: 8 });
      // 车把
      cyl(b, 0.022, 0.022, 0.52, M.metalDark, 0, 0.9, 0.42, { rz: Math.PI / 2, ol: 0, seg: 8 });
      // 座垫
      box(b, 0.1, 0.05, 0.24, toon(0x2f3339), 0, 0.83, -0.3, { ol: 0.01 });
      // 车篮
      box(b, 0.28, 0.2, 0.24, toon(0xa88a5e), 0, 0.72, 0.6, { ol: 0.012 });
      box(b, 0.26, 0.02, 0.22, toon(0x8d7350), 0, 0.82, 0.6, { ol: 0 });
      // 撑脚
      cyl(b, 0.02, 0.02, 0.3, M.metalDark, 0.12, 0.15, -0.16, { rx: 0.3, ol: 0, seg: 6 });
    }
    // 巷内积水
    puddles.push(makePuddle(world, -3.85, -2.2, 0.5, 0xffb877, WALK_Y + 0.01));
    puddles.push(makePuddle(world, -3.6, 0.35, 0.42, 0x9fd0ff, WALK_Y + 0.01));
    puddles.push(makePuddle(world, -4.2, -4.3, 0.45, 0xffb877, WALK_Y + 0.01));
  }

  /* ================= 自动贩卖机 ================= */
  {
    const frontTex = tex(256, 512, (g, w, h) => {
      g.fillStyle = '#20303c'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f2f6fa'; g.fillRect(12, 12, w - 24, 96);
      g.fillStyle = '#c0453f'; g.fillRect(12, 12, w - 24, 26);
      g.fillStyle = '#ffffff';
      g.font = `bold 34px 'Yu Gothic','Meiryo','MS Gothic',sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('ドリンク', w / 2, 66);
      // 商品陈列
      const cols = ['#e4736a', '#6fa8d8', '#f0c869', '#8cc08a', '#d58fc0', '#f2a35c', '#7fc7c0'];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          g.fillStyle = cols[(r * 6 + c) % cols.length];
          const x = 20 + c * 36, y = 130 + r * 120;
          g.fillRect(x, y, 26, 74);
          g.fillStyle = 'rgba(255,255,255,0.75)';
          g.fillRect(x + 4, y + 10, 18, 12);
        }
        g.fillStyle = 'rgba(140,200,255,0.25)';
        g.fillRect(12, 126 + r * 120, w - 24, 86);
      }
      // 取物口
      g.fillStyle = '#161c22'; g.fillRect(30, h - 96, w - 60, 60);
      g.fillStyle = '#3a444e'; g.fillRect(30, h - 100, w - 60, 10);
    });
    const mk = (z, accent) => {
      const g = new THREE.Group();
      g.position.set(1.9, WALK_Y, z);
      world.add(g);
      // 机身（深度沿 x，正面朝 +x）
      box(g, 0.72, 1.9, 0.62, toon(0x2b3946), 0, 0.95, 0, { ol: 0.018 });
      plane(g, 0.56, 1.72, new THREE.MeshBasicMaterial({ map: frontTex }), 0.37, 1.0, 0, { ry: Math.PI / 2, recv: false });
      // 顶部灯箱
      box(g, 0.6, 0.2, 0.58, GLOW.cool, 0.06, 1.86, 0, { ol: 0, cast: false });
      // 侧面彩色条
      box(g, 0.74, 0.62, 0.05, toon(accent), 0.02, 0.82, -0.32, { ol: 0 });
      box(g, 0.74, 0.62, 0.05, toon(accent), 0.02, 0.82, 0.32, { ol: 0 });
      box(g, 0.72, 0.06, 0.04, toon(0xd8dde3), 0.02, 1.45, -0.32, { ol: 0 });
      box(g, 0.72, 0.06, 0.04, toon(0xd8dde3), 0.02, 1.45, 0.32, { ol: 0 });
      // 底部
      box(g, 0.74, 0.1, 0.64, M.metalDark, 0.02, 0.05, 0, { ol: 0.012 });
      // 取物口
      box(g, 0.06, 0.3, 0.4, toon(0x14181e), 0.37, 0.42, 0, { ol: 0 });
      return g;
    };
    mk(-2.75, 0xc0453f);
    mk(-3.5, 0x3a5f8a);
    const vl = new THREE.PointLight(0xbfe0ff, 18, 6, 2);
    vl.position.set(2.4, 1.5, -3.1);
    world.add(vl);
    lightPool(world, 2.9, -3.1, 1.5, 0x8fc4ff, ROAD_Y + 0.02, 0.5);
    anim.lamps.push(vl);
  }

  /* ================= 路灯 ================= */
  {
    const g = new THREE.Group(); g.position.set(2.18, WALK_Y, 0.9); world.add(g);
    box(g, 0.3, 0.06, 0.3, M.metalDark, 0, 0.03, 0, { ol: 0.012 });
    cyl(g, 0.075, 0.1, 4.1, toon(0x3d4653), 0, 2.05, 0, { ol: 0.016, seg: 12 });
    cyl(g, 0.07, 0.07, 0.95, toon(0x3d4653), 0.42, 4.2, 0, { rz: Math.PI / 2, ol: 0.014, seg: 10 });
    cyl(g, 0.07, 0.07, 0.16, toon(0x3d4653), 0.86, 4.05, 0, { ol: 0.012, seg: 10 });
    // 灯罩
    box(g, 0.5, 0.16, 0.34, toon(0x4a5462), 0.86, 3.94, 0, { ol: 0.016 });
    const lamp = box(g, 0.44, 0.06, 0.28, GLOW.warm, 0.86, 3.85, 0, { ol: 0, cast: false });
    // 光锥
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3.6, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffcf92, transparent: true, opacity: 0.085, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    cone.position.set(0.86, 2.0, 0);
    g.add(cone);
    const pl = new THREE.PointLight(0xffc98a, 34, 12, 2);
    pl.position.set(3.04, 3.8, 0.9);
    world.add(pl);
    lightPool(world, 3.04, 0.9, 2.4, 0xffb974, ROAD_Y + 0.022, 0.55);
    anim.lamps.push(pl);
    anim.lampMat = lamp.material;
  }

  /* ================= 电线杆 + 电线 + 路牌 ================= */
  {
    const PX = 2.3, PZ = -2.15;
    const g = new THREE.Group(); g.position.set(PX, WALK_Y, PZ); world.add(g);
    cyl(g, 0.11, 0.15, 6.0, toon(0x6b7280), 0, 3.0, 0, { ol: 0.018, seg: 12 });
    // 横担
    box(g, 0.12, 0.1, 1.5, M.metalDark, -0.05, 5.35, 0, { ol: 0.012 });
    box(g, 0.12, 0.1, 1.2, M.metalDark, -0.05, 4.95, 0, { ol: 0.012 });
    // 绝缘子
    for (const zz of [-0.62, -0.31, 0.31, 0.62]) cyl(g, 0.05, 0.05, 0.12, toon(0x9aa4b0), -0.05, 5.48, zz, { ol: 0, seg: 8 });
    for (const zz of [-0.45, 0.0, 0.45]) cyl(g, 0.05, 0.05, 0.12, toon(0x9aa4b0), -0.05, 5.08, zz, { ol: 0, seg: 8 });
    // 变压器
    cyl(g, 0.2, 0.2, 0.55, toon(0x6f7885), -0.2, 4.3, 0, { ol: 0.014, seg: 12 });
    // 路牌
    const sign1 = texMat(256, 128, (gg, w, h) => {
      gg.fillStyle = '#2f6f9a'; gg.fillRect(0, 0, w, h);
      gg.strokeStyle = '#eef4fa'; gg.lineWidth = 8; gg.strokeRect(6, 6, w - 12, h - 12);
      gg.fillStyle = '#ffffff'; gg.font = `bold 44px 'Yu Gothic','Meiryo','MS Gothic',sans-serif`;
      gg.textAlign = 'center'; gg.textBaseline = 'middle';
      gg.fillText('桜町 １丁目', w / 2, h / 2 - 4);
      gg.font = `20px 'Yu Gothic','Meiryo',sans-serif`;
      gg.fillText('SAKURACHO 1-CHOME', w / 2, h - 26);
    });
    const sign2 = texMat(256, 128, (gg, w, h) => {
      gg.fillStyle = '#f2f4f6'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#2f6f9a'; gg.fillRect(0, 0, w, 26);
      gg.fillStyle = '#33404d'; gg.font = `bold 40px 'Yu Gothic','Meiryo','MS Gothic',sans-serif`;
      gg.textAlign = 'center'; gg.textBaseline = 'middle';
      gg.fillText('この先 踏切', w / 2, h / 2 + 14);
    });
    plane(g, 0.62, 0.31, sign1, 0.14, 3.55, 0.16, { ry: Math.PI / 2, recv: false });
    plane(g, 0.62, 0.31, sign2, 0.14, 3.18, -0.16, { ry: Math.PI / 2, recv: false });
    box(g, 0.03, 0.66, 0.02, M.metalDark, 0.1, 3.38, 0, { ol: 0 });

    // 电线
    const wireMat = toon(0x1a1f27);
    const mkWire = (x1, y1, z1, x2, y2, z2, sag) => {
      const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
      const mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= sag;
      const q1 = a.clone().lerp(b, 0.25); q1.y -= sag * 0.8;
      const q2 = a.clone().lerp(b, 0.75); q2.y -= sag * 0.8;
      const curve = new THREE.CatmullRomCurve3([a, q1, mid, q2, b]);
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 26, 0.018, 5, false), wireMat);
      m.castShadow = false;
      world.add(m);
    };
    mkWire(PX - 0.05, 5.5, PZ - 5.2, PX - 0.05, 5.5, PZ + 5.2, 0.55);
    mkWire(PX - 0.05, 5.5, PZ - 5.2, PX - 0.05, 5.5, PZ + 5.2, 0.7);
    mkWire(PX - 0.05, 5.1, PZ - 5.2, PX - 0.05, 5.1, PZ + 5.2, 0.6);
    mkWire(PX - 0.05, 5.1, PZ + 0.1, PX - 0.05, 5.1, PZ + 5.2, 0.35);
    mkWire(PX - 0.05, 5.45, PZ + 0.2, SX1 + 0.2, 3.15, SZ1 - 0.3, 0.45);   // 引入店铺
    mkWire(PX - 0.05, 5.05, PZ - 0.2, SX1 + 0.15, 3.05, -1.0, 0.4);
  }

  /* ================= 街角护栏 ================= */
  {
    const railMat = toon(0xb9c1cb);
    const mkRail = (x, z, len, axis) => {
      const g = new THREE.Group(); g.position.set(x, WALK_Y, z); world.add(g);
      const w = axis === 'x' ? len : 0.08, d = axis === 'x' ? 0.08 : len;
      box(g, w, 0.08, d, railMat, 0, 0.78, 0, { ol: 0.014 });
      box(g, w, 0.08, d, railMat, 0, 0.45, 0, { ol: 0.014 });
      const n = Math.max(2, Math.round(len / 0.45));
      for (let i = 0; i <= n; i++) {
        const t = -len / 2 + i * (len / n);
        const px = axis === 'x' ? t : 0, pz = axis === 'x' ? 0 : t;
        box(g, 0.07, 0.82, 0.07, railMat, px, 0.41, pz, { ol: 0.012 });
      }
    };
    mkRail(2.16, 2.34, 0.52, 'x');
    mkRail(2.34, 2.16, 0.52, 'z');
  }

  /* ================= 垃圾桶 & 雨伞架 ================= */
  {
    const mkBin = (x, z, col) => {
      const g = new THREE.Group(); g.position.set(x, WALK_Y, z); world.add(g);
      cyl(g, 0.17, 0.14, 0.62, col, 0, 0.31, 0, { ol: 0.014, seg: 16 });
      cyl(g, 0.185, 0.185, 0.06, toon(0x2c333b), 0, 0.65, 0, { ol: 0.012, seg: 16 });
      box(g, 0.22, 0.08, 0.02, basic(0xe8eef4), 0, 0.42, 0.16, { ol: 0, cast: false });
      cyl(g, 0.015, 0.015, 0.16, M.metalDark, 0, 0.71, 0, { ol: 0, seg: 6 });
    };
    mkBin(2.06, 1.26, M.green);
    mkBin(2.06, 1.72, M.blue);
    // 雨伞架
    {
      const g = new THREE.Group(); g.position.set(1.72, WALK_Y, 0.72); world.add(g);
      box(g, 0.26, 0.05, 0.24, M.metalDark, 0, 0.025, 0, { ol: 0.012 });
      for (const sx of [-0.1, 0.1]) box(g, 0.04, 0.5, 0.04, M.metalDark, sx, 0.27, 0, { ol: 0.009 });
      box(g, 0.26, 0.05, 0.24, M.metalDark, 0, 0.52, 0, { ol: 0.012 });
      box(g, 0.24, 0.02, 0.22, toon(0x2b333c), 0, 0.14, 0, { ol: 0, cast: false });
      const umb = [0x3a5f8a, 0xc0453f, 0x4a7a52];
      for (let i = 0; i < 3; i++) {
        const u = new THREE.Group();
        u.position.set(-0.07 + i * 0.07, 0, 0.01 * i);
        u.rotation.z = (i - 1) * 0.1;
        g.add(u);
        cyl(u, 0.022, 0.03, 0.72, toon(umb[i]), 0, 0.4, 0, { ol: 0.01, seg: 8 });
        cyl(u, 0.009, 0.009, 0.16, M.metalDark, 0, 0.8, 0, { ol: 0, seg: 6 });
      }
    }
  }

  /* ================= 立式公告栏 ================= */
  {
    const g = new THREE.Group(); g.position.set(1.92, WALK_Y, 0.62); g.rotation.y = Math.PI / 2; world.add(g);
    box(g, 0.06, 0.75, 0.06, M.metalDark, -0.4, 0.38, 0, { ol: 0.01 });
    box(g, 0.06, 0.75, 0.06, M.metalDark, 0.4, 0.38, 0, { ol: 0.01 });
    box(g, 0.95, 0.06, 0.1, M.metalDark, 0, 0.78, 0, { ol: 0.012 });
    const board = texMat(512, 384, (gg, w, h) => {
      gg.fillStyle = '#d9cdb4'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#8a6a4a'; gg.fillRect(0, 0, w, 14); gg.fillRect(0, h - 14, w, 14);
      gg.fillRect(0, 0, 14, h); gg.fillRect(w - 14, 0, 14, h);
      const cols = ['#f4e7c8', '#ffe9d2', '#e6f2ea', '#fde6ef', '#e8f0f8', '#fdf3d8'];
      for (let i = 0; i < 6; i++) {
        const x = 34 + (i % 3) * 152, y = 34 + Math.floor(i / 3) * 168;
        gg.fillStyle = cols[i]; gg.fillRect(x, y, 132, 148);
        gg.fillStyle = ['#e0853c', '#2f8f86', '#c0453f', '#5b7fb5', '#7a9a5b', '#b57fc0'][i];
        gg.fillRect(x + 12, y + 12, 108, 52);
        gg.fillStyle = '#5a5a5a';
        gg.fillRect(x + 12, y + 76, 96, 9);
        gg.fillRect(x + 12, y + 94, 108, 9);
        gg.fillRect(x + 12, y + 112, 74, 9);
      }
    });
    plane(g, 0.95, 0.72, board, 0, 1.14, 0.03, { recv: false });
    box(g, 1.02, 0.82, 0.05, toon(0x6b5a45), 0, 1.14, -0.01, { ol: 0.014 });
  }

  /* ================= 立杆招牌（24H） ================= */
  {
    const g = new THREE.Group(); g.position.set(-2.2, WALK_Y, 2.12); world.add(g);
    cyl(g, 0.055, 0.065, 3.9, M.metalDark, 0, 1.95, 0, { ol: 0.014, seg: 10 });
    box(g, 0.34, 0.28, 1.02, GLOW.cool, 0, 2.62, 0, { ol: 0, cast: false });
    box(g, 0.62, 1.0, 0.1, toon(0x243244), 0, 3.35, 0, { ol: 0.016 });
    plane(g, 0.56, 0.94, texMat(256, 440, (gg, w, h) => {
      gg.fillStyle = '#f7f3ea'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#2f8f86'; gg.fillRect(0, 0, w, 62);
      gg.fillStyle = '#c0453f'; gg.fillRect(0, 68, w, 16);
      gg.fillStyle = '#1d2b3a';
      gg.font = `bold 54px 'Yu Gothic','Meiryo','MS Gothic',sans-serif`;
      gg.textAlign = 'center'; gg.textBaseline = 'middle';
      gg.fillText('２４', w / 2, h * 0.42);
      gg.fillText('時間', w / 2, h * 0.68);
    }), 0, 3.35, 0.06, { recv: false });
  }

  /* ================= 便利店入口处的立牌 ================= */
  {
    const g = new THREE.Group(); g.position.set(-2.72, WALK_Y, 1.92); g.rotation.y = -0.32; world.add(g);
    box(g, 0.02, 0.86, 0.02, M.metalDark, -0.22, 0.43, 0.16, { ol: 0 });
    box(g, 0.02, 0.86, 0.02, M.metalDark, 0.22, 0.43, -0.16, { ol: 0 });
    const p = plane(g, 0.62, 0.86, texMat(256, 352, (gg, w, h) => {
      gg.fillStyle = '#ffe9c0'; gg.fillRect(0, 0, w, h);
      gg.fillStyle = '#c0453f'; gg.fillRect(0, 0, w, 62);
      gg.fillStyle = '#ffffff';
      gg.font = `bold 40px 'Yu Gothic','Meiryo','MS Gothic',sans-serif`;
      gg.textAlign = 'center'; gg.textBaseline = 'middle';
      gg.fillText('お弁当', w / 2, 34);
      gg.fillStyle = '#e0853c';
      gg.beginPath(); gg.arc(w / 2, h * 0.55, 62, 0, Math.PI * 2); gg.fill();
      gg.fillStyle = '#f6ead2';
      gg.beginPath(); gg.arc(w / 2, h * 0.55, 44, 0, Math.PI * 2); gg.fill();
      gg.fillStyle = '#c0453f';
      gg.font = `bold 44px 'Yu Gothic','Meiryo',sans-serif`;
      gg.fillText('￥４９８', w / 2, h - 42);
    }), 0, 0.86, 0.02, { recv: false });
    box(g, 0.66, 0.9, 0.03, toon(0x5a4a3a), 0, 0.86, -0.01, { ol: 0.013 });
  }

  /* ================= 远处交通信号灯 ================= */
  {
    const g = new THREE.Group(); g.position.set(-4.5, ROAD_Y, 4.5); world.add(g);
    cyl(g, 0.07, 0.09, 3.05, toon(0x3d4653), 0, 1.52, 0, { ol: 0.014, seg: 12 });
    // 悬臂伸向车道
    cyl(g, 0.055, 0.055, 1.15, toon(0x3d4653), 0.58, 2.95, 0, { rz: Math.PI / 2, ol: 0.012, seg: 10 });
    cyl(g, 0.05, 0.05, 0.2, toon(0x3d4653), 1.12, 2.86, 0, { ol: 0.01, seg: 8 });

    const mkHead = (x, ry, heads) => {
      const h = new THREE.Group(); h.position.set(x, 0, 0); h.rotation.y = ry; g.add(h);
      box(h, 0.24, 0.68, 0.2, toon(0x242a33), 0, 2.62, 0, { ol: 0.013 });
      box(h, 0.26, 0.05, 0.22, toon(0x242a33), 0, 2.97, 0, { ol: 0.011 });
      const lights = [];
      const cols = [0xff4433, 0xffcc33, 0x44dd66];
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), basic(cols[i]));
        m.position.set(0, 2.82 - i * 0.19, 0.12);
        h.add(m);
        const o = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), basic(0x2a3038));
        o.position.copy(m.position);
        o.visible = false;
        h.add(o);
        lights.push({ on: m, off: o });
      }
      anim.signals.push(lights);
    };
    mkHead(1.16, 0, 0);               // 车行灯（朝 +z）
    // 行人信号
    box(g, 0.18, 0.4, 0.14, toon(0x242a33), 0.0, 1.75, 0.06, { ol: 0.012 });
    box(g, 0.11, 0.12, 0.02, basic(0xff5544), 0, 1.86, 0.14, { ol: 0, cast: false });
    box(g, 0.11, 0.12, 0.02, basic(0x44dd66), 0, 1.62, 0.14, { ol: 0, cast: false });

    const tl = new THREE.PointLight(0xff5544, 8, 5, 2);
    tl.position.set(1.16, 2.82, 0.4);
    g.add(tl);
    anim.signalLight = tl;
    lightPool(world, -4.5, 4.6, 1.1, 0xff6655, ROAD_Y + 0.02, 0.3);
  }

  /* ================= 积水池 ================= */
  {
    const P = (x, z, r, c) => puddles.push(makePuddle(world, x, z, r, c, ROAD_Y + 0.012));
    P(-2.7, 4.25, 0.95, 0xffc08a);
    P(1.15, 3.25, 0.75, 0xbfe0ff);
    P(3.7, 4.05, 0.85, 0xffb877);
    P(4.25, -0.7, 0.7, 0x9fd0ff);
    P(2.95, 1.75, 0.5, 0xffc08a);
    P(-4.1, 3.6, 0.6, 0x9fd0ff);
    P(-1.15, 1.95, 0.42, 0xffd0a0);   // 人行道
    P(1.95, 0.3, 0.38, 0xbfe0ff);
    P(-2.1, -4.4, 0.55, 0xffb877);    // 后院
  }

  /* ================= 路面灯光倒影条 ================= */
  {
    lightPool(world, 0.9, 1.75, 1.5, 0xffc98a, WALK_Y + 0.02, 0.5);
    lightPool(world, -1.3, 1.8, 1.9, 0xffc07a, WALK_Y + 0.02, 0.42);
    lightPool(world, 1.85, -2.4, 1.2, 0xffc98a, WALK_Y + 0.02, 0.3);
    lightPool(world, -1.0, 2.05, 0.9, 0xffc98a, WALK_Y + 0.02, 0.3);
    lightPool(world, -0.6, 3.6, 2.6, 0xffdca8, ROAD_Y + 0.02, 0.32);
    lightPool(world, 3.3, 3.3, 1.8, 0x7fb0e0, ROAD_Y + 0.02, 0.22);
  }

  return anim;
}
