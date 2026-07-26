export interface TechItem {
  name: string;
  /** 主力技术标记，渲染为 t.tech.notePrimary（原 note?: string，改为布尔以便 i18n） */
  primary?: boolean;
}

export interface TechCategory {
  id: string;
  /** 字典键（t.tech 下的分类标签），非显示文案 */
  labelKey: "catLangs" | "catFrontend" | "catBackend" | "catInfra" | "catTools";
  icon: string;
  items: TechItem[];
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  /** Suffix appended after the number, e.g. "+" or "k" */
  suffix?: string;
  /** Optional decimals for non-integer values */
  decimals?: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  owner: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  /** Marks the user's own project vs. a contribution */
  contribution?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  /** ISO 日期串（YYYY-MM-DD）。显示格式由客户端按 locale 用 Intl 渲染。 */
  date: string;
  category: string;
  url: string;
  /** Optional short excerpt */
  excerpt?: string;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  /** Icon key, see components/icons.tsx */
  icon: string;
}

/** 贡献热图的一天。level 由 GitHub 的 contributionLevel 枚举映射而来（0=无）。 */
export interface ContributionDay {
  /** ISO 日期串（YYYY-MM-DD） */
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * 贡献热图。weeks 为周列表，每周**恒为 7 项**（周日→周六）；
 * 落在统计窗口外的格子为 null，由服务端补齐，客户端无需再判边界。
 */
export interface ContributionCalendar {
  total: number;
  weeks: (ContributionDay | null)[][];
}

/**
 * Raw GitHub stats from the `/api/github/stats` route.
 * Icons / labels are mapped client-side in StatsSection by id;
 * the API only returns the numeric values.
 */
export interface GitHubStatsResponse {
  /** Commits this year (contributionsCollection.totalCommitContributions) */
  commits: number;
  /** Pull requests (totalPullRequestContributions) */
  prs: number;
  /** Issues opened (totalIssueContributions) */
  issues: number;
  /** Contributed-to repos (totalRepositoryContributions, approximate) */
  contributedTo: number;
  /** Public repositories (user.repositories.totalCount) */
  repos: number;
  /** GitHub followers (user.followers.totalCount) */
  followers: number;
  /** Stars earned across own repos (sum of stargazers_count) */
  stars: number;
  /** 本年贡献热图（contributionsCollection.contributionCalendar） */
  calendar: ContributionCalendar;
}
