import { PLACES, TOOLS } from "../shared/site"
import type { GithubDesk, HeatDay, HomePayload, WeatherNow, WritingCard } from "../shared/types"
import { Bones, Frame, Miss } from "./App"
import { formatToday, formatWhen, type Copy, type Locale } from "./copy"

const HEAT = ["rgba(36,28,22,0.08)", "#f6d8bf", "#e7a56a", "#d4763a", "#8c3d14"]

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

  return (
    <div className="board">
      <Frame area="greet" tone="ink">
        <h2 className="greet">{copy.greet(hour)}</h2>
        <p className="today">{formatToday(locale)}</p>
        <p className="school">
          {copy.where}
          <span>{copy.school}</span>
        </p>
        {loading ? <Bones /> : null}
        {query.state === "error" ? (
          <p className="miss">
            {copy.offline}{" "}
            <button type="button" onClick={query.reload}>
              {copy.retry}
            </button>
          </p>
        ) : null}
        {github ? <Counts github={github} copy={copy} locale={locale} /> : null}
        {query.state === "ready" && !github ? <Miss>{copy.numbersMiss}</Miss> : null}
      </Frame>

      <Frame area="places" label={copy.around}>
        <ul className="places">
          {PLACES.map((place) => {
            const external = place.href.startsWith("http")
            return (
              <li key={place.id}>
                <a
                  href={place.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                >
                  <span>{locale === "zh" ? place.zh : place.en}</span>
                  <small>{place.host}</small>
                </a>
              </li>
            )
          })}
        </ul>
      </Frame>

      <Frame area="weather" tone="ink">
        {loading ? <Bones /> : null}
        {query.data?.weather ? (
          <WeatherNowView weather={query.data.weather} copy={copy} />
        ) : null}
        {query.state === "ready" && !query.data?.weather ? <Miss>{copy.weatherMiss}</Miss> : null}
      </Frame>

      <Frame area="year" label={github?.graphKind === "recent" ? copy.lately : copy.thisYear}>
        {loading ? <Bones /> : null}
        {github ? (
          <>
            <p className="year-total">
              {github.yearTotal === null ? copy.yearQuiet : copy.times(github.yearTotal.toLocaleString(locale === "zh" ? "zh-CN" : "en-US"))}
            </p>
            {github.graphKind === "recent" ? <p className="caption">{copy.recentCaption}</p> : null}
            {github.weeks.length > 0 ? (
              <Heat weeks={github.weeks} copy={copy} locale={locale} />
            ) : (
              <Miss>{copy.graphMiss}</Miss>
            )}
            <a className="more" href={`https://github.com/${github.login}`} target="_blank" rel="noreferrer">
              {copy.openGithub}
            </a>
          </>
        ) : null}
        {query.state === "ready" && !github ? <Miss>{copy.graphMiss}</Miss> : null}
      </Frame>

      <Frame area="repos" label={copy.onTheBench}>
        {loading ? <Bones /> : null}
        {github && github.repos.length > 0 ? (
          <ul className="repos">
            {github.repos.slice(0, 4).map((repo) => (
              <li key={repo.name}>
                <a href={repo.url} target="_blank" rel="noreferrer">
                  <span className="repo-name">
                    {repo.name}
                    <small>{repo.language}</small>
                  </span>
                  {repo.description ? <span className="repo-desc">{repo.description}</span> : null}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {query.state === "ready" && !github ? <Miss>{copy.reposMiss}</Miss> : null}
        <a className="more" href="/shelf">
          {copy.moreShelf}
        </a>
      </Frame>

      <Frame area="writing" label={copy.writing}>
        {loading ? <Bones /> : null}
        {query.data && query.data.writing.length > 0 ? (
          <WritingList items={query.data.writing} locale={locale} />
        ) : null}
        {query.state === "ready" && query.data && query.data.writing.length === 0 ? (
          <Miss>{copy.writingMiss}</Miss>
        ) : null}
        <a className="more" href="https://blog.trfox.top" target="_blank" rel="noreferrer">
          {locale === "zh" ? "博客" : "Blog"}
        </a>
      </Frame>

      <Frame area="note" label={copy.recentNote}>
        {loading ? <Bones /> : null}
        {query.data?.note ? (
          <>
            <h3 className="note-title">
              <a href={query.data.note.url} target="_blank" rel="noreferrer">
                {query.data.note.title}
              </a>
            </h3>
            {query.data.note.excerpt ? <p className="excerpt">{query.data.note.excerpt}</p> : null}
            <p className="caption">
              {[query.data.note.weather, query.data.note.mood, formatWhen(query.data.note.date, locale)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        ) : null}
        {query.state === "ready" && !query.data?.note ? <Miss>{copy.writingMiss}</Miss> : null}
      </Frame>

      <Frame area="tools" label={copy.tools}>
        <ul className="tools">
          {TOOLS.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      </Frame>
    </div>
  )
}

function Counts({
  github,
  copy,
  locale,
}: {
  github: GithubDesk
  copy: Copy
  locale: Locale
}) {
  const number = (value: number) => value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
  const items = [
    [number(github.publicRepos), copy.repos],
    [number(github.followers), copy.followers],
    [number(github.stars), copy.stars],
  ] as const
  return (
    <dl className="counts">
      {items.map(([value, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function WeatherNowView({ weather, copy }: { weather: WeatherNow; copy: Copy }) {
  return (
    <div className="weather">
      <p className="weather-word">{copy.weatherWord(weather.code)}</p>
      <p className="weather-temp">
        {weather.tempC}
        <span>°</span>
      </p>
      <p className="caption">{copy.weatherMeta(weather.humidity, weather.windKmh)}</p>
    </div>
  )
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
          return (
            <i
              key={`${weekIndex}-${dayIndex}`}
              title={title}
              style={{ background: day ? HEAT[day.level] ?? HEAT[0] : "transparent" }}
            />
          )
        }),
      )}
    </div>
  )
}

function WritingList({ items, locale }: { items: WritingCard[]; locale: Locale }) {
  return (
    <ul className="entries">
      {items.map((item) => (
        <li key={item.id}>
          <a href={item.url} target="_blank" rel="noreferrer">
            <span className="entry-cat">{item.category}</span>
            <span className="entry-title">{item.title}</span>
            <time dateTime={item.date}>{formatWhen(item.date, locale)}</time>
          </a>
        </li>
      ))}
    </ul>
  )
}
