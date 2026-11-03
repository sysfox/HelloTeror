"use client";

import { useState } from "react";
import type { BlogPost } from "@/types";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { BlogEntry } from "./BlogEntry";
import { formatPostDate } from "./formatPostDate";

/**
 * 归档列表（简化版）：去掉时间轴脊线、菱形节点与三色轮转，
 * 保留日期 / 分类 / 标题 / 摘要的清晰层级。
 */
type BlogArchiveProps = {
  posts: BlogPost[];
  intlLocale: string;
  reducedMotion: boolean;
};

export function BlogArchive({
  posts,
  intlLocale,
  reducedMotion,
}: BlogArchiveProps) {
  // 同一时刻只展开一条；用 id 而非索引，数据刷新后不会串行
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div role="list">
      <StaggerGroup
        className="flex flex-col gap-2.5"
        startDelay={480}
        staggerMs={70}
        from="first"
      >
        {posts.map((post) => (
          <div key={post.id} data-stagger-item role="listitem">
            <BlogEntry
              post={post}
              formattedDate={formatPostDate(post.date, intlLocale)}
              active={activeId === post.id}
              reducedMotion={reducedMotion}
              onActivate={() => setActiveId(post.id)}
              onDeactivate={() =>
                // 只清除自己：A 的 mouseleave 可能晚于 B 的 mouseenter
                setActiveId((current) => (current === post.id ? null : current))
              }
            />
          </div>
        ))}
      </StaggerGroup>
    </div>
  );
}
