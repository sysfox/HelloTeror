import type { ProjectItem } from "@/types";

/**
 * 语言 → HUD 强调色。
 *
 * 刻意不用 GitHub 官方语言色：新设计只有青 / 洋红 / 琥珀 / 紫四色叙事，
 * 且必须随亮暗主题切换，所以映射到 CSS token 而不是硬编码 hex。
 */
const LANGUAGE_ACCENTS: Record<string, string> = {
  TypeScript: "var(--accent)",
  JavaScript: "var(--accent-3)",
  Python: "var(--accent-3)",
  Rust: "var(--accent-2)",
  Go: "var(--accent)",
  HTML: "var(--accent-2)",
  CSS: "var(--accent-4)",
  Shell: "var(--accent-3)",
  Vue: "var(--accent)",
};

export function languageAccent(language: string): string {
  return LANGUAGE_ACCENTS[language] ?? "var(--accent-4)";
}

/** 大数字缩写：1900 → 1.9k。HUD 读数字段很窄，避免换行。 */
export function formatCompactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/**
 * 面板底部的话题条。
 * ProjectItem 契约里没有 topics 字段（GitHub pinned 仓库 GraphQL 未请求），
 * 因此用真实元数据派生标签，而不是编造文本。
 */
export function projectTopics(project: ProjectItem): string[] {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return [`#${slug(project.language)}`, `#${slug(project.owner)}`];
}
