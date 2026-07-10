import { NextResponse } from "next/server";
import { fetchBlogPosts } from "@/lib/mxspace";

/** ISR：30 分钟。lib 内部已做降级，始终返回 200。 */
export const revalidate = 1800;

export async function GET() {
  const posts = await fetchBlogPosts();
  return NextResponse.json(posts);
}
