"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/anime";

/**
 * Hero 动态装置：Canvas 2D 流场粒子。
 *  - ~120 个粒子沿 sin/cos 组合的伪 noise 角度场流动
 *  - 每帧用半透明黑覆盖造拖尾，粒子以线段形式绘制（速度可视化为笔触）
 *  - 鼠标斥力场：光标半径内粒子被推开（kinetic-tech 交互感）
 *  - 离屏（document.hidden）暂停；reduced-motion 静态绘制一帧点阵
 *  - DPR 自适应 + resize 重布粒子；pointer-events:none 不挡交互
 *
 * 叠加在 AnimatedBackground 网格层之上、Hero 文字之下，提供"动画引擎"式的
 * 主视觉动感，与 animejs.com 的装置主视觉对应（用 2D 而非 3D，轻量无依赖）。
 */
type Particle = { x: number; y: number; vx: number; vy: number; life: number };

const PARTICLE_COUNT = 120;
const TRAIL_ALPHA = 0.08;
const FLOW_SCALE = 0.0025;
const MOUSE_RADIUS = 150;
const MOUSE_FORCE = 0.7;
const MAX_SPEED = 1.7;

export function HeroVisual({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const mouse = { x: -9999, y: -9999, active: false };
    const particles: Particle[] = [];

    const readAccent = (): string =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#2997ff";

    let accent = readAccent();

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          life: Math.random() * 300,
        });
      }
    };

    /** 伪 noise 角度场：多频 sin/cos 叠加，输出任意角度 */
    const flowAngle = (x: number, y: number, t: number) => {
      const n =
        Math.sin(x * FLOW_SCALE + t) +
        Math.cos(y * FLOW_SCALE * 1.3 - t * 0.8) +
        Math.sin((x + y) * FLOW_SCALE * 0.6 + t * 0.5);
      return n * Math.PI;
    };

    const draw = () => {
      const t = performance.now() * 0.0002;
      // 拖尾：半透明黑覆盖（而非 clearRect），保留上一帧渐隐
      ctx.fillStyle = `rgba(0,0,0,${TRAIL_ALPHA})`;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const ang = flowAngle(p.x, p.y, t);
        p.vx += Math.cos(ang) * 0.09;
        p.vy += Math.sin(ang) * 0.09;

        // 鼠标斥力
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 0.1) {
            const f = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
            p.vx += (dx / dist) * f;
            p.vy += (dy / dist) * f;
          }
        }

        // 阻尼 + 限速
        p.vx *= 0.94;
        p.vy *= 0.94;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > MAX_SPEED) {
          p.vx = (p.vx / sp) * MAX_SPEED;
          p.vy = (p.vy / sp) * MAX_SPEED;
        }

        const px = p.x;
        const py = p.y;
        p.x += p.vx;
        p.y += p.vy;

        // 环绕边界
        if (p.x < 0) p.x = w;
        else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        else if (p.y > h) p.y = 0;

        p.life++;
        const fade = Math.sin(((p.life % 300) / 300) * Math.PI); // 0~1 呼吸

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = hexToRgba(accent, 0.16 * fade + 0.04);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (running) raf = requestAnimationFrame(draw);
    };

    const staticDraw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(accent, 0.22);
        ctx.fill();
      }
    };

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onResize = () => {
      resize();
      initParticles();
      if (reduce) staticDraw();
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduce && !running) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };
    // 主题切换时刷新 accent 色（下次帧生效）
    const onTheme = () => {
      accent = readAccent();
      if (reduce) staticDraw();
    };

    resize();
    initParticles();

    if (reduce) {
      staticDraw();
    } else {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(draw);
      window.addEventListener("mousemove", onMouse, { passive: true });
      canvas.addEventListener("mouseleave", onMouseLeave);
    }
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    document.documentElement.addEventListener("transitionend", onTheme);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.removeEventListener("transitionend", onTheme);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "none", willChange: "transform" }}
    />
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
