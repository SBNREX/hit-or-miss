import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "./GenreExplorer.css";

function calculateStats(values) {
  const n = values.length;
  if (!n) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const mid = Math.floor(n / 2);
  const median =
    n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const variance =
    n > 1
      ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
        (n - 1)
      : 0;

  return { count: n, mean, median, sd: Math.sqrt(variance) };
}

export default function GenreExplorer() {
  const [genreData, setGenreData] = useState({});
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFormulas, setShowFormulas] = useState(false);

  useEffect(() => {
    Papa.parse("/data/spotify-tracks.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => {
        const groups = {};

        for (const row of result.data) {
          if (
            typeof row.track_genre !== "string" ||
            typeof row.popularity !== "number" ||
            !Number.isFinite(row.popularity)
          ) continue;

          if (!groups[row.track_genre]) groups[row.track_genre] = [];
          groups[row.track_genre].push(row.popularity);
        }

        const stats = Object.fromEntries(
          Object.entries(groups).map(([genre, values]) => [
            genre,
            calculateStats(values),
          ])
        );

        const names = Object.keys(stats).sort();
        setGenreData(stats);
        setSelectedGenre(names.includes("pop") ? "pop" : names[0] || "");
        setLoading(false);

        if (!names.length) setError("No valid genre data was found.");
      },
      error: () => {
        setError("Could not load public/data/spotify-tracks.csv.");
        setLoading(false);
      },
    });
  }, []);

  const genres = useMemo(
    () => Object.keys(genreData).sort(),
    [genreData]
  );

  const selected = genreData[selectedGenre];

  const comparison = useMemo(
    () =>
      Object.entries(genreData)
        .filter(([, stats]) => stats.count >= 200)
        .map(([genre, stats]) => ({
          genre,
          popularity: Number(stats.mean.toFixed(2)),
          count: stats.count,
        }))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10)
        .reverse(),
    [genreData]
  );

  return (
    <section className="panel genre-panel" id="genre-explorer">
      <header className="genre-section-header">
        <div>
          <p className="eyebrow">04 / DESCRIPTIVE STATISTICS</p>
          <h2>Explore the genres</h2>
          <p className="genre-intro">
            Compare popularity scores across musical genres using statistics
            calculated directly from the Spotify dataset.
          </p>
        </div>
        <span className="chart-tag">LIVE DATA</span>
      </header>

      {loading ? (
        <div className="genre-state">
          <div className="genre-loader" />
          <p>Analysing the Spotify dataset…</p>
        </div>
      ) : error ? (
        <div className="genre-error">
          <strong>Dataset unavailable</strong>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="genre-selection">
            <div>
              <label htmlFor="genre-select">Explore a genre</label>
              <p>Select a genre to inspect its popularity distribution.</p>
            </div>
            <select
              id="genre-select"
              className="genre-select"
              value={selectedGenre}
              onChange={(event) => setSelectedGenre(event.target.value)}
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <>
              <div className="genre-selected-title">
                <span className="genre-dot" />
                <h3>
                  {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}
                </h3>
                <span className="genre-track-count">
                  {selected.count.toLocaleString()} track listings
                </span>
              </div>

              <div className="genre-stat-grid">
                <article className="genre-stat">
                  <span className="genre-stat-label">ARITHMETIC MEAN</span>
                  <strong>{selected.mean.toFixed(2)}</strong>
                  <small>Average popularity</small>
                </article>
                <article className="genre-stat">
                  <span className="genre-stat-label">MEDIAN</span>
                  <strong>{selected.median.toFixed(2)}</strong>
                  <small>Middle score</small>
                </article>
                <article className="genre-stat">
                  <span className="genre-stat-label">STD. DEVIATION</span>
                  <strong>{selected.sd.toFixed(2)}</strong>
                  <small>Spread of scores</small>
                </article>
                <article className="genre-stat">
                  <span className="genre-stat-label">SAMPLE SIZE</span>
                  <strong>{selected.count.toLocaleString()}</strong>
                  <small>Valid observations</small>
                </article>
              </div>

              <div className="genre-formula-toggle">
                <div>
                  <strong>Statistical methodology</strong>
                  <p>See how the mean, median and standard deviation are calculated.</p>
                </div>
                <button
                  type="button"
                  className="formula-toggle-button"
                  aria-expanded={showFormulas}
                  onClick={() => setShowFormulas((value) => !value)}
                >
                  {showFormulas ? "Hide formulas −" : "Show formulas +"}
                </button>
              </div>

              {showFormulas && (
                <div className="genre-formula-grid">
                  <div className="genre-formula">
                    <span>01 · Mean</span>
                    <div className="formula-expression">x̄ = Σxᵢ / n</div>
                    <p>Add the scores and divide by the number of observations.</p>
                  </div>
                  <div className="genre-formula">
                    <span>02 · Median</span>
                    <div className="formula-expression">Middle of sorted xᵢ</div>
                    <p>Sort the scores and find the middle value. For an even sample, average the two middle values.</p>
                  </div>
                  <div className="genre-formula">
                    <span>03 · Sample standard deviation</span>
                    <div className="formula-expression">s = √[Σ(xᵢ − x̄)² / (n − 1)]</div>
                    <p>Measures the spread of scores around the sample mean.</p>
                  </div>
                </div>
              )}

              <p className="genre-math-note">
                Standard deviation uses the sample formula with denominator n − 1.
                These are track listings; a track can appear under more than one genre.
              </p>
            </>
          )}

          <section className="genre-ranking">
            <header className="genre-ranking-header">
              <div>
                <p className="eyebrow">05 / GENRE COMPARISON</p>
                <h3>Which genres score highest?</h3>
                <p className="genre-ranking-description">
                  Top ten genres by mean popularity, considering genres with at least
                  200 track listings.
                </p>
              </div>
              <span className="chart-tag">TOP 10</span>
            </header>

            <div className="genre-chart-frame">
              <div className="genre-chart-axis-title">Mean popularity score · 0–100</div>
              <div className="genre-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparison}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                    barCategoryGap="24%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#29332e" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: "#a1aca5", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="genre"
                      width={112}
                      tick={{ fill: "#dce5de", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(182, 247, 121, 0.06)" }}
                      contentStyle={{
                        background: "#151b18",
                        border: "1px solid #354139",
                        borderRadius: 10,
                        color: "#f1f5f1",
                        fontSize: 12,
                      }}
                      formatter={(value, name, item) => [
                        Number(value).toFixed(2),
                        `Mean popularity · n=${item.payload.count}`,
                      ]}
                      labelFormatter={(label) =>
                        label.charAt(0).toUpperCase() + label.slice(1)
                      }
                    />
                    <Bar
                      dataKey="popularity"
                      name="Mean popularity"
                      fill="#b6f779"
                      radius={[0, 5, 5, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="genre-chart-interpretation">
              <span className="genre-interpretation-icon">↗</span>
              <p>
                <strong>How to read this chart</strong>
                A longer bar indicates a higher average popularity score, not
                necessarily more streams or listeners.
              </p>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
