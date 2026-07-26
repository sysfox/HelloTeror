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

/**
 * 各切换类型的总时长（ms）。
 *
 * 两段式/交错式切换需要比基准时长更多的空间才能拉出层次，
 * 所以时长按类型分配而不是全站一个常量。
 * 新增类型时必须在此登记，否则 TS 报错（Record<TransitionType, number> 完备性检查）。
 */
export const TRANSITION_DURATIONS: Record<TransitionType, number> = {
  curtain: TRANSITION_MS,
  "zoom-blur": TRANSITION_MS,
  // 词标需要足够时间被读到，比基准时长长一截
  "type-wipe": 780,
};

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
  /** curtain 面板（curtain / type-wipe 需要） */
  curtainPanel: HTMLElement | null;
  /** 幕布上的超大词标（仅 type-wipe 需要），DOM 上是 curtainPanel 的子级 */
  curtainLabel: HTMLElement | null;
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

  const { exitEl, enterEl, curtainPanel, curtainLabel, finish } = ctx;

  /** 本次切换的总时长与分段点（两段式动画在 HALF 处交接） */
  const TOTAL = TRANSITION_DURATIONS[type];
  const HALF = Math.round(TOTAL / 2);

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
            duration: TOTAL,
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
            duration: TOTAL,
            ease: EASE.expo,
          },
          0
        );
      }
      break;
    }

    case "type-wipe": {
      // 幕布 + 词标：词标是 curtainPanel 的子级，transform 叠加在幕布之上，
      // 因此给它一个反向位移即得到"字比幕布慢半拍"的视差拖尾，
      // 且幕布扫出时词标自然随之离场，不会孤零零留在新页上。

      // ── 前半段：旧页淡出 + 幕布扫入 + 词标反向视差入场 ──
      if (exitEl) {
        tl.add(
          exitEl,
          {
            opacity: [1, 0],
            scale: [1, 0.985],
            duration: HALF,
            ease: EASE.quart,
          },
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
      if (curtainLabel) {
        tl.add(
          curtainLabel,
          {
            translateX: [forward ? "26%" : "-26%", "0%"],
            opacity: [0, 1],
            scale: [1.12, 1],
            duration: HALF,
            ease: EASE.expo,
          },
          0
        );
      }

      // ── 后半段：幕布扫出 + 词标反向拖尾淡出 + 新页淡入 ──
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
      if (curtainLabel) {
        tl.add(
          curtainLabel,
          {
            translateX: ["0%", forward ? "-26%" : "26%"],
            opacity: [1, 0],
            scale: [1, 0.94],
            duration: HALF,
            ease: EASE.quart,
          },
          HALF
        );
      }
      if (enterEl) {
        tl.add(
          enterEl,
          {
            opacity: [0, 1],
            scale: [1.015, 1],
            duration: HALF,
            ease: EASE.quart,
          },
          HALF
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
