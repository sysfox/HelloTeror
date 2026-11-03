"use client";

import Image from "next/image";
import { Activity, Building2, MapPin } from "lucide-react";
import { useT } from "@/contexts/LocaleContext";

const AVATAR = "https://avatars.githubusercontent.com/u/99103591?v=4";

/** 确定性条码宽度（不用 Math.random：同一渲染必须稳定，避免 hydration 抖动） */
const BARS = [3, 1, 2, 4, 1, 3, 1, 2, 4, 2, 1, 3, 2, 1];

/**
 * 身份档案块：竖向索引轨（DOSSIER 01–04）+ 头像 + 身份/所属/位置读数。
 * 作为 DossierPanel 的 body 使用，外层由 AboutSection 套 TiltCard 做 3D 倾斜。
 * 头像只做透明度叠层，不使用 filter —— 转场退出快照会强制 filter:none，
 * 常驻滤镜会在切页瞬间跳变（CLAUDE.md 记录的约束）。
 */
export function IdentityBlock({ affiliation }: { affiliation: string }) {
  const t = useT();

  const meta = [
    {
      key: "affiliation",
      icon: Building2,
      label: t.about.factAffiliation,
      value: affiliation,
    },
    {
      key: "location",
      icon: MapPin,
      label: t.about.factLocation,
      value: t.about.factLocationValue,
    },
    {
      key: "status",
      icon: Activity,
      label: "LINK",
      value: t.common.online,
    },
  ] as const;

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* 竖向索引轨 */}
      <div
        aria-hidden
        className="flex w-9 shrink-0 flex-col items-center gap-4 border-r py-4"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface)",
        }}
      >
        <span
          className="font-mono text-[8px]"
          style={{
            writingMode: "vertical-rl",
            letterSpacing: "0.34em",
            color: "var(--text-tertiary)",
          }}
        >
          DOSSIER
        </span>
        <span
          className="h-8 w-px"
          style={{
            background:
              "linear-gradient(180deg, var(--accent-border, rgba(90,242,255,0.42)), transparent)",
          }}
        />
        <div className="flex flex-col items-center gap-3">
          {["01", "02", "03", "04"].map((n, i) => (
            <span key={n} className="flex flex-col items-center gap-1">
              <span
                className="font-mono text-[8px] tabular-nums"
                style={{
                  color: i === 0 ? "var(--accent)" : "var(--text-tertiary)",
                }}
              >
                {n}
              </span>
              <span
                className="h-px w-2"
                style={{
                  background:
                    i === 0
                      ? "var(--accent-border, rgba(90,242,255,0.42))"
                      : "var(--border-subtle)",
                }}
              />
            </span>
          ))}
        </div>
        <span
          className="mt-auto font-mono text-[8px] tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          01
        </span>
      </div>

      {/* 主体 */}
      <div className="relative flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div aria-hidden className="mb-3 flex items-center gap-2">
          <span
            className="font-mono text-[9px] tracking-[0.24em]"
            style={{ color: "var(--accent)" }}
          >
            {"// IDENTITY"}
          </span>
          <span
            className="h-px flex-1"
            style={{ background: "var(--border-subtle)" }}
          />
          <span
            className="font-mono text-[8px] tabular-nums"
            style={{ color: "var(--text-tertiary)" }}
          >
            0x01
          </span>
        </div>

        {/* 头像：斜切角框 + 扫描叠层 */}
        <div className="relative h-24 w-24 sm:h-28 sm:w-28">
          <div
            className="relative h-full w-full overflow-hidden border"
            style={{
              borderColor: "var(--border-strong)",
              clipPath: "polygon(0 0, 100% 0, 100% 76%, 76% 100%, 0 100%)",
            }}
          >
            <Image
              src={AVATAR}
              alt="Teror Fox"
              width={112}
              height={112}
              unoptimized
              className="h-full w-full object-cover"
              style={{ opacity: 0.92 }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 40%, var(--accent-soft, rgba(90,242,255,0.1)) 100%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)",
              }}
            />
          </div>
          <span
            aria-hidden
            className="absolute -left-1 -top-1 h-3 w-3"
            style={{
              borderTop: "1px solid var(--accent)",
              borderLeft: "1px solid var(--accent)",
            }}
          />
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 h-3 w-3"
            style={{
              borderBottom: "1px solid var(--accent)",
              borderRight: "1px solid var(--accent)",
            }}
          />
        </div>

        <h3
          className="mt-4 text-xl font-semibold sm:text-2xl"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Teror Fox
        </h3>
        <p
          className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: "var(--accent)" }}
        >
          {t.about.factRoleValue}
        </p>

        <div
          className="mt-4 space-y-2 border-t pt-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {meta.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex min-w-0 items-center gap-2"
              >
                <Icon
                  size={12}
                  className="shrink-0"
                  style={{ color: "var(--accent)" }}
                />
                <span
                  className="shrink-0 font-mono text-[8px] uppercase tracking-[0.2em]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {item.label}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-right text-[10px] font-medium sm:text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* 条码 + 签名：纯装饰，填满档案块的工业感 */}
        <div aria-hidden className="mt-auto flex items-end gap-3 pt-4">
          <div className="flex h-4 items-end gap-[2px]">
            {BARS.map((w, i) => (
              <span
                key={i}
                style={{
                  width: w,
                  height: 14,
                  background: "var(--text-tertiary)",
                  opacity: i % 3 === 0 ? 0.7 : 0.35,
                }}
              />
            ))}
          </div>
          <span
            className="font-mono text-[8px] uppercase tracking-[0.24em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            SIG 0x5AF2
          </span>
        </div>
      </div>
    </div>
  );
}
