"use client";

import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useT } from "@/contexts/LocaleContext";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { TECH } from "./techData";
import styles from "./tech.module.css";

/**
 * 窄屏回退：横向分类选择器 + 明细面板。
 *
 * 3D 轨道在手机上既费性能又难以点中，因此退化为标准 tablist：
 * - 原生 button → 可 Tab 聚焦、可回车/空格切换
 * - 左右方向键 + Home/End 在分类间移动（aria 规范做法）
 * - 被遮住的 info 只在当前面板渲染，不会把 5 个分类全读一遍
 */
export function TechMobileSelector() {
  const t = useT();
  const [activeId, setActiveId] = useState(TECH[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = Math.max(
    0,
    TECH.findIndex((cat) => cat.id === activeId)
  );
  const active = TECH[activeIndex];

  const moveTo = (index: number) => {
    const next = (index + TECH.length) % TECH.length;
    setActiveId(TECH[next].id);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveTo(activeIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveTo(activeIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      moveTo(TECH.length - 1);
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={t.tech.label}
        className={styles.tabRow}
        onKeyDown={onKeyDown}
      >
        {TECH.map((cat, i) => {
          const selected = cat.id === activeId;
          return (
            <button
              key={cat.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tech-tab-${cat.id}`}
              aria-selected={selected}
              aria-controls="tech-tabpanel"
              tabIndex={selected ? 0 : -1}
              data-active={selected}
              className={styles.tab}
              onClick={() => setActiveId(cat.id)}
            >
              {t.tech[cat.labelKey]}
            </button>
          );
        })}
      </div>

      {/* key 绑定 active：切换分类时整块面板重挂载，重播材质化入场 */}
      <StaggerGroup
        key={active.id}
        startDelay={40}
        staggerMs={0}
        y={16}
        scale={0.98}
        duration={520}
      >
        <div
          data-stagger-item
          role="tabpanel"
          id="tech-tabpanel"
          aria-labelledby={`tech-tab-${active.id}`}
          className={styles.panel}
        >
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>
              {t.tech[active.labelKey]}
            </span>
          </div>
          <ul className={styles.panelList}>
            {active.items.map((item) => (
              <li key={item.name} className={styles.panelItem}>
                <span>{item.name}</span>
                {item.primary && (
                  <span className={styles.panelPrimary}>
                    {t.tech.notePrimary}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </StaggerGroup>
    </div>
  );
}
