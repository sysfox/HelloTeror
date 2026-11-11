// server/vercel.ts
import { handle } from "@hono/node-server/vercel";

// server/app.ts
import { Hono } from "hono";

// shared/site.ts
var SITE = {
  author: "Teror Fox",
  studio: "TF Studio",
  startYear: 2020,
  email: "i@trfox.top",
  githubUser: "sysfox",
  blog: "https://blog.trfox.top",
  mx: "https://mx.trfox.top/api/v3",
  icp: {
    number: "\u82CFICP\u59072026041454\u53F7",
    url: "https://beian.miit.gov.cn/"
  },
  /** 河海大学在南京。坐标只用于公开天气预报。 */
  nanjing: { latitude: 32.06, longitude: 118.8 }
};

// server/cache.ts
var box = /* @__PURE__ */ new Map();
async function cached(key, ttlMs, load) {
  const hit = box.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  try {
    const value = await load();
    box.set(key, { at: Date.now(), value });
    return value;
  } catch (error) {
    if (hit) return hit.value;
    throw error;
  }
}

// server/text.ts
function plain(input, max = 96) {
  if (!input) return "";
  const text = input.replace(/<!--[\s\S]*?-->/g, " ").replace(/```[\s\S]*?```/g, " ").replace(/`([^`]+)`/g, "$1").replace(/!\[[^\]]*]\([^)]*\)/g, " ").replace(/\[([^\]]+)]\([^)]*\)/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/[*_>~|]/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}\u2026`;
}
function shanghaiDay(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

// server/data.ts
var TEN_MINUTES = 10 * 60 * 1e3;
function mxBase() {
  const raw = process.env.MXSPACE_API_BASE?.trim() || SITE.mx;
  let base = raw.replace(/\/+$/, "");
  if (base.endsWith("/posts")) base = base.slice(0, -"/posts".length);
  return base;
}
function blogBase() {
  return (process.env.BLOG_BASE_URL?.trim() || SITE.blog).replace(/\/+$/, "");
}
function githubUser() {
  return process.env.GITHUB_USERNAME?.trim() || SITE.githubUser;
}
async function getJson(url, init, ms = 8e3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "teror-fox-site",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
function noteUrl(note) {
  const day = shanghaiDay(note.created_at);
  const [year, month, date] = day.split("-");
  const monthNum = String(Number(month));
  const dateNum = String(Number(date));
  return `${blogBase()}/notes/${year}/${monthNum}/${dateNum}/${note.slug}`;
}
function toWriting(post) {
  const category = post.category?.name?.trim() || "\u6587\u7AE0";
  const slug = post.category?.slug;
  const cover = post.images?.find((image) => image.src)?.src ?? null;
  return {
    id: post.id,
    title: post.title,
    url: slug ? `${blogBase()}/posts/${slug}/${post.slug}` : `${blogBase()}/posts/${post.slug}`,
    date: shanghaiDay(post.created_at),
    category,
    excerpt: plain(post.summary || post.text, 88),
    cover: cover && /^https?:\/\//.test(cover) ? cover : null
  };
}
function toNote(note) {
  return {
    id: note.id,
    title: note.title?.trim() || "\u65E0\u9898",
    url: noteUrl(note),
    date: shanghaiDay(note.created_at),
    excerpt: plain(note.text, 110),
    mood: note.mood?.trim() || null,
    weather: note.weather?.trim() || null
  };
}
async function loadPosts() {
  return cached("posts", TEN_MINUTES, async () => {
    const payload = await getJson(
      `${mxBase()}/posts?page=1&size=12`
    );
    return (payload.data ?? []).map(toWriting);
  });
}
async function loadNotes() {
  return cached("notes", TEN_MINUTES, async () => {
    const payload = await getJson(
      `${mxBase()}/notes?page=1&size=8`
    );
    return (payload.data ?? []).filter((note) => note.slug).map(toNote);
  });
}
async function loadRepos() {
  return cached("repos", TEN_MINUTES, async () => {
    const headers = githubHeaders();
    const login = githubUser();
    const user = await getJson(`https://api.github.com/users/${login}`, { headers });
    const pages = await Promise.all(
      [1, 2].map(
        (page) => getJson(
          `https://api.github.com/users/${login}/repos?per_page=100&sort=pushed&page=${page}`,
          { headers }
        ).catch(() => [])
      )
    );
    const all = pages.flat();
    const stars = all.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const repos = all.filter((repo) => !repo.fork && !repo.archived).sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at)).slice(0, 12).map((repo) => ({
      name: repo.name,
      description: repo.description ? plain(repo.description, 90) : null,
      language: repo.language,
      stars: repo.stargazers_count,
      url: repo.html_url,
      pushedAt: shanghaiDay(repo.pushed_at)
    }));
    return { user, repos, stars };
  });
}
var LEVEL = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4
};
function shiftDay(iso, delta) {
  const date = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
function toWeeks(days) {
  if (days.length === 0) return [];
  const lead = (/* @__PURE__ */ new Date(`${days[0].date}T00:00:00Z`)).getUTCDay();
  const cells = Array.from({ length: lead }, () => null);
  cells.push(...days);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push({ days: cells.slice(index, index + 7) });
  }
  return weeks;
}
async function loadCalendar(login) {
  return cached("calendar", TEN_MINUTES, async () => {
    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) {
      const official = await calendarOfficial(login, token).catch(() => null);
      if (official) return official;
    }
    const scraped = await calendarPublic(login).catch(() => null);
    if (scraped) return scraped;
    return calendarFromEvents(login);
  });
}
async function calendarOfficial(login, token) {
  const response = await getJson(
    "https://api.github.com/graphql",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "teror-fox-site",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `query($login:String!){
          user(login:$login){
            contributionsCollection{
              contributionCalendar{
                totalContributions
                weeks{ contributionDays{ date contributionCount contributionLevel } }
              }
            }
          }
        }`,
        variables: { login }
      })
    },
    9e3
  );
  const calendar = response.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar?.weeks?.length) return null;
  const weeks = calendar.weeks.map((week) => ({
    days: week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: LEVEL[day.contributionLevel] ?? 0
    }))
  }));
  return {
    graphKind: "year",
    yearTotal: calendar.totalContributions,
    weeks
  };
}
async function calendarPublic(login) {
  const payload = await getJson(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(login)}?y=last`, void 0, 8e3);
  const days = payload.contributions;
  if (!days?.length) return null;
  const heat = days.map((day) => ({
    date: day.date,
    count: day.count,
    level: Math.max(0, Math.min(4, Math.round(day.level)))
  }));
  const summed = heat.reduce((sum, day) => sum + day.count, 0);
  return {
    graphKind: "year",
    yearTotal: payload.total?.lastYear ?? summed,
    weeks: toWeeks(heat)
  };
}
async function calendarFromEvents(login) {
  const events = await getJson(
    `https://api.github.com/users/${login}/events/public?per_page=100`,
    { headers: githubHeaders() }
  );
  const counts = /* @__PURE__ */ new Map();
  for (const event of events) {
    if (!event.created_at) continue;
    const day = shanghaiDay(event.created_at);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const end = shanghaiDay((/* @__PURE__ */ new Date()).toISOString());
  const days = [];
  for (let ago = 111; ago >= 0; ago -= 1) {
    const key = shiftDay(end, -ago);
    days.push({ date: key, count: counts.get(key) ?? 0, level: 0 });
  }
  const positive = days.map((day) => day.count).filter((count) => count > 0).sort((a, b) => a - b);
  const pick = (ratio) => positive.length === 0 ? 0 : positive[Math.min(positive.length - 1, Math.floor((positive.length - 1) * ratio))];
  const t1 = pick(0.25);
  const t2 = pick(0.5);
  const t3 = pick(0.75);
  for (const day of days) {
    if (day.count <= 0) day.level = 0;
    else if (day.count <= t1) day.level = 1;
    else if (day.count <= t2) day.level = 2;
    else if (day.count <= t3) day.level = 3;
    else day.level = 4;
  }
  const yearTotal = days.reduce((sum, day) => sum + day.count, 0);
  return {
    graphKind: "recent",
    yearTotal,
    weeks: toWeeks(days)
  };
}
async function loadWeather() {
  return cached("weather", TEN_MINUTES, async () => {
    const { latitude, longitude } = SITE.nanjing;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai&wind_speed_unit=kmh`;
    const payload = await getJson(url);
    const current = payload.current;
    if (!current || typeof current.temperature_2m !== "number") {
      throw new Error("weather");
    }
    return {
      tempC: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windKmh: Math.round(current.wind_speed_10m ?? 0),
      code: current.weather_code ?? 0
    };
  });
}
async function loadGithub() {
  const [{ user, repos, stars }, calendar] = await Promise.all([
    loadRepos(),
    loadCalendar(githubUser()).catch(() => ({
      graphKind: "recent",
      yearTotal: null,
      weeks: []
    }))
  ]);
  return {
    login: user.login,
    name: user.name?.trim() || SITE.author,
    avatar: user.avatar_url,
    followers: user.followers,
    publicRepos: user.public_repos,
    stars,
    graphKind: calendar.graphKind,
    yearTotal: calendar.yearTotal,
    weeks: calendar.weeks,
    repos
  };
}
async function loadHome() {
  const [github, writing, notes, weather] = await Promise.all([
    loadGithub().catch(() => null),
    loadPosts().catch(() => []),
    loadNotes().catch(() => []),
    loadWeather().catch(() => null)
  ]);
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    github,
    writing: writing.slice(0, 4),
    note: notes[0] ?? null,
    weather
  };
}
async function loadShelf() {
  const [writing, notes, github] = await Promise.all([
    loadPosts().catch(() => []),
    loadNotes().catch(() => []),
    loadGithub().catch(() => null)
  ]);
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    writing,
    notes,
    repos: github?.repos ?? []
  };
}

// server/app.ts
var app = new Hono();
app.get("/api/home", async (c) => {
  const payload = await loadHome();
  c.header("cache-control", "public, max-age=120");
  return c.json(payload);
});
app.get("/api/shelf", async (c) => {
  const payload = await loadShelf();
  c.header("cache-control", "public, max-age=120");
  return c.json(payload);
});
app.get("/api/health", (c) => c.json({ ok: true }));

// server/vercel.ts
var vercel_default = handle(app);
export {
  vercel_default as default
};
