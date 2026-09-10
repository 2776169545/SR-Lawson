import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';

export { THREE };

/* 场景尺度常量 */
export const ROAD_Y = 0.0;    // 车道面
export const WALK_Y = 0.15;   // 人行道面
export const FLOOR_Y = 0.23;  // 店内地面
export const CEIL_Y = 2.85;   // 店内吊顶

export const clock = new THREE.Clock();

/* ---------- 渲染器 ---------- */
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

/* ---------- 场景 & 夜空 ---------- */
export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1020, 0.014);

{
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(80, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vP;
        void main(){
          float h = clamp(normalize(vP).y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(vec3(0.075,0.10,0.155), vec3(0.028,0.040,0.075), pow(h, 0.75));
          gl_FragColor = vec4(col, 1.0);
        }`
    })
  );
  sky.frustumCulled = false;
  scene.add(sky);
}

/* ---------- 相机 & 控制 ---------- */
export const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(9.8, 7.6, 11.6);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.6;
controls.minDistance = 6.5;
controls.maxDistance = 34;
controls.minPolarAngle = 0.20;
controls.maxPolarAngle = 1.45;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.30;
controls.addEventListener('start', () => { controls.autoRotate = false; });

/* ---------- 卡通渐变 ---------- */
export const gradientMap = (() => {
  const d = new Uint8Array([70, 132, 198, 255]);
  const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

export function toon(color, opt = {}) {
  return new THREE.MeshToonMaterial(Object.assign({ color, gradientMap }, opt));
}
export function basic(color, opt = {}) {
  return new THREE.MeshBasicMaterial(Object.assign({ color }, opt));
}

/* ---------- 轮廓线 ---------- */
const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x111620, side: THREE.BackSide, fog: false });
export function outline(mesh, t = 0.016, size) {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const s = size || g.boundingBox.getSize(new THREE.Vector3());
  // 每侧最多外扩 min(t, 8% 尺寸)，避免细长物体被轮廓线吞没
  const ex = (d) => 1 + Math.min(2 * t, 0.16 * d) / Math.max(d, 0.02);
  const o = new THREE.Mesh(g, OUTLINE_MAT);
  o.scale.set(ex(s.x), ex(s.y), ex(s.z));
  o.renderOrder = -1;
  o.castShadow = false;
  o.receiveShadow = false;
  mesh.add(o);
  return mesh;
}

/* ---------- 几何助手 ---------- */
export function box(parent, w, h, d, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (o.rx || o.ry || o.rz) m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  parent.add(m);
  if (o.ol !== 0) outline(m, o.ol || 0.015);
  return m;
}
export function cyl(parent, rt, rb, h, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 14), mat);
  m.position.set(x, y, z);
  if (o.rx || o.ry || o.rz) m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  parent.add(m);
  if (o.ol !== 0) outline(m, o.ol || 0.015);
  return m;
}
export function plane(parent, w, h, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  if (o.rx || o.ry || o.rz) m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
  m.receiveShadow = o.recv !== false;
  m.castShadow = o.cast === true;
  parent.add(m);
  return m;
}
// 切角平板（切角位于 +x/+z 角）
export function chamferSlab(parent, x0, x1, z0, z1, c, h, mat, y, o = {}) {
  const w = x1 - x0, d = z1 - z0;
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(w - c, 0); s.lineTo(w, c); s.lineTo(w, d); s.lineTo(0, d); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(-w / 2, -h / 2, d / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0 + x1) / 2, y + h / 2, (z0 + z1) / 2);
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  parent.add(m);
  if (o.ol !== 0) outline(m, o.ol || 0.015, new THREE.Vector3(w, h, d));
  return m;
}

/* ---------- 画布贴图 ---------- */
export const JP = "'Yu Gothic','Hiragino Sans','Meiryo','MS Gothic','Noto Sans JP',sans-serif";
export function tex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function texMat(w, h, draw, opt = {}) {
  return new THREE.MeshBasicMaterial(Object.assign({ map: tex(w, h, draw) }, opt));
}

export const rnd = (a, b) => a + Math.random() * (b - a);
export const PROD_COLORS = [
  0xcf3f36, 0x2f74bd, 0xe3a716, 0x3d9048, 0xc24a9a, 0xd96f17,
  0x1c9a93, 0x8a55be, 0xe8dfc8, 0x5d7898, 0xb03050, 0x2b6a8a
];

/* 商品专用卡通渐变（暗面更亮，保持包装色彩饱和醒目） */
const PROD_GRAD = (() => {
  const d = new Uint8Array([192, 222, 246, 255]);
  const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

/* ---------- 实例化商品 ---------- */
export function instProducts(geo, count, place, opt = {}) {
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: PROD_GRAD });
  const im = new THREE.InstancedMesh(geo, mat, count);
  const d = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1);
    place(d, c, i);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
    im.setColorAt(i, c);
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = false;
  im.receiveShadow = false;
  if (opt.parent) opt.parent.add(im);
  return im;
}

/* ---------- 玻璃（雨水沿玻璃滑落） ---------- */
export const glassUniforms = { uTime: { value: 0 } };
export const glassMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  uniforms: glassUniforms,
  vertexShader: `
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position,1.0);
      vN = normalize(mat3(modelMatrix) * normal);
      vV = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: `
    uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    float h11(float p){ return fract(sin(p*127.1)*43758.5453); }
    float layer(vec2 uv, float t, float sc, float sp){
      vec2 g = uv * vec2(sc, sc*0.55);
      float id = floor(g.x);
      float r = h11(id), r2 = h11(id+7.3);
      float y = fract(g.y + t*sp*(0.5+0.8*r) + r2);
      float w = 0.05 + 0.05*r;
      float dx = abs(fract(g.x) - 0.5);
      float d = smoothstep(w, 0.0, dx);
      float head = smoothstep(0.84, 1.0, 1.0 - y);
      float tail = smoothstep(0.0, 0.7, 1.0 - y) * 0.28;
      return d * (head + tail);
    }
    void main(){
      float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
      float t = uTime;
      float d = layer(vUv, t, 7.5, 0.13) + layer(vUv*1.61 + 0.37, t, 4.8, 0.095) * 0.8;
      d = clamp(d, 0.0, 1.4);
      vec3 col = vec3(0.80,0.90,1.0) * (0.18 + 1.05*d) + vec3(0.07,0.12,0.22)*fres;
      float a = 0.012 + 0.26*d + 0.07*fres;
      gl_FragColor = vec4(col, clamp(a, 0.0, 0.52));
    }`
});

/* ---------- 材质色板 ---------- */
export const M = {
  plinth: toon(0x2b3142),
  plinthTop: toon(0x232838),
  plinthLip: toon(0x161a26),
  plinthEdge: toon(0x3a4160),
  road: toon(0x252a35),
  walk: toon(0x474f5d),
  walkDark: toon(0x343c4b),
  curb: toon(0x6f7887),
  line: toon(0xb6bfcb),
  lineWet: toon(0x8b9caf),
  wall: toon(0xd5cec0),
  wallSide: toon(0xc5bdaf),
  wallDark: toon(0x35404d),
  fascia: toon(0x2f6f66),
  metal: toon(0x9aa5b2),
  metalDark: toon(0x424b58),
  black: toon(0x232833),
  frame: toon(0x5a6673),
  floorIn: toon(0xd2ccbc, { emissive: 0x4a3820 }),
  ceil: toon(0xe6ddcc, { emissive: 0x3a2a12 }),
  concrete: toon(0x6d7482),
  wood: toon(0x8a6a4a),
  white: toon(0xf6f4ee),
  green: toon(0x3f7a52),
  blue: toon(0x3a5f8a),
  red: toon(0xc0453f),
  dark: toon(0x2a303c),
};
export const GLOW = {
  warm: basic(0xffd9a0),
  warmSoft: basic(0xffe6c0),
  white: basic(0xfff6e6),
  cool: basic(0xd6ecff),
  cyan: basic(0x8fe6ff),
  pink: basic(0xff9fc4),
  green: basic(0x7de07d),
  red: basic(0xff5a4a),
  yellow: basic(0xffcc55),
};

/* ---------- 灯光 ---------- */
scene.add(new THREE.HemisphereLight(0x2c4670, 0x0b1017, 0.34));

export const moon = new THREE.DirectionalLight(0x8ca8d8, 0.72);
moon.position.set(-7, 12, 5.5);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -9; moon.shadow.camera.right = 9;
moon.shadow.camera.top = 9; moon.shadow.camera.bottom = -9;
moon.shadow.camera.near = 0.5; moon.shadow.camera.far = 34;
moon.shadow.bias = -0.0005;
moon.shadow.normalBias = 0.022;
scene.add(moon);

const fill = new THREE.DirectionalLight(0x4a6fa5, 0.24);
fill.position.set(6, 4.5, -8);
scene.add(fill);

/* ---------- 世界根节点 ---------- */
export const world = new THREE.Group();
scene.add(world);

/* ---------- 自适应 ---------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
