import type {
  ContributionCalendar,
  ContributionDay,
  GitHubStatsResponse,
  ProjectItem,
} from "@/types";

/**
 * GitHub 数据获取 —— 服务端专用（Route Handler 调用）。
 *
 * pinned 仓库 + 贡献统计均走 GraphQL（强制鉴权）；stars earned 用 GraphQL 聚合。
 * Token 通过 `GITHUB_TOKEN` 配置（fine-grained 只读即可），用户名 `GITHUB_USERNAME`（默认 sysfox）。
 * ISR 缓存 1 小时；无 Token 或请求失败 → 返回 FALLBACK_*，站点永不退化。
 */

const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "sysfox";
const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`GitHub GraphQL responded ${res.status}`);

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "GitHub GraphQL error");
  }
  if (!json.data) throw new Error("GitHub GraphQL returned no data");
  return json.data;
}

/* ---------------------------------- 项目 ---------------------------------- */

interface PinnedRepo {
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
  owner: { login: string };
}

const PINNED_QUERY = `
  query($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            nameWithOwner
            description
            url
            stargazerCount
            forkCount
            primaryLanguage { name }
            owner { login }
          }
        }
      }
    }
  }
`;

/** 获取 GitHub pinned 仓库，映射到 ProjectItem。contribution = 非 owner。 */
export async function fetchPinnedProjects(): Promise<ProjectItem[]> {
  if (!process.env.GITHUB_TOKEN) return FALLBACK_PROJECTS;
  try {
    const data = await gql<{
      user: { pinnedItems: { nodes: PinnedRepo[] } } | null;
    }>(PINNED_QUERY, { login: GITHUB_USERNAME });

    const repos = data.user?.pinnedItems.nodes ?? [];
    if (repos.length === 0) return FALLBACK_PROJECTS;

    return repos.map((r) => ({
      id: r.nameWithOwner,
      name: r.name,
      owner: r.owner.login,
      description: r.description ?? "",
      language: r.primaryLanguage?.name ?? "Unknown",
      stars: r.stargazerCount,
      forks: r.forkCount,
      url: r.url,
      contribution: r.owner.login !== GITHUB_USERNAME,
    }));
  } catch {
    return FALLBACK_PROJECTS;
  }
}

/* ---------------------------------- 统计 ---------------------------------- */

/** GitHub 的 contributionLevel 枚举 → 0~4 */
const CONTRIBUTION_LEVELS: Record<string, ContributionDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface RawContributionDay {
  contributionCount: number;
  date: string;
  contributionLevel: string;
}

interface RawCalendar {
  totalContributions: number;
  weeks: { contributionDays: RawContributionDay[] }[];
}

interface StatsData {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalRepositoryContributions: number;
      contributionCalendar: RawCalendar;
    };
    repositories: {
      totalCount: number;
      nodes: { stargazerCount: number }[];
    };
    followers: { totalCount: number };
  } | null;
}

const STATS_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoryContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              contributionLevel
            }
          }
        }
      }
      repositories(first: 100, privacy: PUBLIC, ownerAffiliations: OWNER) {
        totalCount
        nodes { stargazerCount }
      }
      followers { totalCount }
    }
  }
`;

/** 日期串 → 星期几（0=周日）。固定 UTC，与 GitHub 的日历口径一致。 */
function weekdayOf(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

/**
 * 归一化 GitHub 的周列表：每周补齐为 7 项（周日→周六），窗口外的格子为 null。
 *
 * 必要性：统计窗口是"本年 1/1 → 次年 1/1"，而 GitHub 的周以周日为界，
 * 因此首周只含 1/1 之后的几天、末周只到今天 —— 两头都是不足 7 天的短周。
 * 在服务端按 weekday 落位补 null，客户端渲染就不用再处理边界。
 */
function normalizeCalendar(raw: RawCalendar): ContributionCalendar {
  const weeks = raw.weeks.map((week) => {
    const slots: (ContributionDay | null)[] = Array.from({ length: 7 }, () => null);
    for (const day of week.contributionDays) {
      slots[weekdayOf(day.date)] = {
        date: day.date,
        count: day.contributionCount,
        level: CONTRIBUTION_LEVELS[day.contributionLevel] ?? 0,
      };
    }
    return slots;
  });

  return { total: raw.totalContributions, weeks };
}

/**
 * 获取 GitHub 贡献统计。时间窗口为本年（UTC）。
 * stars earned = 本人 public 仓库 stargazerCount 之和（最多聚合 100 个，足够覆盖当前规模）。
 * contributedTo 用 totalRepositoryContributions 近似。
 */
export async function fetchGitHubStats(): Promise<GitHubStatsResponse> {
  if (!process.env.GITHUB_TOKEN) return FALLBACK_STATS;
  try {
    const year = new Date().getUTCFullYear();
    const data = await gql<StatsData>(STATS_QUERY, {
      login: GITHUB_USERNAME,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year + 1}-01-01T00:00:00Z`,
    });

    if (!data.user) return FALLBACK_STATS;
    const cc = data.user.contributionsCollection;
    const stars = data.user.repositories.nodes.reduce(
      (sum, r) => sum + r.stargazerCount,
      0
    );

    return {
      commits: cc.totalCommitContributions,
      prs: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      contributedTo: cc.totalRepositoryContributions,
      repos: data.user.repositories.totalCount,
      followers: data.user.followers.totalCount,
      stars,
      calendar: normalizeCalendar(cc.contributionCalendar),
    };
  } catch {
    return FALLBACK_STATS;
  }
}

/* --------------------------------- 降级数据 -------------------------------- */

export const FALLBACK_PROJECTS: ProjectItem[] = [
  {
    id: "qexo",
    name: "Qexo",
    owner: "Qexo",
    description:
      "A fast, powerful and beautiful online manager for all static blog frameworks.",
    language: "Python",
    stars: 1900,
    forks: 409,
    url: "https://github.com/Qexo/Qexo",
    contribution: true,
  },
  {
    id: "mx-core",
    name: "core",
    owner: "mx-space",
    description:
      "AI-powered CMS core for personal blogs and creator websites, with AI summaries and translation.",
    language: "TypeScript",
    stars: 538,
    forks: 150,
    url: "https://github.com/mx-space/core",
    contribution: true,
  },
  {
    id: "koishi-imx",
    name: "koishi-plugin-imx",
    owner: "sysfox",
    description:
      "Mix-Space Bot for Koishi — 集成多种功能的聊天机器人插件。",
    language: "TypeScript",
    stars: 2,
    forks: 0,
    url: "https://github.com/sysfox/koishi-plugin-imx",
  },
];

/**
 * 降级热图：从本年 1/1 到今天，按确定性伪随机填充。
 *
 * 刻意不用 Math.random —— 降级数据必须跨请求稳定，否则同一进程内每次
 * 请求得到不同热图，客户端 useApiData 的缓存会在视觉上"跳变"。
 * 用乘法散列 + 周末衰减，让形态看起来像真实活跃度而非均匀噪声。
 */
function buildFallbackCalendar(): ContributionCalendar {
  const now = new Date();
  const year = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const today = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate()));

  const weeks: (ContributionDay | null)[][] = [];
  let total = 0;
  let index = 0;

  // 从本年首周的周日开始，逐周填充到今天所在周
  const cursor = new Date(start);
  cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());

  while (cursor <= today) {
    const slots: (ContributionDay | null)[] = Array.from({ length: 7 }, () => null);
    for (let weekday = 0; weekday < 7; weekday++) {
      const day = new Date(cursor);
      day.setUTCDate(day.getUTCDate() + weekday);
      // 窗口外（本年之前 / 今天之后）留 null
      if (day < start || day > today) continue;

      const hash = (index * 2654435761) % 97;
      const score = hash - (weekday === 0 || weekday === 6 ? 30 : 0);
      const level: ContributionDay["level"] =
        score < 24 ? 0 : score < 48 ? 1 : score < 70 ? 2 : score < 86 ? 3 : 4;
      const count = level === 0 ? 0 : level * 3 + (hash % 4);
      total += count;

      slots[weekday] = {
        date: day.toISOString().slice(0, 10),
        count,
        level,
      };
      index++;
    }
    weeks.push(slots);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return { total, weeks };
}

export const FALLBACK_STATS: GitHubStatsResponse = {
  commits: 1886,
  prs: 82,
  issues: 84,
  contributedTo: 32,
  repos: 98,
  followers: 71,
  stars: 12,
  calendar: buildFallbackCalendar(),
};
