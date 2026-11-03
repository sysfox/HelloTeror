import {
  Code2,
  Layers,
  Server,
  Database,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { TechCategory } from "@/types";

/**
 * 技术分类数据：保持与旧版完全一致（id / labelKey / icon / items 全部来自
 * 字典与类型约束），UI 重构只换呈现方式，不动内容。
 */
export const TECH: TechCategory[] = [
  {
    id: "langs",
    labelKey: "catLangs",
    icon: "code",
    items: [
      { name: "TypeScript", primary: true },
      { name: "Python", primary: true },
    ],
  },
  {
    id: "frontend",
    labelKey: "catFrontend",
    icon: "layers",
    items: [{ name: "React" }, { name: "Next.js" }],
  },
  {
    id: "backend",
    labelKey: "catBackend",
    icon: "server",
    items: [
      { name: "NestJS" },
      { name: "Node.js" },
      { name: "FastAPI" },
    ],
  },
  {
    id: "infra",
    labelKey: "catInfra",
    icon: "database",
    items: [
      { name: "Docker" },
      { name: "Redis" },
      { name: "PostgreSQL" },
      { name: "MongoDB" },
      { name: "MariaDB" },
    ],
  },
  {
    id: "tools",
    labelKey: "catTools",
    icon: "wrench",
    items: [
      { name: "VS Code" },
      { name: "Cursor" },
      { name: "macOS" },
      { name: "Ubuntu" },
    ],
  },
];

export const TECH_ICONS: Record<string, LucideIcon> = {
  code: Code2,
  layers: Layers,
  server: Server,
  database: Database,
  wrench: Wrench,
};

/**
 * 轨道槽位（百分比定位 + Z 深度）。
 * - x/y 是模块左上角在舞台内的百分比，避免百分比 translate 与 anime 的
 *   transform 动画互相覆盖（StaggerGroup 会写 translateY/scale）。
 * - z 决定前后层次：正值为前景、负值被核心遮挡，制造真正的体积感。
 */
export const TECH_SLOTS = [
  { x: 6, y: 9, z: 70 }, // Languages：左上前景
  { x: 64, y: 1, z: -80 }, // Frontend：右上远景
  { x: 0, y: 46, z: -110 }, // Backend：左侧最远
  { x: 74, y: 41, z: 90 }, // Infra：右侧前景
  { x: 36, y: 60, z: 130 }, // Tools：正下方最近
] as const;
