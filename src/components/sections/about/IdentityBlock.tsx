"use client";

import Image from "next/image";
import { Building2, MapPin } from "lucide-react";
import { useT } from "@/contexts/LocaleContext";

const AVATAR = "https://avatars.githubusercontent.com/u/99103591?v=4";

/**
 * 身份档案块（简化版）：头像 + 姓名 + 身份/所属/位置。
 * 去掉竖向索引轨、条码、扫描线与切角框，只保留内容与轻量分隔。
 * 头像不使用 filter —— 转场退出快照会强制 filter:none。
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
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
      <div
        className="h-24 w-24 overflow-hidden border sm:h-28 sm:w-28"
        style={{ borderColor: "var(--border-subtle)", borderRadius: 2 }}
      >
        <Image
          src={AVATAR}
          alt="Teror Fox"
          width={112}
          height={112}
          unoptimized
          className="h-full w-full object-cover"
          style={{ opacity: 0.95 }}
        />
      </div>

      <h3
        className="mt-4 text-xl font-semibold sm:text-2xl"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
      >
        Teror Fox
      </h3>
      <p
        className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em]"
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
            <div key={item.key} className="flex min-w-0 items-center gap-2">
              <Icon
                size={12}
                className="shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              />
              <span
                className="shrink-0 text-[10px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {item.label}
              </span>
              <span
                className="min-w-0 flex-1 truncate text-right text-[11px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
