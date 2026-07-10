/**
 * anime.js 页面切换引擎。
 *
 * 统一模型：切换期间 enter 层（新页）与 exit 层（旧页）同时渲染，
 * runTransition 用一条 timeline 驱动两层 + 可选叠加层（curtain），
 * timeline 的 onComplete 触发 finish() 完成显示态切换。
 *
 * 两段式（curtain）：前半段旧页淡出 + 幕布覆盖，后半段幕布揭示 + 新页淡入。
 * 一段式（zoom-blur）：两层全时长交叉动画。
 *
 * 返回 cleanup（pause timeline），由 PageShell 在 effect 卸载时调用；
 * 外部另有安全超时兜底 finish()，避免动画异常时页面卡死。
 */
import {
  createTimeline,
  EASE,
  TRANSITION_MS,
  prefersReducedMotion,
} from "@/lib/anime";
import type { TransitionType } from "@/contexts/PageContext";

/** 切换总时长的一半，用于两段式动画的分段点 */
const HALF = Math.round(TRANSITION_MS / 2);

export interface TransitionContext {
  /** 退出层 DOM（旧页），可能为 null */
  exitEl: HTMLElement | null;
  /** 进入层 DOM（新页），可能为 null */
  enterEl: HTMLElement | null;
  /** curtain 面板（仅 curtain 类型需要） */
  curtainPanel: HTMLElement | null;
  /** 过渡完成回调：切换 displayed → pending，解锁滚动 */
  finish: () => void;
}

/**
 * 执行一次页面切换动画。
 * @param type      切换类型
 * @param forward   是否前进方向（影响 curtain 覆盖方向）
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

  const { exitEl, enterEl, curtainPanel, finish } = ctx;

  const tl = createTimeline({
    defaults: { ease: EASE.expo },
    onComplete: () => finish(),
  });

  switch (type) {
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
