export interface TechItem {
  name: string;
  /** Optional short note, e.g. "Primary" or "Learning" */
  note?: string;
}

export interface TechCategory {
  id: string;
  label: string;
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
  /** ISO-ish date string for display, e.g. "Jun 23, 2026" */
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
}
