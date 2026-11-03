"use client";

import { Code2 } from "lucide-react";
import { TiltCard } from "@/components/animations/TiltCard";
import { useT } from "@/contexts/LocaleContext";
import type { TechCategory } from "@/types";
import { TECH_ICONS } from "./techData";
import { Brackets } from "./Brackets";
import styles from "./tech.module.css";

/**
 * 轨道上的单个技术模块（玻璃面板 + 角标 + 能量扫描带）。
 *
 * 交互：hover / focus 上报 active，由 TechOrbit 把其余模块压暗，
 * 形成「聚焦一个节点、其余退入背景」的 HUD 焦点态。
 * tabIndex=0 让键盘用户也能逐个聚焦模块（移动端另有选择器面板）。
 *
 * 注意：模块自身的 3D 深度由外层 .float 的 translateZ 提供，
 * 这里不写 transform，避免和 TiltCard 的 rotateX/rotateY 打架。
 */
export function TechModule({
  category,
  index,
  active,
  dimmed,
  onActivate,
  onDeactivate,
}: {
  category: TechCategory;
  index: number;
  active: boolean;
  dimmed: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const t = useT();
  const Icon = TECH_ICONS[category.icon] ?? Code2;
  const label = t.tech[category.labelKey];

  return (
    <TiltCard maxTilt={5} scale={1.02}>
      <article
        role="group"
        tabIndex={0}
        aria-label={label}
        data-active={active}
        className={styles.module}
        style={{ opacity: dimmed ? 0.32 : 1 }}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
      >
        <Brackets size={8} inset={0} />

        <div className={styles.moduleHead}>
          <span className={styles.moduleIndex}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={styles.moduleIcon}>
            <Icon size={13} />
          </span>
        </div>

        <h3 className={styles.moduleTitle}>{label}</h3>

        <ul className={styles.itemList}>
          {category.items.map((item) => (
            <li key={item.name} className={styles.item}>
              <span aria-hidden className={styles.itemDot} />
              <span>{item.name}</span>
              {item.primary && (
                <span className={styles.primaryTag}>
                  {t.tech.notePrimary}
                </span>
              )}
            </li>
          ))}
        </ul>

        <span aria-hidden className={styles.moduleScan} />
      </article>
    </TiltCard>
  );
}
