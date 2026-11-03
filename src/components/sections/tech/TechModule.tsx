"use client";

import { Code2 } from "lucide-react";
import { TiltCard } from "@/components/animations/TiltCard";
import { useT } from "@/contexts/LocaleContext";
import type { TechCategory } from "@/types";
import { TECH_ICONS } from "./techData";
import styles from "./tech.module.css";

/**
 * 轨道上的单个技术模块（简化版）：图标 + 分类名 + 条目列表。
 * 去掉角标、序号与扫描带，保留 hover 聚焦与 3D 槽位深度。
 */
export function TechModule({
  category,
  active,
  dimmed,
  onActivate,
  onDeactivate,
}: {
  category: TechCategory;
  active: boolean;
  dimmed: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const t = useT();
  const Icon = TECH_ICONS[category.icon] ?? Code2;
  const label = t.tech[category.labelKey];

  return (
    <TiltCard maxTilt={4} scale={1.01}>
      <article
        role="group"
        tabIndex={0}
        aria-label={label}
        data-active={active}
        className={styles.module}
        style={{ opacity: dimmed ? 0.4 : 1 }}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
      >
        <div className={styles.moduleHead}>
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
      </article>
    </TiltCard>
  );
}
