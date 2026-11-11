import { PLACES, SITE, TOOLS } from "../shared/site"
import type { GithubDesk, HeatDay, HomePayload, RepoCard, WeatherNow, WritingCard } from "../shared/types"
import { Bones, Miss } from "./App"
import { formatToday, formatWhen, type Copy, type Locale } from "./copy"
import { CloudMark, DropMark, PlaceMark, RainMark, SunMark, WindMark } from "./icons"

const ICON_SLOT = ["d-i1", "d-i2", "d-i3", "d-i4", "d-i5", "d-i6", "d-i7", "d-i8"]

const TINT: Record<string, string> = {
  blog: "#2a6998",
  legacy: "#d97706",
  pan: "#0f766e",
  lens: "#7c3aed",
  status: "#16a34a",
  github: "#24292f",
  bilibili: "#fb7299",
  email: "#4f46e5",
}

const LANG: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#f0b429",
  Vue: "#41b883",
  Java: "#b07219",
  Shell: "#89e051",
  Go: "#00add8",
  Rust: "#dea584",
}

export function Home({
  copy,
  locale,
  hour,
  query,
}: {
  copy: Copy
  locale: Locale
  hour: number
  query: { data: HomePayload | null; state: "loading" | "ready" | "error"; reload: () => void }
}) {
  const github = query.data?.github ?? null
  const loading = query.state === "loading" && !query.data
  const number = (value: number) => value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")

  return (
    <>
      <p className="script rise">{copy.motto}</p>
      <div className="who rise">
        {github?.avatar ? (
          <img src={github.avatar} alt="" width={32} height={32} />
        ) : (
          <span className="who-fallback">T</span>
        )}
        <span>
          <strong>{SITE.author}</strong>
          <small title={copy.mottoAside}>{copy.mottoAside}</small>
        </span>
      </div>

      <div className="desk">
        <section className="glass glow card d-greet">
          <div className="wave greet-mark" aria-hidden="true">
            👋
          </div>
          <h1 className="greet">{copy.greet(hour)}</h1>
          <p className="date-line">{formatToday(locale)}</p>
          {query.state === "error" ? (
            <p className="miss">
              {copy.offline}{" "}
              <button type="button" onClick={query.reload}>
                {copy.retry}
              </button>
            </p>
          ) : null}
        </section>

        <div className="icon-row">
          {PLACES.map((place, index) => {
            const external = place.href.startsWith("http")
            const label = locale === "zh" ? place.zh : place.en
            return (
              <a
                key={place.id}
                className={`glass tile ${ICON_SLOT[index] ?? ""}`}
                href={place.href}
                style={{ color: TINT[place.id] ?? "var(--accent)" }}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                aria-label={label}
              >
                <PlaceMark id={place.id} />
              </a>
            )
          })}
        </div>

        <section className="glass glow card d-gh">
          {loading ? <Bones /> : null}
          {github ? <GithubCard github={github} copy={copy} locale={locale} number={number} /> : null}
          {query.state === "ready" && !github ? <Miss>{copy.graphMiss}</Miss> : null}
        </section>

        <section className="glass glow card d-write">
          {loading ? <Bones /> : null}
          {query.data && query.data.writing.length > 0 ? <WritingList items={query.data.writing} /> : null}
          {query.state === "ready" && query.data && query.data.writing.length === 0 ? <Miss>{copy.writingMiss}</Miss> : null}
        </section>

        <section className="glass glow card d-note">
          {loading ? <Bones /> : null}
          {query.data?.note ? (
            <>
              <h2 className="note-title">
                <a href={query.data.note.url} target="_blank" rel="noreferrer">
                  {query.data.note.title}
                </a>
              </h2>
              {query.data.note.excerpt ? <p className="excerpt">{query.data.note.excerpt}</p> : null}
              <p className="caption">
                {[query.data.note.weather, query.data.note.mood, formatWhen(query.data.note.date, locale)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </>
          ) : null}
          {query.state === "ready" && !query.data?.note ? <Miss>{copy.writingMiss}</Miss> : null}
        </section>

        <section className="glass glow card d-wx">
          {loading ? <Bones /> : null}
          {query.data?.weather ? <WeatherCard weather={query.data.weather} copy={copy} /> : null}
          {query.state === "ready" && !query.data?.weather ? <Miss>{copy.weatherMiss}</Miss> : null}
        </section>

        <section className="glass card d-where">
          <ul className="place-rows">
            {PLACES.slice(0, 3).map((place) => {
              const external = place.href.startsWith("http")
              return (
                <li key={place.id}>
                  <a href={place.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                    <strong>{locale === "zh" ? place.zh : place.en}</strong>
                    <small>{place.host}</small>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="glass glow card d-me">
          {loading ? <Bones /> : null}
          {github ? (
            <>
              <a className="me-head" href={`https://github.com/${github.login}`} target="_blank" rel="noreferrer">
                {github.avatar ? <img src={github.avatar} alt="" width={36} height={36} /> : <span className="me-fallback">T</span>}
                <span>
                  <strong>{github.name || SITE.author}</strong>
                  <small>@{github.login}</small>
                </span>
              </a>
              <div className="me-stats">
                <div>
                  <strong>{number(github.publicRepos)}</strong>
                  <span>{copy.repos}</span>
                </div>
                <div>
                  <strong>{number(github.followers)}</strong>
                  <span>{copy.followers}</span>
                </div>
                <div>
                  <strong>{number(github.stars)}</strong>
                  <span>{copy.stars}</span>
                </div>
              </div>
            </>
          ) : null}
          {query.state === "ready" && !github ? <Miss>{copy.numbersMiss}</Miss> : null}
        </section>

        <section className="glass glow card d-act">
          <h2 className="card-label">{copy.onTheBench}</h2>
          {loading ? <Bones /> : null}
          {github && github.repos.length > 0 ? (
            <ul className="acts">
              {github.repos.slice(0, 4).map((repo) => (
                <li key={repo.name}>
                  <a href={repo.url} target="_blank" rel="noreferrer">
                    <i className="dot" style={{ background: LANG[repo.language ?? ""] ?? "var(--accent)" }} />
                    <span>{repo.name}</span>
                    <small>{repo.language}</small>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {query.state === "ready" && !github ? <Miss>{copy.reposMiss}</Miss> : null}
          <a className="more" href="/shelf">
            {copy.moreShelf}
          </a>
        </section>

        <section className="glass card d-tools">
          <h2 className="card-label">{copy.tools}</h2>
          <ul className="tools">
            {TOOLS.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <p className="caption">
            {copy.where} · {copy.school}
          </p>
        </section>
      </div>
    </>
  )
}

function GithubCard({
  github,
  copy,
  locale,
  number,
}: {
  github: GithubDesk
  copy: Copy
  locale: Locale
  number: (value: number) => string
}) {
  const langs = mixLanguages(github.repos)
  const weeks = github.weeks.slice(-16)
  return (
    <>
      <div className="gh-top">
        <span className="badge">
          <i />
          {copy.school}
        </span>
        {weeks.length > 0 ? <Heat weeks={weeks} copy={copy} locale={locale} /> : null}
      </div>
      <div className="gh-nums">
        <p>
          <strong>{github.yearTotal === null ? "—" : number(github.yearTotal)}</strong>
          <span>{github.graphKind === "recent" ? copy.lately : copy.thisYear}</span>
        </p>
        <p>
          <strong>{number(github.publicRepos)}</strong>
          <span>{copy.repos}</span>
        </p>
      </div>
      {langs.length > 0 ? (
        <div className="langbar">
          <div className="langtrack">
            {langs.map((lang) => (
              <i
                key={lang.name || "rest"}
                style={{ width: `${lang.pct}%`, background: lang.name ? (LANG[lang.name] ?? "var(--accent)") : "color-mix(in srgb, var(--text-soft) 45%, transparent)" }}
              />
            ))}
          </div>
          <div className="langmeta">
            {langs.filter((lang) => lang.name).map((lang) => (
              <span key={lang.name}>
                {lang.name} {lang.pct}%
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

function mixLanguages(repos: RepoCard[]): { name: string; pct: number }[] {
  const counts = new Map<string, number>()
  for (const repo of repos) {
    if (!repo.language) continue
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1)
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0)
  if (total === 0) return []
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
  const rest = 100 - ranked.reduce((sum, lang) => sum + lang.pct, 0)
  if (rest > 0) ranked.push({ name: "", pct: rest })
  return ranked
}

function Heat({
  weeks,
  copy,
  locale,
}: {
  weeks: { days: (HeatDay | null)[] }[]
  copy: Copy
  locale: Locale
}) {
  return (
    <div className="heat" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
      {weeks.map((week, weekIndex) =>
        week.days.map((day, dayIndex) => {
          const title = day
            ? day.count > 0
              ? copy.busyDay(formatWhen(day.date, locale), day.count)
              : copy.quietDay(formatWhen(day.date, locale))
            : ""
          const level = day ? Math.min(4, Math.max(0, day.level)) : 0
          return (
            <span
              key={`${weekIndex}-${dayIndex}`}
              title={title}
              style={{
                background: day ? `var(--heat-${level})` : "transparent",
                animationDelay: `${weekIndex * 28 + dayIndex * 16}ms`,
              }}
            />
          )
        }),
      )}
    </div>
  )
}

function WritingList({ items }: { items: WritingCard[] }) {
  return (
    <ul className="write-list">
      {items.slice(0, 3).map((item) => (
        <li key={item.id}>
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  )
}

function WeatherCard({ weather, copy }: { weather: WeatherNow; copy: Copy }) {
  return (
    <>
      <WeatherArt code={weather.code} />
      <p className="wx-temp">
        {weather.tempC}
        <span>°</span>
      </p>
      <p className="wx-word">{copy.weatherWord(weather.code)}</p>
      <p className="wx-city">{copy.where}</p>
      <div className="wx-meta">
        <span>
          <DropMark />
          {weather.humidity}%
        </span>
        <span>
          <WindMark />
          {weather.windKmh}
        </span>
      </div>
    </>
  )
}

function WeatherArt({ code }: { code: number }) {
  if (code >= 95 || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return <RainMark className="wx-art" />
  if (code === 0 || code === 1) return <SunMark className="wx-art" />
  return <CloudMark className="wx-art" />
}
