import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import "./SongSearch.css";

const featureNames = [
  "danceability",
  "energy",
  "loudness",
  "valence",
  "tempo",
  "acousticness",
];

export default function SongSearch({ onSelectSong }) {
  const [tracks, setTracks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Papa.parse("/data/spotify-tracks.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: ({ data }) => {
        if (cancelled) return;

        const valid = data.filter(
          (track) =>
            track.track_name &&
            track.artists &&
            featureNames.every((key) => Number.isFinite(track[key])) &&
            Number.isFinite(track.popularity)
        );

        setTracks(valid);
        setLoading(false);

        if (!valid.length) setError("No valid songs were found in the dataset.");
      },
      error: () => {
        if (!cancelled) {
          setError("Could not load the dataset. Please refresh the page.");
          setLoading(false);
        }
      },
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];

    return tracks
      .filter(
        (track) =>
          String(track.track_name).toLowerCase().includes(term) ||
          String(track.artists).toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [tracks, query]);

  function chooseTrack(track) {
    const song = {
      name: String(track.track_name),
      artist: String(track.artists),
      popularity: Number(track.popularity),
      features: Object.fromEntries(
        featureNames.map((key) => [key, Number(track[key])])
      ),
    };

    setSelectedSong(song);
    setQuery(song.name);
    setListOpen(false);
    setError("");

    if (typeof onSelectSong === "function") {
      onSelectSong(song);
    } else {
      setError("Song selection is not connected to the prediction panel.");
    }
  }

  return (
    <section className="panel song-search-panel">
      <p className="eyebrow">SONG LOOKUP</p>
      <h2>Find a song in the dataset</h2>
      <p className="chart-description">
        Search by track title or artist to load its audio features automatically.
      </p>

      <label className="song-search-label" htmlFor="song-search">
        Track name or artist
      </label>

      <div className="song-search-control">
        <input
          id="song-search"
          className="song-search-input"
          type="search"
          value={query}
          onFocus={() => setListOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedSong(null);
            setError("");
            setListOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setListOpen(false);
            if (event.key === "Enter" && results.length > 0) {
              event.preventDefault();
              chooseTrack(results[0]);
            }
          }}
          placeholder="Try a song or artist..."
          autoComplete="off"
          aria-controls="song-search-results"
          aria-expanded={listOpen && results.length > 0}
        />

        {listOpen && query.trim().length >= 2 && results.length > 0 && (
          <div
            id="song-search-results"
            className="song-search-results"
            role="listbox"
          >
            {results.map((track, index) => (
              <button
                type="button"
                className="song-result"
                role="option"
                aria-selected={false}
                key={`${track.track_id || track.track_name}-${index}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseTrack(track)}
              >
                <span className="song-result-text">
                  <strong>{track.track_name}</strong>
                  <small>{track.artists}</small>
                </span>
                <span className="song-result-arrow">Select ↗</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="song-search-hint">Loading songs…</p>}
      {error && <p role="alert" className="song-search-hint">{error}</p>}

      {!loading && listOpen && query.trim().length >= 2 &&
        results.length === 0 && !error && (
          <p className="song-search-hint">No matching songs found.</p>
        )}

      {selectedSong && !error && (
        <p className="song-selection-status" role="status">
          <span>✓</span> Selected: <strong>{selectedSong.name}</strong>
          <span className="song-selection-artist"> — {selectedSong.artist}</span>
        </p>
      )}
    </section>
  );
}
