"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
// three 0.187 自身不带 .d.ts，本仓库也没有安装 @types/three（不新增依赖）。
// 运行时必须有 three，所以用 @ts-expect-error 压掉 TS7016；下面用局部结构类型
// 描述实际用到的成员，避免整个文件退化成 any。
// @ts-expect-error three 未附带类型声明（见上）
import * as THREE from "three";
import { usePage } from "@/contexts/PageContext";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import {
  SCENE_MOODS,
  type SceneGeometry,
  type SceneMood,
  type ScenePointer,
} from "./contracts";
import { createSeededRandom, themeAccent } from "./scene-shaders";
import { usePrefersReducedMotion, useSceneTelemetry } from "./useSceneTelemetry";

/**
 * WebGL 兜底场景（React Three Fiber）。
 *
 * 只在 WebGPU 不可用 / 初始化失败时由 SceneRoot 动态加载（ssr: false）。
 * 每个页面 mood 对应一种机械几何；所有几何都由 BasicMaterial + wireframe
 * 构成 —— 没有光照、没有贴图、没有外部资源，因此首帧成本极低。
 *
 * 渲染预算（约 ≤ 40k 三角形）：
 *   orb ≤ 1k、rings ≤ 6k、grid ≤ 5k、lattice 节点走 instancing、
 *   shards ≤ 2k、archive ≤ 1k，星尘 1.4k 个点。
 * 所有重复物体都用 instancedMesh，避免 draw call 爆炸。
 *
 * 降级：prefers-reduced-motion 时 frameloop="demand"（只渲染一帧静态画面），
 * useFrame 内的动画全部短路。
 */
export interface ThreeFieldProps {
  className?: string;
}

// ---- three 的局部结构类型（见上方说明） ---------------------------------

type Vec3Handle = { x: number; y: number; z: number };

interface GroupHandle {
  position: Vec3Handle;
  rotation: Vec3Handle;
  scale: { setScalar(value: number): void };
}

interface PointsHandle {
  rotation: Vec3Handle;
}

interface InstancedHandle {
  setMatrixAt(index: number, matrix: unknown): void;
  instanceMatrix: { needsUpdate: boolean };
}

// ---- 通用组件 -------------------------------------------------------------

/** 相机随指针做阻尼视差；转场时向场景内推进，模拟“镜头运动” */
function CameraRig({
  base,
  pointerRef,
  pulseRef,
  reduced,
}: {
  base: [number, number, number];
  pointerRef: RefObject<ScenePointer>;
  pulseRef: RefObject<number>;
  reduced: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const target = useMemo(() => new THREE.Vector3(), []);

  // reduced-motion 下 frameloop="demand"，useFrame 不跑，需要显式落位并重绘一帧
  useEffect(() => {
    camera.position.set(base[0], base[1], base[2]);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [base, camera, invalidate]);

  useFrame((_, delta) => {
    if (reduced) return;
    const pointer = pointerRef.current;
    const pulse = pulseRef.current;
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 2.4);
    target.set(
      base[0] + pointer.x * 0.95,
      base[1] + pointer.y * 0.55,
      base[2] - pulse * 1.1
    );
    camera.position.lerp(target, k);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/** 转场脉冲：整体轻微推近 + 微旋，避免切换时背景“无反应” */
function SurgeGroup({
  children,
  pulseRef,
  reduced,
}: {
  children: ReactNode;
  pulseRef: RefObject<number>;
  reduced: boolean;
}) {
  const ref = useRef<GroupHandle>(null);
  useFrame(() => {
    const group = ref.current;
    if (!group || reduced) return;
    const pulse = pulseRef.current;
    group.scale.setScalar(1 + pulse * 0.16);
    group.rotation.z = pulse * 0.03;
  });
  return <group ref={ref}>{children}</group>;
}

/** 星尘：球壳上的确定性点云，缓慢自转 */
function StarDust({
  theme,
  accent,
  reduced,
}: {
  theme: Theme;
  accent: string;
  reduced: boolean;
}) {
  const count = 1400;
  const ref = useRef<PointsHandle>(null);

  const positions = useMemo(() => {
    const rand = createSeededRandom(9173);
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 9 + rand() * 18;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      array[i * 3 + 2] = radius * Math.cos(phi) - 4;
    }
    return array;
  }, []);

  useFrame((_, delta) => {
    if (reduced || !ref.current) return;
    ref.current.rotation.y += delta * 0.012;
    ref.current.rotation.x += delta * 0.004;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={accent}
        size={theme === "dark" ? 0.035 : 0.028}
        sizeAttenuation
        transparent
        opacity={theme === "dark" ? 0.62 : 0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
}

// ---- 每个 mood 的几何 -----------------------------------------------------

interface GeometryProps {
  accent: string;
  accent2: string;
  pulseRef: RefObject<number>;
  reduced: boolean;
}

/** home：线框二十面体 + 发光内核 + 三层加色壳（假装 bloom） */
function OrbGeometry({ accent, accent2, pulseRef, reduced }: GeometryProps) {
  const ref = useRef<GroupHandle>(null);
  useFrame((state, delta) => {
    const group = ref.current;
    if (!group || reduced) return;
    group.rotation.y += delta * (0.12 + pulseRef.current * 0.55);
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.16;
  });
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[1.7, 2]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.24} depthWrite={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.82, 2]} />
        <meshBasicMaterial color={accent2} wireframe transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {[0.9, 1.15, 1.45].map((scale, index) => (
        <mesh key={scale} scale={scale}>
          <sphereGeometry args={[0.8, 20, 14]} />
          <meshBasicMaterial
            color={accent2}
            transparent
            opacity={0.05 - index * 0.012}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      ))}
    </group>
  );
}

const RING_PRESETS = [
  { radius: 1.2, tube: 0.006, tilt: [1.15, 0.2, 0] as const, useAccent2: false },
  { radius: 1.55, tube: 0.005, tilt: [0.5, 1.1, 0.3] as const, useAccent2: true },
  { radius: 1.9, tube: 0.004, tilt: [1.9, 0.4, 0.8] as const, useAccent2: false },
];

/** about：嵌套轨道环 + 中央线框核 */
function RingsGeometry({ accent, accent2, pulseRef, reduced }: GeometryProps) {
  const ref = useRef<GroupHandle>(null);
  useFrame((state, delta) => {
    const group = ref.current;
    if (!group || reduced) return;
    group.rotation.y += delta * (0.08 + pulseRef.current * 0.35);
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.18;
  });
  return (
    <group ref={ref}>
      {RING_PRESETS.map((ring, index) => (
        <mesh key={index} rotation={[...ring.tilt]}>
          <torusGeometry args={[ring.radius, ring.tube, 6, 128]} />
          <meshBasicMaterial
            color={ring.useAccent2 ? accent2 : accent}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh rotation={[0.4, 0.8, 0.2]}>
        <octahedronGeometry args={[0.42, 1]} />
        <meshBasicMaterial color={accent2} wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/** tech：透视网格地面（向前滚动）+ 实例化立柱 */
function GridGeometry({ accent, accent2, pulseRef, reduced }: GeometryProps) {
  const floor = useRef<GroupHandle>(null);
  const columns = useRef<InstancedHandle>(null);
  const count = 26;

  const gridPositions = useMemo(() => {
    const lines: number[] = [];
    const size = 22;
    for (let i = -size; i <= size; i += 1) {
      lines.push(-size, 0, i, size, 0, i);
      lines.push(i, 0, -size, i, 0, size);
    }
    return new Float32Array(lines);
  }, []);

  useLayoutEffect(() => {
    const mesh = columns.current;
    if (!mesh) return;
    const rand = createSeededRandom(4211);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 3 + rand() * 10;
      const height = 0.6 + rand() * 3.6;
      dummy.position.set(
        Math.cos(angle) * radius,
        -2.6 + height / 2,
        Math.sin(angle) * radius - 9
      );
      dummy.scale.set(0.05 + rand() * 0.1, height, 0.05 + rand() * 0.1);
      dummy.rotation.y = rand() * Math.PI;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const group = floor.current;
    if (!group || reduced) return;
    // 网格每 1 个单位重复一次，4 个单位回卷不会出现跳变
    const speed = 1.1 + pulseRef.current * 1.4;
    const next = (group.position.z + delta * speed) % 4;
    group.position.z = next;
  });

  return (
    <group>
      <group ref={floor} position={[0, -2.5, -6]}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[gridPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={accent} transparent opacity={0.16} depthWrite={false} fog={false} />
        </lineSegments>
      </group>
      <instancedMesh ref={columns} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={accent2} wireframe transparent opacity={0.28} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/** stats：instanced 节点 + 近邻连线的数据晶格 */
function LatticeGeometry({ accent, accent2, pulseRef, reduced }: GeometryProps) {
  const ref = useRef<GroupHandle>(null);
  const nodes = useRef<InstancedHandle>(null);

  const { points, edges } = useMemo(() => {
    const rand = createSeededRandom(7731);
    const list: Array<[number, number, number]> = [];
    for (let x = -2; x <= 2; x += 1) {
      for (let y = -1; y <= 2; y += 1) {
        for (let z = -2; z <= 2; z += 1) {
          list.push([
            x * 1.15 + (rand() - 0.5) * 0.4,
            y * 1.05 + (rand() - 0.5) * 0.4 - 0.3,
            z * 1.15 + (rand() - 0.5) * 0.4 - 2,
          ]);
        }
      }
    }
    const lineData: number[] = [];
    const maxDistance = 1.4;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [ax, ay, az] = list[i];
        const [bx, by, bz] = list[j];
        const dx = ax - bx;
        const dy = ay - by;
        const dz = az - bz;
        if (dx * dx + dy * dy + dz * dz < maxDistance * maxDistance) {
          lineData.push(ax, ay, az, bx, by, bz);
        }
      }
    }
    return { points: list, edges: new Float32Array(lineData) };
  }, []);

  useLayoutEffect(() => {
    const mesh = nodes.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    points.forEach(([x, y, z], index) => {
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [points]);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group || reduced) return;
    group.rotation.y += delta * (0.06 + pulseRef.current * 0.3);
    group.rotation.x = 0.1 + Math.sin(delta) * 0.01;
  });

  return (
    <group ref={ref}>
      <instancedMesh ref={nodes} args={[undefined, undefined, points.length]}>
        <octahedronGeometry args={[0.06, 0]} />
        <meshBasicMaterial color={accent} transparent opacity={0.9} depthWrite={false} />
      </instancedMesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={accent2} transparent opacity={0.26} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/** projects：漂浮的多面体碎片（instancing） */
function ShardsGeometry({ accent, accent2, pulseRef, reduced }: GeometryProps) {
  const ref = useRef<GroupHandle>(null);
  const shards = useRef<InstancedHandle>(null);
  const count = 18;

  useLayoutEffect(() => {
    const mesh = shards.current;
    if (!mesh) return;
    const rand = createSeededRandom(5521);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const radius = 2.2 + rand() * 4.2;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      dummy.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta) * 0.7,
        radius * Math.cos(phi) - 1.5
      );
      const size = 0.12 + rand() * 0.34;
      dummy.scale.set(size, size * (0.6 + rand()), size);
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group || reduced) return;
    group.rotation.y += delta * (0.1 + pulseRef.current * 0.45);
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.12;
  });

  return (
    <group ref={ref}>
      <instancedMesh ref={shards} args={[undefined, undefined, count]}>
        <tetrahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
      <mesh>
        <icosahedronGeometry args={[0.28, 2]} />
        <meshBasicMaterial
          color={accent2}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** blog：层层叠叠的半透明档案板 */
function ArchiveGeometry({ accent, accent2, pulseRef, reduced }: GeometryProps) {
  const ref = useRef<GroupHandle>(null);
  const slabs = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        position: [0, 0.55 - i * 0.16, -i * 0.55] as [number, number, number],
        rotation: [0.06 * i - 0.18, 0.16 * i - 0.4, 0.02 * i] as [
          number,
          number,
          number
        ],
        scale: [3.3 - i * 0.18, 0.016, 2.1 - i * 0.1] as [number, number, number],
        opacity: 0.16 - i * 0.014,
      })),
    []
  );

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group || reduced) return;
    group.rotation.y += delta * (0.05 + pulseRef.current * 0.22);
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.06;
  });

  return (
    <group ref={ref}>
      {slabs.map((slab, index) => (
        <mesh
          key={index}
          position={slab.position}
          rotation={slab.rotation}
          scale={slab.scale}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? accent : accent2}
            transparent
            opacity={Math.max(slab.opacity, 0.04)}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function MoodGeometry({
  geometry,
  ...props
}: GeometryProps & { geometry: SceneGeometry }) {
  switch (geometry) {
    case "orb":
      return <OrbGeometry {...props} />;
    case "rings":
      return <RingsGeometry {...props} />;
    case "grid":
      return <GridGeometry {...props} />;
    case "lattice":
      return <LatticeGeometry {...props} />;
    case "shards":
      return <ShardsGeometry {...props} />;
    case "archive":
      return <ArchiveGeometry {...props} />;
  }
}

// ---- 场景内容 / Canvas ----------------------------------------------------

function SceneContent({
  mood,
  theme,
  pointerRef,
  pulseRef,
  reduced,
}: {
  mood: SceneMood;
  theme: Theme;
  pointerRef: RefObject<ScenePointer>;
  pulseRef: RefObject<number>;
  reduced: boolean;
}) {
  // 亮色主题下荧光色会糊在浅底上，换成压深的墨水色
  const accent = useMemo(() => themeAccent(mood.accent, theme), [mood.accent, theme]);
  const accent2 = useMemo(
    () => themeAccent(mood.accent2, theme),
    [mood.accent2, theme]
  );
  const fogColor = theme === "dark" ? "#03040a" : "#e9eef6";

  return (
    <>
      <CameraRig base={mood.camera} pointerRef={pointerRef} pulseRef={pulseRef} reduced={reduced} />
      <fog attach="fog" args={[fogColor, 9, 30]} />
      <StarDust theme={theme} accent={accent2} reduced={reduced} />
      <SurgeGroup pulseRef={pulseRef} reduced={reduced}>
        <MoodGeometry
          geometry={mood.geometry}
          accent={accent}
          accent2={accent2}
          pulseRef={pulseRef}
          reduced={reduced}
        />
      </SurgeGroup>
    </>
  );
}

export function ThreeField({ className = "" }: ThreeFieldProps) {
  const { current, transitioning } = usePage();
  const { theme } = useTheme();
  const reduced = usePrefersReducedMotion();
  const telemetry = useSceneTelemetry(transitioning);
  const mood = SCENE_MOODS[current];

  // 父层是 pointer-events-none 的装饰层；Canvas 默认 div 会拦截事件，这里显式放行。
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: mood.camera, fov: 42, near: 0.1, far: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        frameloop={reduced ? "demand" : "always"}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <SceneContent
          mood={mood}
          theme={theme}
          pointerRef={telemetry.pointerRef}
          pulseRef={telemetry.pulseRef}
          reduced={reduced}
        />
      </Canvas>
    </div>
  );
}
