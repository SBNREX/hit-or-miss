import trainedModel from "./model.json";

import { useState } from "react";
import SongSearch from "./SongSearch";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import "./App.css";
import GenreExplorer from "./GenreExplorer";

const initialFeatures = {
  danceability: 0.65,
  energy: 0.7,
  loudness: -7,
  valence: 0.55,
  tempo: 120,
  acousticness: 0.2,
};

const correlations = [
  { feature: "Loudness", correlation: 0.07 },
  { feature: "Danceability", correlation: 0.06 },
  { feature: "Acousticness", correlation: -0.04 },
];

function predictPopularity(f) {
  const model = trainedModel;
  const featureValues = {
    danceability: Number(f.danceability ?? 0),
    energy: Number(f.energy ?? 0),
    loudness: Number(f.loudness ?? 0),
    valence: Number(f.valence ?? 0),
    tempo: Number(f.tempo ?? 0),
    acousticness: Number(f.acousticness ?? 0),
    speechiness: Number(f.speechiness ?? 0),
    instrumentalness: Number(f.instrumentalness ?? 0),
    liveness: Number(f.liveness ?? 0),
    duration_ms: Number(f.duration_ms ?? 0),
    explicit: f.explicit === true || f.explicit === 1 || f.explicit === "true" ? 1 : 0,
    mode: Number(f.mode ?? 0),
    time_signature: Number(f.time_signature ?? 4),
    key: Number(f.key ?? 0)
  };
  if (model.type === "mean") return Math.round(Math.max(0, Math.min(100, model.mean)));
  const v = [1, ...model.features.map(name =>
    (featureValues[name] - model.means[model.features.indexOf(name)]) /
    model.stds[model.features.indexOf(name)]
  )];
  if (model.type === "genre_linear") {
    const genre = String(f.track_genre ?? "").toLowerCase();
    v.push(...model.genres.slice(1).map(g => genre === g ? 1 : 0));
  }
  const score = model.coefficients.reduce((sum, c, i) => sum + c * v[i], 0);
  return Math.round(Math.max(0, Math.min(100, score)));
}

function FeatureSlider({ label, name, value, min, max, step, onChange }) {
  return (
    <label className="feature-control">
      <span className="feature-heading">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(name, Number(event.target.value))}
      />
    </label>
  );
}

export default function App() {
  const [features, setFeatures] = useState(initialFeatures);
  const [selectedSong, setSelectedSong] = useState(null);

  function updateFeature(name, value) {
    setFeatures((current) => ({ ...current, [name]: value }));
  }

  const prediction = Math.round(
    Math.max(0, Math.min(100, predictPopularity(features)))
  );

  function resetFeatures() {
    setFeatures({ ...initialFeatures });
    setSelectedSong(null);
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">♫</span>
          HIT <span className="brand-muted">&</span> MISS
        </a>
        <span className="project-label">
          PROBABILITY & STATISTICS PROJECT
        </span>
      </header>

      <section className="hero" id="home">
        <p className="eyebrow">THE MATHEMATICS OF MUSIC</p>
        <h1>
          Can you predict
          <br />
          a <span>hit song?</span>
        </h1>
        <p className="hero-copy">
          Explore how audio features relate to Spotify popularity.
          Change the features and see what our regression equation predicts.
        </p>
      </section>

      <SongSearch
        onSelectSong={(song) => {
          console.log("Selected song:", song.name, song.features);
          setSelectedSong(song);
          setFeatures((current) => ({
            ...current,
            ...song.features,
          }));
        }}
      />
      <section className="prediction-layout">
        <div className="panel controls-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / EXPERIMENT</p>
              <h2>Shape your sound</h2>
            </div>
            <button className="reset-button" onClick={resetFeatures}>
              Reset ↺
            </button>
          </div>

          <div className="sliders">
            <FeatureSlider
              label="Danceability"
              name="danceability"
              value={features.danceability}
              min={0}
              max={1}
              step={0.01}
              onChange={updateFeature}
            />
            <FeatureSlider
              label="Energy"
              name="energy"
              value={features.energy}
              min={0}
              max={1}
              step={0.01}
              onChange={updateFeature}
            />
            <FeatureSlider
              label="Loudness (dB)"
              name="loudness"
              value={features.loudness}
              min={-60}
              max={0}
              step={0.5}
              onChange={updateFeature}
            />
            <FeatureSlider
              label="Valence"
              name="valence"
              value={features.valence}
              min={0}
              max={1}
              step={0.01}
              onChange={updateFeature}
            />
            <FeatureSlider
              label="Tempo (BPM)"
              name="tempo"
              value={features.tempo}
              min={40}
              max={220}
              step={1}
              onChange={updateFeature}
            />
            <FeatureSlider
              label="Acousticness"
              name="acousticness"
              value={features.acousticness}
              min={0}
              max={1}
              step={0.01}
              onChange={updateFeature}
            />
          </div>
        </div>

        <div className="panel score-panel">
          <p className="eyebrow">MODEL OUTPUT</p>
          <h2>Predicted popularity</h2>
          <div className="score-number">
            {prediction}
            <span>/100</span>
          </div>
          <div className="score-track">
            <div
              className="score-fill"
              style={{ width: `${prediction}%` }}
            />
          </div>
          <p className="score-description">
            {prediction >= 60
              ? "A relatively high predicted score — according to this model."
              : prediction >= 35
                ? "A moderate predicted score — there is no guarantee of a hit."
                : "A lower predicted score — popularity depends on more than audio features."}
          </p>
          {selectedSong && (
            <div className="selected-song-comparison">
              <p className="eyebrow">SELECTED DATASET TRACK</p>
              <h3>{selectedSong.name}</h3>
              <p className="selected-song-artist">
                {selectedSong.artist}
              </p>
              <div className="comparison-values">
                <div>
                  <span>Recorded popularity</span>
                  <strong>{selectedSong.popularity}/100</strong>
                </div>
                <div>
                  <span>Model prediction</span>
                  <strong>{prediction}/100</strong>
                </div>
              </div>
              <p className="comparison-note">
                Recorded popularity comes from the dataset. The model
                prediction is an estimate based on the current slider values.
              </p>
            </div>
          )}
          <div className="model-note">
            <strong>Important limitation</strong>
            <p>
              The model explains only about 1.4% of popularity variation.
              Treat this as an educational experiment, not a reliable hit predictor.
            </p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>UNIQUE TRACKS</span>
          <strong>89,741</strong>
          <small>Regression dataset</small>
        </div>
        <div className="stat-card">
          <span>MODEL R²</span>
          <strong>1.4%</strong>
          <small>Variance explained</small>
        </div>
        <div className="stat-card">
          <span>GENRES</span>
          <strong>114</strong>
          <small>In the dataset</small>
        </div>
        <div className="stat-card">
          <span>GENRE η²</span>
          <strong>≈25%</strong>
          <small>Popularity variation</small>
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / CORRELATION</p>
            <h2>Audio features vs popularity</h2>
          </div>
          <span className="chart-tag">PEARSON r</span>
        </div>

        <p className="chart-description">
          Correlations reported in our analysis. Values close to zero indicate
          weak linear relationships with popularity.
        </p>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={correlations}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#29332e"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[-0.1, 0.1]}
                tick={{ fill: "#a1aca5", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="feature"
                width={110}
                tick={{ fill: "#dce5de", fontSize: 12 }}
              />
              <ReferenceLine x={0} stroke="#829087" />
              <Tooltip
                contentStyle={{
                  background: "#151b18",
                  border: "1px solid #354139",
                  borderRadius: 8,
                  color: "#f1f5f1",
                }}
                formatter={(value) => [
                  Number(value).toFixed(2),
                  "Pearson r",
                ]}
              />
              <Bar
                dataKey="correlation"
                fill="#b6f779"
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="chart-footnote">
          Loudness: r = 0.07 · Danceability: r = 0.06 · Acousticness: r = −0.04
        </p>
      </section>

      <section className="panel chart-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">03 / ANOVA</p>
            <h2>Does genre matter?</h2>
          </div>
          <span className="chart-tag">ONE-WAY ANOVA</span>
        </div>

        <p className="chart-description">
          The reported analysis found a statistically significant difference
          in popularity across genres.
        </p>

        <div className="anova-result">
          <div>
            <span>F-statistic</span>
            <strong>343.5</strong>
          </div>
          <div>
            <span>Significance</span>
            <strong>p &lt; 0.001</strong>
          </div>
          <div>
            <span>Effect size (η²)</span>
            <strong>≈ 0.25</strong>
          </div>
        </div>

        <div
          className="effect-track"
          role="img"
          aria-label="Genre-associated variation, approximately 25 percent"
        >
          <div className="effect-fill" />
        </div>

        <p className="chart-footnote">
          Approximately 25% of popularity variation was associated with genre
          in this analysis. This does not mean genre causes popularity.
        </p>
      </section>

      <GenreExplorer />

      <footer className="footer">
        <span>♫ HIT & MISS</span>
        <span>Correlation ≠ causation.</span>
      </footer>
    </main>
  );
}
