"use client";

import { useEffect, useRef } from "react";
import { usePage } from "@/contexts/PageContext";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { SCENE_MOODS, type SceneMood, type ScenePointer } from "./contracts";
import { hexToVec4, WGSL_NEBULA } from "./scene-shaders";
import { useSceneTelemetry } from "./useSceneTelemetry";

/**
 * WebGPU 全屏体积星云。
 *
 * 生命周期要点：
 *  - vgpu 只能动态 import（它体积不小，且必须等真正需要时再拉起）；
 *  - `surface()` 对同一 canvas 只能存在一个，strict-mode 双挂载时若旧 surface
 *    未同步 dispose 会抛 VGPU-SURFACE-DUPLICATE。因此每个资源创建后立刻把
 *    disposer 推进栈里，取消时按 LIFO 清理，异步 await 之后一律先检查 cancelled；
 *  - 任何一步（init / prepareShader / compile / 帧回调）失败都回调 onFail，
 *    由 SceneRoot 切到 Three.js 兜底，页面永远不会因为 WebGPU 而空白；
 *  - document.hidden 时停掉 frameLoop，恢复可见再重启（省电，也避免后台 rAF 堆积）。
 */
export interface VgpuFieldProps {
  className?: string;
  onFail?: (reason: string) => void;
}

/** uniform 的完整初值：vgpu 的 set() 对 struct 做浅合并，首次必须给全字段 */
function buildParams(
  mood: SceneMood,
  theme: Theme,
  width: number,
  height: number,
  time: number,
  pointer: ScenePointer,
  pulse: number
): Record<string, unknown> {
  return {
    accent: hexToVec4(mood.accent),
    accent2: hexToVec4(mood.accent2),
    resolution: [width, height, 0, 0],
    pointer: [pointer.x, pointer.y, 0, 0],
    time,
    intensity: mood.intensity,
    pulse,
    theme: theme === "light" ? 1 : 0,
  };
}

export function VgpuField({ className = "", onFail }: VgpuFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { current, transitioning } = usePage();
  const { theme } = useTheme();
  const telemetry = useSceneTelemetry(transitioning);

  // 帧循环里读 ref，避免每次切页/切主题都重建 GPU 资源
  const pageRef = useRef(current);
  const themeRef = useRef(theme);
  const onFailRef = useRef(onFail);

  useEffect(() => {
    pageRef.current = current;
  }, [current]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    onFailRef.current = onFail;
  }, [onFail]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let failed = false;

    // LIFO 资源栈：任何异步阶段取消/失败都能把已创建的东西清干净
    const disposers: Array<() => void> = [];
    const cleanup = () => {
      cancelled = true;
      while (disposers.length) {
        const dispose = disposers.pop();
        try {
          dispose?.();
        } catch {
          /* 清理阶段的异常不应影响其余资源 */
        }
      }
    };

    const fail = (reason: string) => {
      if (cancelled || failed) return;
      failed = true;
      cleanup();
      onFailRef.current?.(reason);
    };

    // 先做同步能力探测；真正的 init 失败仍由下面的 try/catch 兜底
    if (typeof navigator === "undefined" || !navigator.gpu) {
      fail("webgpu-unavailable");
      return cleanup;
    }

    void (async () => {
      try {
        // 两个包都只在客户端、真正要用时才加载
        const [{ init, effect, surface, frameLoop, clock }, { prepareShader }] =
          await Promise.all([import("vgpu"), import("@vgpu/wgsl/prepare")]);
        if (cancelled) return;

        const gpu = await init({ powerPreference: "high-performance" });
        if (cancelled) {
          gpu.dispose();
          return;
        }
        disposers.push(() => gpu.dispose());

        // 透明画布：ThreeUI 强调层从下方透出，CSS 兜底也不会被盖死。
        // dpr 上限 1.5：星云是低频内容，再高只会让填充率翻倍。
        const target = surface(gpu, canvas, {
          dpr: [1, 1.5],
          alphaMode: "premultiplied",
          // 每次 pass 默认清成全透明，画布才能透出下层的 ThreeUI 强调层
          clearColor: [0, 0, 0, 0],
          label: "void-scene-surface",
        });
        disposers.push(() => target.dispose());

        const mood = SCENE_MOODS[pageRef.current];
        const fx = effect(gpu, prepareShader(WGSL_NEBULA, "void-nebula.wgsl"), {
          label: "void-nebula",
          set: {
            params: buildParams(
              mood,
              themeRef.current,
              target.size[0],
              target.size[1],
              0,
              { x: 0, y: 0 },
              0
            ),
          },
        });
        disposers.push(() => fx.dispose());

        // 尺寸类 uniform 只在 resize 时写，避免每帧无谓的打包
        const unsubscribe = target.onResize(({ width, height }) => {
          fx.set({ params: { resolution: [width, height, 0, 0] } });
        });
        disposers.push(unsubscribe);

        // 提前编译并把异步错误暴露给 onFail —— 这里失败就切 Three.js
        await fx.compile(target);
        if (cancelled) return;

        const time = clock(gpu);
        let loop: { stop(): void } | null = null;

        const startLoop = () => {
          if (cancelled || loop) return;
          loop = frameLoop(gpu, (frame) => {
            try {
              const nextMood = SCENE_MOODS[pageRef.current];
              const pointer = telemetry.pointerRef.current;
              const light = themeRef.current === "light";
              fx.set({
                params: {
                  accent: hexToVec4(nextMood.accent),
                  accent2: hexToVec4(nextMood.accent2),
                  pointer: [pointer.x, pointer.y, 0, 0],
                  time: time.time,
                  // 亮色主题下同样的能量会显得过重，按 55% 收敛
                  intensity: nextMood.intensity * (light ? 0.55 : 1),
                  pulse: telemetry.pulseRef.current,
                  theme: light ? 1 : 0,
                },
              });
              frame.pass(target, fx);
            } catch (error) {
              // 不要在帧编码过程中 dispose 资源：等这一帧提交后再切兜底
              const reason =
                error instanceof Error ? error.message : "vgpu-frame-error";
              window.setTimeout(() => fail(reason), 0);
            }
          });
        };

        const stopLoop = () => {
          loop?.stop();
          loop = null;
        };
        disposers.push(stopLoop);

        const onVisibility = () => {
          if (document.hidden) stopLoop();
          else startLoop();
        };
        document.addEventListener("visibilitychange", onVisibility);
        disposers.push(() =>
          document.removeEventListener("visibilitychange", onVisibility)
        );

        // 设备丢失（驱动重置、切独显等）也走兜底；lost 的 rejection 不能变成未处理异常
        void gpu.lost
          .then(() => fail("device-lost"))
          .catch(() => fail("device-lost"));

        if (!document.hidden) startLoop();
      } catch (error) {
        fail(error instanceof Error ? error.message : "vgpu-init-failed");
      }
    })();

    return cleanup;
    // 只初始化一次；页面/主题变化通过 ref 传给帧循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
