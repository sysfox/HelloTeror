"use client";

import { SectionHeading } from "@/components/animations/SectionHeading";
import { useT } from "@/contexts/LocaleContext";
import { TechOrbit } from "./sections/tech/TechOrbit";
import { TechMobileSelector } from "./sections/tech/TechMobileSelector";
import styles from "./sections/tech/tech.module.css";

/**
 * Tech 页：桌面端是围绕中央节点的轨道布局，窄屏退化为
 * 横向 tablist + 明细面板（见 TechMobileSelector）。
 *
 * 内容与数据完全保留：分类/条目仍来自 TECH（TechCategory[]），
 * 文案仍走字典。两侧同时挂载、用 CSS 断点切换，避免 JS 媒体查询
 * 在 SSR 首帧产生水合不一致；隐藏侧不产生可见动画。
 */
export function TechStackSection() {
  const t = useT();

  return (
    <section
      id="tech"
      className="relative isolate w-full h-full flex items-center justify-center px-5 sm:px-6"
    >
      <div className="relative isolate w-full max-w-5xl max-h-full overflow-y-auto no-scrollbar py-12">
        <SectionHeading index="02" label={t.tech.label} title={t.tech.title} />
        <p
          className="fade-up-soft text-sm sm:text-base mb-6"
          style={{ animationDelay: "350ms", color: "var(--text-tertiary)" }}
        >
          {t.tech.subtitle}
        </p>

        {/* 桌面：3D 轨道阵列 */}
        <div className="hidden lg:block">
          <TechOrbit />
        </div>

        {/* 窄屏：分类选择器 + 面板 */}
        <div className="lg:hidden">
          <TechMobileSelector />
        </div>

        {/* 尾部「仍在学习」状态行（保留原 moreLine1/2 文案） */}
        <p className={styles.moreLine}>
          <span>{t.tech.moreLine1}</span>
          <span aria-hidden style={{ color: "var(--text-tertiary)" }}>
            ·
          </span>
          <span>{t.tech.moreLine2}</span>
        </p>
      </div>
    </section>
  );
}
