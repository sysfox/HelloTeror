/**
 * anime.js 页面转场引擎（VOID PROTOCOL）。
 *
 * 统一模型：切换期间 enter 层（新页）与 exit 层（旧页）同时渲染，
 * runTransition 用一条 timeline 驱动两层 + 本次类型专属的 overlay，
 * timeline 的 onComplete 触发 finish() 完成显示态切换。
 *
 * 四种转场都遵循同一节奏骨架：
 *   0 ── 旧页退场（45% 前后）── 中点 ── 新页显影（后半段）── TOTAL
 * 区别只在"退场/入场用什么媒介"：Z 轴俯冲、多边形碎片、径向速度线、线框扫描。
 *
 * 返回 cleanup（pause timeline），由 PageShell 在 effect 卸载时调用；
 * 外部另有安全超时兜底 finish()，避免动画异常时页面卡死。
 */
import {
  createTimeline,
  stagger,
  EASE,
  TRANSITION_MS,
  prefersReducedMotion,
} from "@/lib/anime";
import type { TransitionType } from "@/contexts/PageContext";

/**
 * 各切换类型的总时长（ms）。
 *
 * 全部以 TRANSITION_MS 为基准再加层叠余量：转场要让"旧页退场 + overlay 铺开 +
 * 新页显影"三段在时间上错开，不能挤在一个基准时长里。
 * 新增类型时必须在此登记，否则 TS 报错（Record<TransitionType, number> 完备性检查）。
 */
export const TRANSITION_DURATIONS: Record<TransitionType, number> = {
  // 旧页冲出 45% + 新页从深空拉回 55%
  "depth-dive": TRANSITION_MS + 350, // 900
  // 碎片 stagger 需要更多铺开时间
  fracture: TRANSITION_MS + 430, // 980
  // 速度线数量最多（24 条），但整体节奏要更"快"
  "warp-tunnel": TRANSITION_MS + 310, // 860
  // 14 条线自上而下逐条点亮
  "lattice-wipe": TRANSITION_MS + 400, // 950
};

/**
 * overlay 元素数量常量。
 * PageShell 渲染 DOM 与 pageTransitions 查询 [data-*] 使用同一常量，
 * 避免"渲染了 12 片、动画按 10 片算 stagger"这类两处不一致。
 * （旧版的 SLAT_COUNT 已随 slats 转场一起移除。）
 */
export const DIVE_RING_COUNT = 6;
export const FRACTURE_SHARD_COUNT = 12;
/** fracture 碎片网格：4 列 × 3 行 = FRACTURE_SHARD_COUNT */
export const FRACTURE_COLS = 4;
export const WARP_STREAK_COUNT = 24;
export const LATTICE_LINE_COUNT = 14;

/**
 * 最长切换时长：滚动冷却（useFullPageScroll.cooldownMs）按它取，
 * 保证任何一种切换播完前都不会被下一次滚轮打断。
 */
export const MAX_TRANSITION_MS = Math.max(
  ...Object.values(TRANSITION_DURATIONS)
);

export interface TransitionContext {
  /** 退出层 DOM（旧页），可能为 null */
  exitEl: HTMLElement | null;
  /** 进入层 DOM（新页），可能为 null */
  enterEl: HTMLElement | null;
  /** depth-dive：同心环隧道容器，环以 [data-dive-ring] 标记 */
  diveTunnel: HTMLElement | null;
  /** fracture：碎片容器，碎片以 [data-fracture-shard] 标记 */
  fractureLayer: HTMLElement | null;
  /** warp-tunnel：径向速度线容器，[data-warp-streak] + [data-warp-flash] */
  warpLayer: HTMLElement | null;
  /** lattice-wipe：线框平面容器，[data-lattice-line] + [data-lattice-sweep] */
  latticeLayer: HTMLElement | null;
  /** 过渡完成回调：切换 displayed → pending，解锁滚动 */
  finish: () => void;
}

/** 从 overlay 容器里收集带 data 标记的子元素（容器可能尚未挂载） */
function collect(root: HTMLElement | null, selector: string): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

/** 错峰方向：前进时从第一个开始，后退时从最后一个开始（反向扫过） */
function staggerFrom(forward: boolean): "first" | "last" {
  return forward ? "first" : "last";
}

/**
 * 执行一次页面切换动画。
 * @param type      切换类型
 * @param forward   是否前进方向（决定扫过方向 / stagger 方向）
 * @param ctx       DOM 引用 + finish 回调
 * @returns cleanup 函数（pause timeline），无动画时返回 undefined
 */
export function runTransition(
  type: TransitionType,
  forward: boolean,
  ctx: TransitionContext
): (() => void) | void {
  // 减少动效偏好：直接完成，不做任何动画。
  // overlay 的子元素初始 opacity:0 / 屏外，因此即便只存在一帧也不可见。
  if (prefersReducedMotion()) {
    ctx.finish();
    return;
  }

  const {
    exitEl,
    enterEl,
    diveTunnel,
    fractureLayer,
    warpLayer,
    latticeLayer,
    finish,
  } = ctx;

  /** 本次切换的总时长：以基准时长兜底，避免某类型登记得比基准还短 */
  const TOTAL = Math.max(TRANSITION_MS, TRANSITION_DURATIONS[type]);

  const tl = createTimeline({
    defaults: { ease: EASE.expo },
    onComplete: () => finish(),
  });

  /**
   * overlay 容器本身的显隐。
   *
   * 子元素各自有 opacity:0 / scaleY(0) 的初始隐态，但容器可能带
   * 背景（如 warp-layer 的径向辉光），reduced-motion 下 overlay 只存在一帧，
   * 容器不藏起来就会闪一下。所以：开场 120ms 内淡入，收尾 160ms 淡出。
   */
  const fadeOverlayLayer = (layer: HTMLElement | null) => {
    if (!layer) return;
    tl.add(layer, { opacity: [0, 1], duration: 120, ease: "linear" }, 0);
    tl.add(
      layer,
      { opacity: [1, 0], duration: 160, ease: "linear" },
      Math.max(0, TOTAL - 160)
    );
  };

  switch (type) {
    case "depth-dive": {
      // 镜头俯冲：旧页朝观众方向冲出画面（scale + translateZ + blur），
      // 新页从深空远处（Z=-900）被拉回。两段在 45% 处交接，
      // 观众的视点没有停住，所以不会读成"淡出再淡入"。
      const EXIT_MS = Math.round(TOTAL * 0.45);
      const ENTER_MS = TOTAL - EXIT_MS;

      fadeOverlayLayer(diveTunnel);

      // perspective() 写进每层自己的 transform 里（anime 的 transform 组合顺序
      // 是 perspective > translate > scale）。
      // 刻意不放在 PageShell 根节点上：根节点的 perspective 会成为
      // fixed 后代的 containing block，可能破坏 section 内的 HUD 定位。
      if (exitEl) {
        tl.add(
          exitEl,
          {
            perspective: ["1800px", "1800px"],
            scale: [1, 1.35],
            translateZ: [0, 220],
            filter: ["blur(0px)", "blur(18px)"],
            opacity: [1, 0],
            duration: EXIT_MS,
            ease: EASE.quart,
          },
          0
        );
      }
      if (enterEl) {
        tl.add(
          enterEl,
          {
            perspective: ["1800px", "1800px"],
            scale: [0.82, 1],
            translateZ: [-900, 0],
            filter: ["blur(24px)", "blur(0px)"],
            opacity: [0, 1],
            duration: ENTER_MS,
            ease: EASE.expo,
          },
          EXIT_MS
        );
      }

      // 同心环隧道：环从画面中心向外扩张。3 段关键帧让环在"最有存在感"的
      // 中段达到最大不透明度，而不是一路线性淡出。
      const rings = collect(diveTunnel, "[data-dive-ring]");
      if (rings.length) {
        const step = 55;
        const ringDuration = Math.max(
          260,
          TOTAL - (rings.length - 1) * step - 60
        );
        tl.add(
          rings,
          {
            scale: [0.22, 1.5, 2.7],
            translateZ: [0, 140, 280],
            opacity: [0, 0.85, 0],
            delay: stagger(step, { from: staggerFrom(forward) }),
            duration: ringDuration,
            ease: EASE.expo,
          },
          0
        );
      }
      break;
    }

    case "fracture": {
      // 碎片转场：exit 层本身只负责变暗/虚化，视觉上"碎裂"由 overlay 的
      // 12 片多边形承担。每个 shard 是一个铺满全屏、带静态 clip-path 的 div，
      // 只对它做 translate/rotate/scale/opacity —— 动画 clip-path 在浏览器间
      // 插值行为不一致（这正是旧方案最脆的地方），静态裁剪 + 整体位移最稳。
      const EXIT_MS = Math.round(TOTAL * 0.4);
      const ENTER_AT = Math.round(TOTAL * 0.34);
      const dir = forward ? 1 : -1;

      fadeOverlayLayer(fractureLayer);

      if (exitEl) {
        tl.add(
          exitEl,
          {
            opacity: [1, 0],
            scale: [1, 1.06],
            filter: ["blur(0px)", "blur(12px)"],
            duration: EXIT_MS,
            ease: EASE.quart,
          },
          0
        );
      }
      if (enterEl) {
        // 新页轻微放大回正 + 去模糊。此前叠在整页上的青/洋红 drop-shadow
        // 会让文字出现红蓝错边（被读成「字体损坏」），已移除；纵深交给背景场景。
        tl.add(
          enterEl,
          {
            opacity: [0, 1],
            scale: [1.07, 1],
            translateX: [forward ? 20 : -20, 0],
            filter: ["blur(20px)", "blur(0px)"],
            duration: TOTAL - ENTER_AT,
            ease: EASE.expo,
          },
          ENTER_AT
        );
      }

      const shards = collect(fractureLayer, "[data-fracture-shard]");
      if (shards.length) {
        const step = 16;
        const shardDuration = Math.max(
          420,
          TOTAL - (shards.length - 1) * step - 40
        );
        tl.add(
          shards,
          {
            opacity: [0, 0.95, 0],
            // 以 4×3 网格的相对位置决定飞出方向：越靠边的碎片飞得越远
            translateX: (_t?: unknown, i?: number) => {
              const idx = i ?? 0;
              const col = (idx % FRACTURE_COLS) - (FRACTURE_COLS - 1) / 2;
              return col * 210 * dir;
            },
            translateY: (_t?: unknown, i?: number) => {
              const idx = i ?? 0;
              const row = Math.floor(idx / FRACTURE_COLS) - 1;
              return row * 150;
            },
            rotate: (_t?: unknown, i?: number) => {
              const idx = i ?? 0;
              const col = (idx % FRACTURE_COLS) - (FRACTURE_COLS - 1) / 2;
              const row = Math.floor(idx / FRACTURE_COLS) - 1;
              return (col * 7 + row * 4) * dir;
            },
            scale: [0.94, 1.12],
            delay: stagger(step, { from: staggerFrom(forward) }),
            duration: shardDuration,
            ease: EASE.expo,
          },
          0
        );
      }
      break;
    }

    case "warp-tunnel": {
      // 曲速：旧页被吸进中心（scale → 0.6 + blur），新页从中点炸开（scale 1.4 → 1）。
      // 速度线同时向外延伸，白闪在 timeline 中点提供"跃迁完成"的爆点。
      const HIT = Math.round(TOTAL * 0.5);

      fadeOverlayLayer(warpLayer);

      if (exitEl) {
        tl.add(
          exitEl,
          {
            opacity: [1, 0],
            scale: [1, 0.6],
            filter: ["blur(0px)", "blur(16px)"],
            duration: Math.round(TOTAL * 0.52),
            ease: EASE.quart,
          },
          0
        );
      }
      if (enterEl) {
        tl.add(
          enterEl,
          {
            opacity: [0, 1],
            scale: [1.4, 1],
            filter: ["blur(18px)", "blur(0px)"],
            duration: Math.round(TOTAL * 0.62),
            ease: EASE.expo,
          },
          Math.round(TOTAL * 0.38)
        );
      }

      // 径向速度线：每条 streak 的 rotate 走 CSS 独立属性（不动 transform），
      // 这里只动画 scaleY，避免 anime 写 transform 时覆盖掉射线角度。
      const streaks = collect(warpLayer, "[data-warp-streak]");
      if (streaks.length) {
        const step = 14;
        const streakDuration = Math.max(
          300,
          TOTAL - (streaks.length - 1) * step - 60
        );
        tl.add(
          streaks,
          {
            opacity: [0, 1, 0],
            scaleY: [0, 1, 0],
            delay: stagger(step, { from: staggerFrom(forward) }),
            duration: streakDuration,
            ease: EASE.expo,
          },
          0
        );
      }

      // 中点白/青爆闪：比 TOTAL 短得多，峰值正好落在交接点
      const flash = collect(warpLayer, "[data-warp-flash]");
      if (flash.length) {
        tl.add(
          flash,
          {
            opacity: [0, 0.95, 0],
            scale: [0.55, 1.5, 2.2],
            duration: 300,
            ease: EASE.quart,
          },
          Math.max(0, HIT - 150)
        );
      }
      break;
    }

    case "lattice-wipe": {
      // 线框扫描：14 条水平线按 stagger 逐条点亮，像一道从顶到底扫过的
      // 线框平面；一条渐变扫光带同步下落，把旧页"带走"，新页自下浮起。
      const ENTER_AT = Math.round(TOTAL * 0.34);

      fadeOverlayLayer(latticeLayer);

      if (exitEl) {
        tl.add(
          exitEl,
          {
            opacity: [1, 0],
            // 旧页沿扫描方向轻微位移 + 虚化，读作被平面推走。
            // 两端都用百分比字符串，避免 0(px) → 2%(百分比) 的单位跳变
            translateY: ["0%", forward ? "-2%" : "2%"],
            filter: ["blur(0px)", "blur(10px)"],
            duration: Math.round(TOTAL * 0.6),
            ease: EASE.quart,
          },
          0
        );
      }
      if (enterEl) {
        tl.add(
          enterEl,
          {
            opacity: [0, 1],
            translateY: [forward ? 24 : -24, 0],
            scale: [1.02, 1],
            filter: ["blur(14px)", "blur(0px)"],
            duration: Math.round(TOTAL * 0.66),
            ease: EASE.expo,
          },
          ENTER_AT
        );
      }

      const lines = collect(latticeLayer, "[data-lattice-line]");
      if (lines.length) {
        const step = 32;
        const lineDuration = Math.max(
          240,
          Math.round(TOTAL * 0.55) - (lines.length - 1) * step
        );
        tl.add(
          lines,
          {
            scaleX: [0, 1],
            opacity: [0, 1, 0],
            delay: stagger(step, { from: staggerFrom(forward) }),
            duration: lineDuration,
            ease: EASE.expo,
          },
          0
        );
      }

      // 扫光带：整块渐变从屏外扫到屏外，方向随 forward/backward 反转
      const sweep = collect(latticeLayer, "[data-lattice-sweep]");
      if (sweep.length) {
        tl.add(
          sweep,
          {
            translateY: [
              forward ? "-120%" : "120%",
              forward ? "120%" : "-120%",
            ],
            opacity: [0, 0.9, 0],
            duration: Math.round(TOTAL * 0.8),
            ease: EASE.quart,
          },
          0
        );
      }
      break;
    }
  }

  // 兜底：若 timeline 没有任何子动画（exit/enter 均缺失），onComplete 仍会立即触发；
  // 外部安全超时亦会兜底。返回 pause cleanup，供 effect 卸载时取消。
  return () => {
    tl.pause();
  };
}

/**
 * 清理由过渡动画残留在元素上的 inline 样式（transform / filter / opacity 等）。
 * 在 finish() 之后调用，确保新页进入静止态时无残留影响后续交互
 *（尤其是 TiltCard 等自己也在写 transform 的组件）。
 */
export function clearTransitionStyles(el: HTMLElement | null) {
  if (!el) return;
  el.style.opacity = "";
  el.style.transform = "";
  el.style.filter = "";
  el.style.clipPath = "";
  el.style.transformOrigin = "";
  // anime v4 也可能写 CSS 独立变换属性；一并清空，避免与组件自身的
  // hover / pointer 动画叠加出双重位移
  el.style.translate = "";
  el.style.rotate = "";
  el.style.scale = "";
}
