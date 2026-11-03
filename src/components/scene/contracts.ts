import type { PageId } from "@/contexts/PageContext";

/**
 * 每个页面在 3D 场景中的"情绪配置"。
 * 场景层（SceneRoot / VgpuField / ThreeField）读取它决定几何体、相机与配色；
 * 各 section 不直接依赖场景层，避免并发改动的耦合。
 */
export type SceneGeometry =
  | "orb"
  | "grid"
  | "rings"
  | "lattice"
  | "shards"
  | "archive";

export interface SceneMood {
  /** 主强调色（hex，供 WebGL / WebGPU 使用） */
  accent: string;
  /** 次强调色 */
  accent2: string;
  /** 场景几何形态 */
  geometry: SceneGeometry;
  /** 整体强度 0..1（home 最亮，内容页收敛） */
  intensity: number;
  /** 相机基准位置 [x, y, z] */
  camera: [number, number, number];
}

export const SCENE_MOODS: Record<PageId, SceneMood> = {
  home: {
    accent: "#5af2ff",
    accent2: "#ff3ec9",
    geometry: "orb",
    intensity: 1,
    camera: [0, 0, 6],
  },
  about: {
    accent: "#7c5cff",
    accent2: "#5af2ff",
    geometry: "rings",
    intensity: 0.55,
    camera: [1.2, 0.4, 7],
  },
  tech: {
    accent: "#5af2ff",
    accent2: "#ffc46b",
    geometry: "grid",
    intensity: 0.6,
    camera: [0, 1.1, 7.5],
  },
  stats: {
    accent: "#ffc46b",
    accent2: "#ff3ec9",
    geometry: "lattice",
    intensity: 0.6,
    camera: [0.8, -0.3, 6.5],
  },
  projects: {
    accent: "#ff3ec9",
    accent2: "#5af2ff",
    geometry: "shards",
    intensity: 0.7,
    camera: [-1, 0.2, 7],
  },
  blog: {
    accent: "#8fe388",
    accent2: "#5af2ff",
    geometry: "archive",
    intensity: 0.45,
    camera: [0, 0.6, 8],
  },
};

/** 归一化指针（-1..1），供场景对象做视差 */
export interface ScenePointer {
  x: number;
  y: number;
}
