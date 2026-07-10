/**
 * anime.js 页面切换引擎。
 *
 * 统一模型：切换期间 enter 层（新页）与 exit 层（旧页）同时渲染，
 * runTransition 用一条 timeline 驱动两层 + 可选叠加层（tiles/curtain），
 * timeline 的 onComplete 触发 finish() 完成显示态切换。
 *
 * 两段式（tiles/curtain）：前半段旧页淡出 + 叠加层覆盖，后半段叠加层揭示 + 新页淡入。
 * 一段式（zoom-blur）：两层全时长交叉动画。
 * 三阶段（crt）：旧页塌缩关机 → 信号锁定雪噪 → 新页展开开机（方向无关）。
 *
 * 返回 cleanup（pause timeline），由 PageShell 在 effect 卸载时调用；
 * 外部另有安全超时兜底 finish()，避免动画异常时页面卡死。
 */
import {
  stagger,
  createTimeline,
  EASE,
  TRANSITION_MS,
  prefersReducedMotion,
} from "@/lib/anime";
import type { TransitionType } from "@/contexts/PageContext";

/** 切换总时长的一半，用于两段式动画的分段点 */
const HALF = Math.round(TRANSITION_MS / 2);
/** tiles 网格规格（与 KineticLoader 一致，8 列 × 6 行 = 48 格） */
const TILE_GRID: [number, number] = [6, 8];
/** 单格翻面时长（略短于 HALF，留出 stagger 余量形成波纹） */
const TILE_DUR = HALF - 10;
/** 单格 stagger 间隔，中心扩散 */
const TILE_STAGGER = 8;

export interface TransitionContext {
  /** 退出层 DOM（旧页），可能为 null */
  exitEl: HTMLElement | null;
  /** 进入层 DOM（新页），可能为 null */
  enterEl: HTMLElement | null;
  /** tiles 网格容器（仅 tiles 类型需要） */
  tilesContainer: HTMLElement | null;
  /** curtain 面板（仅 curtain 类型需要） */
  curtainPanel: HTMLElement | null;
  /** CRT overlay 容器（仅 crt 类型需要，内含 .crt-static/.crt-scanlines/.crt-glow 子层） */
  crtOverlay: HTMLElement | null;
  /** 过渡完成回调：切换 displayed → pending，解锁滚动 */
  finish: () => void;
}

/**
 * 执行一次页面切换动画。
 * @param type      切换类型
 * @param forward   是否前进方向（影响 tiles/curtain 覆盖方向）
 * @param ctx       DOM 引用 + finish 回调
 * @returns cleanup 函数（pause timeline），无动画时返回 undefined
 */
export function runTransition(
  type: TransitionType,
  forward: boolean,
  ctx: TransitionContext
): (() => void) | void {
  // 减少动效偏好：直接完成，不做任何动画
  if (prefersReducedMotion()) {
    ctx.finish();
    return;
  }

  const { exitEl, enterEl, tilesContainer, curtainPanel, crtOverlay, finish } =
    ctx;

  // 取出 tiles 单元（仅 tiles 类型）
  const cells =
    type === "tiles" && tilesContainer
      ? Array.from(tilesContainer.querySelectorAll<HTMLElement>("[data-tile]"))
      : [];

  // 取出 CRT overlay 三个子层（仅 crt 类型）
  const crtStatic =
    type === "crt" && crtOverlay
      ? crtOverlay.querySelector<HTMLElement>(".crt-static")
      : null;
  const crtScanlines =
    type === "crt" && crtOverlay
      ? crtOverlay.querySelector<HTMLElement>(".crt-scanlines")
      : null;
  const crtGlow =
    type === "crt" && crtOverlay
      ? crtOverlay.querySelector<HTMLElement>(".crt-glow")
      : null;

  const tl = createTimeline({
    defaults: { ease: EASE.expo },
    onComplete: () => finish(),
  });

  switch (type) {
    case "tiles": {
      // ── 前半段：旧页淡出 + 瓦片从 90° 翻入覆盖屏幕 ──
      if (exitEl) {
        tl.add(
          exitEl,
          { opacity: [1, 0], duration: HALF, ease: EASE.quart },
          0
        );
      }
      if (cells.length) {
        tl.add(
          cells,
          {
            rotateX: [90, 0],
            opacity: [0, 1],
            duration: TILE_DUR,
            delay: stagger(TILE_STAGGER, { grid: TILE_GRID, from: "center" }),
            ease: EASE.expo,
          },
          0
        );
      }
      // ── 后半段：瓦片翻走揭示 + 新页淡入 ──
      if (cells.length) {
        tl.add(
          cells,
          {
            rotateX: [0, 90],
            opacity: [1, 0],
            duration: TILE_DUR,
            delay: stagger(TILE_STAGGER, { grid: TILE_GRID, from: "center" }),
            ease: EASE.expo,
          },
          HALF
        );
      }
      if (enterEl) {
        tl.add(
          enterEl,
          { opacity: [0, 1], duration: HALF, ease: EASE.quart },
          HALF
        );
      }
      break;
    }

    case "curtain": {
      // ── 前半段：旧页淡出 + 幕布从一侧扫入覆盖 ──
      if (exitEl) {
        tl.add(
          exitEl,
          { opacity: [1, 0], duration: HALF, ease: EASE.quart },
          0
        );
      }
      if (curtainPanel) {
        tl.add(
          curtainPanel,
          {
            translateX: [forward ? "-100%" : "100%", "0%"],
            duration: HALF,
            ease: EASE.expo,
          },
          0
        );
      }
      // ── 后半段：幕布扫出 + 新页淡入 ──
      if (curtainPanel) {
        tl.add(
          curtainPanel,
          {
            translateX: ["0%", forward ? "100%" : "-100%"],
            duration: HALF,
            ease: EASE.expo,
          },
          HALF
        );
      }
      if (enterEl) {
        tl.add(
          enterEl,
          { opacity: [0, 1], duration: HALF, ease: EASE.quart },
          HALF
        );
      }
      break;
    }

    case "zoom-blur": {
      // 一段式：旧页缩小+模糊淡出，新页放大去模糊淡入，全时长交叉
      if (exitEl) {
        tl.add(
          exitEl,
          {
            opacity: [1, 0],
            scale: [1, 0.92],
            filter: ["blur(0px)", "blur(8px)"],
            duration: TRANSITION_MS,
            ease: EASE.expo,
          },
          0
        );
      }
      if (enterEl) {
        tl.add(
          enterEl,
          {
            opacity: [0, 1],
            scale: [1.08, 1],
            filter: ["blur(8px)", "blur(0px)"],
            duration: TRANSITION_MS,
            ease: EASE.expo,
          },
          0
        );
      }
      break;
    }

    case "crt": {
      // CRT 电源周期，方向无关（开关机不区分 forward/backward）。
      // ① 关机 0→220ms：旧页向中线塌成发丝亮线，白热闪光后熄灭
      if (exitEl) {
        tl.add(
          exitEl,
          {
            scaleY: [1, 0.004],
            opacity: [1, 1, 0],
            filter: [
              "brightness(1)",
              "brightness(2.4)",
              "brightness(0)",
            ],
            transformOrigin: "50% 50%",
            duration: 220,
            ease: EASE.expo,
          },
          0
        );
      }

      // ② 信号锁定 160→360ms：雪噪 scramble + 扫描线 + 磷光晕
      // 磷光晕长包络（60→550ms），峰值落在锁定窗，跨越关机末段→开机初段
      if (crtGlow) {
        tl.add(
          crtGlow,
          { opacity: [0, 1, 0], duration: 490, ease: "linear" },
          60
        );
      }
      // 雪噪 scramble：中点闪现并收敛（scramble 在此）
      if (crtStatic) {
        tl.add(
          crtStatic,
          { opacity: [0, 0.9, 0.9, 0], duration: 200, ease: "linear" },
          160
        );
      }
      // 扫描线：起落稍早于雪噪、收得稍晚，包裹锁定窗
      if (crtScanlines) {
        tl.add(
          crtScanlines,
          { opacity: [0, 1, 1, 0], duration: 360, ease: "linear" },
          120
        );
      }

      // ③ 开机 240→550ms：新页从发丝线展开，亮度从白热沉淀到正常
      if (enterEl) {
        // 亮线快速显形（短 ramp），与下方展开并行
        tl.add(
          enterEl,
          { opacity: [0, 1], duration: 80, ease: EASE.expo },
          240
        );
        // 展开 + 亮度沉淀（brightness 2.4 起始把压缩内容吹成白线，随展开归位）
        tl.add(
          enterEl,
          {
            scaleY: [0.004, 1],
            filter: ["brightness(2.4)", "brightness(1)"],
            transformOrigin: "50% 50%",
            duration: 310,
            ease: EASE.expo,
          },
          240
        );
      }
      break;
    }
  }

  // 兜底：若 timeline 没有任何子动画（exit/enter 均缺失），onComplete 仍会立即触发；
  // 外部安全超时亦会兜底。返回 pause cleanup。
  return () => {
    tl.pause();
  };
}

/**
 * 清理由过渡动画残留在元素上的 inline 样式（scale / filter / clipPath）。
 * 在 finish() 之后调用，确保新页进入静止态时无 transform/clip 残留影响后续交互。
 */
export function clearTransitionStyles(el: HTMLElement | null) {
  if (!el) return;
  el.style.opacity = "";
  el.style.transform = "";
  el.style.filter = "";
  el.style.clipPath = "";
  el.style.transformOrigin = "";
}
