import { THREE, M, box, toon, WALK_Y, ROAD_Y } from './core.js';
import { HALF, SIDEWALK_EDGE } from './layout.js';

/* 广场底座 + 街道地面 */
export function buildGround(world) {

  /* ---- 底座（收藏模型感的厚底板） ---- */
  box(world, 10.0, 0.85, 10.0, M.plinthTop, 0, -0.425, 0, { ol: 0.02 });
  box(world, 10.44, 0.06, 10.44, M.plinthEdge, 0, -0.88, 0, { ol: 0.02 });
  box(world, 10.5, 0.22, 10.5, M.plinth, 0, -1.03, 0, { ol: 0.02 });
  box(world, 10.92, 0.16, 10.92, M.plinthLip, 0, -1.2, 0, { ol: 0.02 });

  /* ---- 车道路面（铺满底座顶面） ---- */
  box(world, 10.0, 0.06, 10.0, M.road, 0, ROAD_Y - 0.03, 0, { ol: 0, cast: false });
  // 路面深浅变化（湿地质感）
  box(world, 10.0, 0.005, 3.4, toon(0x232835), 0, ROAD_Y + 0.004, 4.2, { ol: 0, cast: false });

  /* ---- 人行道（街角内侧一整块） ---- */
  const SW = SIDEWALK_EDGE - (-HALF);           // 7.4
  const SC = (SIDEWALK_EDGE + (-HALF)) / 2;     // -1.3
  box(world, SW, 0.15, SW, M.walk, SC, WALK_Y - 0.075, SC, { ol: 0, cast: false });
  // 人行道湿边
  box(world, SW, 0.012, 0.28, M.walkDark, SC, WALK_Y + 0.002, SIDEWALK_EDGE - 0.14, { ol: 0, cast: false });
  box(world, 0.28, 0.012, SW, M.walkDark, SIDEWALK_EDGE - 0.14, WALK_Y + 0.002, SC, { ol: 0, cast: false });

  /* ---- 路缘石 ---- */
  box(world, SW, 0.17, 0.12, M.curb, SC, WALK_Y - 0.085, SIDEWALK_EDGE + 0.0, { ol: 0.013 });
  box(world, 0.12, 0.17, SW, M.curb, SIDEWALK_EDGE, WALK_Y - 0.085, SC, { ol: 0.013 });

  /* ---- 排水沟 + 格栅 ---- */
  const gz = SIDEWALK_EDGE + 0.2;
  box(world, SW, 0.05, 0.26, toon(0x171c25), SC, 0.005, gz, { ol: 0, cast: false });
  box(world, 0.26, 0.05, SW, toon(0x171c25), gz, 0.005, SC, { ol: 0, cast: false });
  for (let x = -4.7; x < 2.3; x += 0.44) box(world, 0.3, 0.035, 0.1, M.metalDark, x, 0.045, gz, { ol: 0, cast: false });
  for (let z = -4.7; z < 2.3; z += 0.44) box(world, 0.1, 0.035, 0.3, M.metalDark, gz, 0.045, z, { ol: 0, cast: false });

  /* ---- 斑马线（街角两处，湿润反光） ---- */
  const stripeMat = toon(0x9ba5b4, { emissive: 0x141b26, emissiveIntensity: 1 });
  // 正面车道：沿 z 方向
  for (let i = -5; i <= 2; i++) {
    const x = 1.4 + i * 0.6;
    box(world, 0.34, 0.014, 1.9, stripeMat, x, ROAD_Y + 0.012, 3.45, { ol: 0, cast: false });
  }
  // 右侧车道：沿 x 方向
  for (let i = -5; i <= 2; i++) {
    const z = 1.4 + i * 0.6;
    box(world, 1.9, 0.014, 0.34, stripeMat, 3.45, ROAD_Y + 0.012, z, { ol: 0, cast: false });
  }

  /* ---- 车道中心线（虚线，避开斑马线） ---- */
  for (let x = -4.6; x < 5; x += 1.15) {
    if (x > -2.0 && x < 3.2) continue;
    box(world, 0.62, 0.012, 0.09, M.lineWet, x, ROAD_Y + 0.012, 3.72, { ol: 0, cast: false });
  }
  for (let z = -4.6; z < 5; z += 1.15) {
    if (z > -2.0 && z < 3.2) continue;
    box(world, 0.09, 0.012, 0.62, M.lineWet, 3.72, ROAD_Y + 0.012, z, { ol: 0, cast: false });
  }

  /* ---- 停车位（右侧车道） ---- */
  {
    const px = 3.6, pz = -2.8;
    box(world, 0.09, 0.014, 2.0, M.lineWet, px - 0.92, ROAD_Y + 0.012, pz, { ol: 0, cast: false });
    box(world, 0.09, 0.014, 2.0, M.lineWet, px + 0.92, ROAD_Y + 0.012, pz, { ol: 0, cast: false });
    box(world, 1.85, 0.014, 0.09, M.lineWet, px, ROAD_Y + 0.012, pz - 1.0, { ol: 0, cast: false });
    box(world, 0.85, 0.1, 0.13, M.concrete, px - 0.5, ROAD_Y + 0.05, pz - 0.85, { ol: 0.012 });
    box(world, 0.85, 0.1, 0.13, M.concrete, px + 0.5, ROAD_Y + 0.05, pz - 0.85, { ol: 0.012 });
    // P 立牌
    const g = new THREE.Group(); g.position.set(px + 0.86, ROAD_Y, pz - 1.15); world.add(g);
    box(g, 0.06, 1.05, 0.06, M.metal, 0, 0.525, 0, { ol: 0.012 });
    box(g, 0.46, 0.46, 0.05, toon(0x2f6f9a), 0, 1.28, 0, { ol: 0.013 });
    box(g, 0.34, 0.02, 0.02, toon(0xf0f4f8), 0, 1.34, 0.03, { ol: 0 });
    box(g, 0.02, 0.24, 0.02, toon(0xf0f4f8), -0.08, 1.22, 0.03, { ol: 0 });
    box(g, 0.16, 0.02, 0.02, toon(0xf0f4f8), 0.0, 1.34, 0.03, { ol: 0 });
    box(g, 0.02, 0.09, 0.02, toon(0xf0f4f8), 0.08, 1.29, 0.03, { ol: 0 });
  }
}
