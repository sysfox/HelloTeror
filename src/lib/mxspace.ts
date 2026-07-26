import type { BlogPost } from "@/types";

/**
 * MX-Space core (v3) 数据获取 —— 服务端专用（Route Handler 调用）。
 *
 * 网关地址通过 `MXSPACE_API_BASE` 配置。为兼容用户填入完整 posts URL 的情况，
 * `resolveApiBase()` 会自动剥掉末尾的 `/posts`，得到 v3 根（如 https://mx.trfox.top/api/v3）。
 * 博客前台地址通过 `BLOG_BASE_URL` 配置（默认 https://blog.trfox.top）。
 *
 * 降级：env 未配置或上游请求失败 → 返回 FALLBACK_POSTS，站点永不退化。
 */

const BLOG_BASE_URL =
  process.env.BLOG_BASE_URL?.replace(/\/$/, "") ?? "https://blog.trfox.top";

/**
 * 规范化为 ISO 日期串（YYYY-MM-DD，UTC）。
 * 不在服务端做显示格式化：日期文案需随 locale 变化，
 * 而 locale 是客户端状态，故只输出与语言无关的 ISO，由 BlogSection 用 Intl 渲染。
 */
function toIsoDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** 解析 MXSPACE_API_BASE → v3 根 URL，兼容末尾带 /posts 或 / 的写法。 */
function resolveApiBase(): string | null {
  const raw = process.env.MXSPACE_API_BASE;
  if (!raw) return null;
  let base = raw.trim().replace(/\/+$/, "");
  // 用户可能直接粘贴了完整 posts 端点
  if (base.endsWith("/posts")) base = base.slice(0, -"/posts".length);
  return base;
}

interface MxPost {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  modified_at?: string | null;
  created_at?: string | null;
  category?: { name: string; slug: string } | null;
}

interface MxNote {
  id: string;
  nid: number;
  title: string;
  slug: string;
  modified_at?: string | null;
  created_at?: string | null;
  topic?: { name: string; slug: string } | null;
}

interface MxListResponse<T> {
  data?: T[];
}

/** 合并后的中间结构，带排序键。 */
interface PostWithSort extends BlogPost {
  _sort: number;
}

function toPosts(items: MxPost[]): PostWithSort[] {
  return items.map((p) => {
    const sortIso = p.modified_at ?? p.created_at;
    const categorySlug = p.category?.slug;
    const url = categorySlug
      ? `${BLOG_BASE_URL}/posts/${categorySlug}/${p.slug}`
      : `${BLOG_BASE_URL}/posts/${p.slug}`;
    return {
      id: p.id,
      title: p.title,
      date: toIsoDate(sortIso),
      category: p.category?.name ?? "文章",
      url,
      excerpt: p.summary ?? undefined,
      _sort: sortIso ? new Date(sortIso).getTime() : 0,
    };
  });
}

function toNotes(items: MxNote[]): PostWithSort[] {
  return items.map((n) => {
    const sortIso = n.modified_at ?? n.created_at;
    return {
      id: `note-${n.nid}`,
      title: n.title,
      date: toIsoDate(sortIso),
      category: "笔记",
      url: `${BLOG_BASE_URL}/notes/${n.nid}`,
      _sort: sortIso ? new Date(sortIso).getTime() : 0,
    };
  });
}

/**
 * 获取最近文章（posts + notes 合并，按更新时间降序取前 5）。
 * ISR 缓存 30 分钟；失败回退 FALLBACK_POSTS。
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const base = resolveApiBase();
  if (!base) return FALLBACK_POSTS;

  try {
    const [postsRes, notesRes] = await Promise.all([
      fetch(`${base}/posts?size=10&page=1`, { next: { revalidate: 1800 } }),
      fetch(`${base}/notes?size=10&page=1`, { next: { revalidate: 1800 } }),
    ]);

    if (!postsRes.ok || !notesRes.ok) return FALLBACK_POSTS;

    const postsJson = (await postsRes.json()) as MxListResponse<MxPost>;
    const notesJson = (await notesRes.json()) as MxListResponse<MxNote>;

    const merged = [
      ...toPosts(postsJson.data ?? []),
      ...toNotes(notesJson.data ?? []),
    ];

    if (merged.length === 0) return FALLBACK_POSTS;

    merged.sort((a, b) => b._sort - a._sort);
    // _sort 仅用于排序，此处 destructure rest 排除该内部字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return merged.slice(0, 5).map(({ _sort, ...post }) => post);
  } catch {
    return FALLBACK_POSTS;
  }
}

/** 降级数据：env 未配置或上游失败时使用。 */
export const FALLBACK_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Oh-My-Posh 调教全记录：从报错到完美配置",
    date: "2026-06-23",
    category: "开发",
    url: "https://blog.trfox.top/posts/develope/struggle-installing-oh-my-posh",
  },
  {
    id: "2",
    title: "我是如何水到 Qexo 的一个高危漏洞的（9.3分）？",
    date: "2026-05-02",
    category: "网络安全",
    url: "https://blog.trfox.top/posts/cybersecurity/how-i-found-qexo-high-risk-vulnerability",
  },
  {
    id: "3",
    title: "迷茫中的希望",
    date: "2026-03-28",
    category: "笔记",
    url: "https://blog.trfox.top/notes/14",
  },
  {
    id: "4",
    title: "Tinder 开发笔记——随想象一路前进",
    date: "2026-02-22",
    category: "开发笔记",
    url: "https://blog.trfox.top/posts/develope/tinder-development-notes-exploration",
  },
  {
    id: "5",
    title: "测试工程师的笑话中包含哪些你必须知道的内容？",
    date: "2026-02-17",
    category: "开发笔记",
    url: "https://blog.trfox.top/posts/develope/essential-content-in-test-engineer-jokes",
  },
];
