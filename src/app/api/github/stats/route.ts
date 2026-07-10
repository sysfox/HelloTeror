import { NextResponse } from "next/server";
import { fetchGitHubStats } from "@/lib/github";

/** ISR：1 小时。lib 内部已做降级，始终返回 200。 */
export const revalidate = 3600;

export async function GET() {
  const stats = await fetchGitHubStats();
  return NextResponse.json(stats);
}
