"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  animate,
  stagger,
  EASE,
  prefersReducedMotion,
} from "@/lib/anime";
import { useLocale } from "@/contexts/LocaleContext";
import { TECH, TECH_SLOTS } from "./techData";
import { TechModule } from "./TechModule";
import { Brackets } from "./Brackets";
import styles from "./tech.module.css";

/**
 * 桌面端「轨道技术阵列」。
 *
 * 结构（由外到内）：
 *   stage(perspective) → camera(JS 指针视差) → 中央线框核心 + 技术模块槽位
 *
 * 为什么槽位用 left/top 百分比而不是 translate 定位：入场动画会写
 * translateY/scale，若槽位本身依赖 transform 定位，动画会覆盖布局位置。
 * 3D 深度则放在更深一层的 .float（translateZ），与入场 transform 分层。
 *
 * 视差用 rAF 节流 + 阻尼逼近：pointermove 只记录目标值，真正的写样式集中在
 * 一帧一次，避免高频事件触发大量样式计算。reduced-motion 时完全不挂监听。
 */

/** 视差阻尼系数：越大越跟手，越小越「重」 */
const PARALLAX_DAMPING = 0.12;
/** 最大偏转角度 */
const MAX_ROTATE_X = 5;
const MAX_ROTATE_Y = 7;

export function TechOrbit() {
  const { t, intlLocale } = useLocale();
  const [activeId, setActiveId] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  /**
   * 指针视差。
   *
   * 监听挂在 DOM 上而不是 React 事件属性上：rAF 循环是自引用的，
   * 放进 effect 里可以用闭包局部变量（target/current/raf），
   * 既不需要 ref 也不需要 useCallback 自引用。
   */
  useEffect(() => {
    const stage = stageRef.current;
    const camera = cameraRef.current;
    if (!stage || !camera) return;
    // reduced-motion 或纯触屏：不挂监听，省掉整条 rAF 链路
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf: number | null = null;

    const tick = () => {
      current.x += (target.x - current.x) * PARALLAX_DAMPING;
      current.y += (target.y - current.y) * PARALLAX_DAMPING;

      camera.style.transform = `rotateX(${(-current.y * MAX_ROTATE_X).toFixed(
        3
      )}deg) rotateY(${(current.x * MAX_ROTATE_Y).toFixed(3)}deg)`;

      // 未收敛则继续下一帧；收敛后停掉，避免空转
      if (
        Math.abs(target.x - current.x) > 0.0005 ||
        Math.abs(target.y - current.y) > 0.0005
      ) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    const kick = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      target.x = (e.clientX - rect.left) / rect.width - 0.5;
      target.y = (e.clientY - rect.top) / rect.height - 0.5;
      kick();
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };

    stage.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  /**
   * 槽位入场。
   *
   * 这里**不用** StaggerGroup：它会给每个子项动画 filter / clip-path，
   * 而 filter 属于 grouping property，会把子项的 preserve-3d 强制压平，
   * 槽位内部的 translateZ 深度随即失效。改为只动 opacity/translateY/scale
   *（纯 2D transform），Z 深度继续由 .float 承担。
   * 初始 opacity:0 写在 CSS 里（FOUC 安全），reduced-motion 时 effect 直接置 1。
   */
  useEffect(() => {
    const root = slotsRef.current;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-orbit-item]")
    );
    if (!items.length) return;

    if (prefersReducedMotion()) {
      items.forEach((item) => {
        item.style.opacity = "1";
      });
      return;
    }

    const anim = animate(items, {
      opacity: [0, 1],
      translateY: [52, 0],
      scale: [0.9, 1],
      delay: stagger(85, { from: "center", start: 420 }),
      duration: 900,
      ease: EASE.expo,
    });

    return () => {
      anim.revert();
    };
  }, []);

  const active = TECH.find((cat) => cat.id === activeId) ?? null;
  const nodeCount = active
    ? active.items.length
    : TECH.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div ref={stageRef} className={styles.stage}>
      <div aria-hidden className={styles.floorGrid} />
      <div aria-hidden className={styles.axisLineH} />
      <div aria-hidden className={styles.axisLineV} />
      <div aria-hidden className={styles.beam} />
      <Brackets color="var(--accent-border)" size={14} inset={8} />

      <div ref={cameraRef} className={styles.camera}>
        {/* 连接线画在相机内部（z=0 平面），随视角一起倾斜 */}
        <svg
          className={styles.connectors}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {TECH_SLOTS.map((slot, i) => {
            const id = TECH[i].id;
            const dim = activeId !== null && activeId !== id;
            const x2 = slot.x + 10;
            const y2 = slot.y + 10;
            return (
              <g
                key={id}
                style={{
                  opacity: dim ? 0.22 : 1,
                  transition: "opacity 0.35s ease",
                }}
              >
                <line
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke="var(--accent-border)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  className={styles.dashLine}
                  stroke="var(--accent)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>

        {/* 中央线框核心：三道轨道环 + 线框立方体 + 光点 */}
        <div aria-hidden className={styles.core}>
          <div className={styles.coreGlow} />
          <div className={styles.coreHalo} />
          <div className={styles.coreSpin}>
            <span
              className={styles.ring}
              style={{ transform: "rotateX(72deg) rotateZ(10deg)" }}
            />
            <span
              className={styles.ring}
              style={{ transform: "rotateY(72deg) rotateZ(-10deg)" }}
            />
            <span
              className={styles.ring}
              style={{ transform: "rotateX(16deg) rotateY(16deg)" }}
            />
            <div className={styles.cube}>
              <span className={`${styles.face} ${styles.faceFront}`} />
              <span className={`${styles.face} ${styles.faceBack}`} />
              <span className={`${styles.face} ${styles.faceRight}`} />
              <span className={`${styles.face} ${styles.faceLeft}`} />
              <span className={`${styles.face} ${styles.faceTop}`} />
              <span className={`${styles.face} ${styles.faceBottom}`} />
            </div>
          </div>
          <span className={styles.coreDot} />
        </div>

        {/* 分类模块槽位：入场动画只作用在槽位 wrapper 上 */}
        <div ref={slotsRef} className={styles.slots}>
          {TECH.map((cat, i) => {
            const slot = TECH_SLOTS[i];
            return (
              <div
                key={cat.id}
                data-orbit-item
                className={styles.slot}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              >
                <div
                  className={styles.float}
                  style={
                    {
                      "--z": `${slot.z}px`,
                      "--float-dur": `${6.8 + i * 0.6}s`,
                      "--float-delay": `${i * 0.4}s`,
                    } as CSSProperties
                  }
                >
                  {/* 入场层放在 translateZ 之内：opacity<1 会压平 preserve-3d，
                      若把动画加在槽位上，模块会在淡入结束后突然「跳」到自己的 Z 深度 */}
                  <div data-orbit-item className={styles.intro}>
                    <TechModule
                      category={cat}
                      index={i}
                      active={activeId === cat.id}
                      dimmed={activeId !== null && activeId !== cat.id}
                      onActivate={() => setActiveId(cat.id)}
                      onDeactivate={() => setActiveId(null)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 左下角状态读数：显示当前聚焦分类（无聚焦时回落到整组标签） */}
      <div className={styles.readout}>
        <span className={styles.readoutKey}>{"// 02"}</span>
        <span className={styles.readoutValue}>
          {active ? t.tech[active.labelKey] : t.tech.label}
        </span>
        <span className={styles.readoutMeta}>
          {nodeCount.toLocaleString(intlLocale)}
        </span>
      </div>
    </div>
  );
}
