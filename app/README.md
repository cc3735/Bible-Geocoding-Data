# Bible Atlas (map viewer)

A React + Vite + Leaflet map viewer over the Bible Geocoding Data in this
repository (`../data`, `../geometry`).

## Run it

```sh
cd app
npm ci
npm run dev       # dev server
npm run build     # production build into app/dist
npm run preview   # serve app/dist locally
```

## Data

- `public/data/*.json` (`markers.json`, `place-lookup.json`,
  `modern-to-ancient.json`: the three files `src/App.jsx` fetches) is
  generated from `../data/*.jsonl` by `npm run preprocess`
  (`scripts/preprocess.js`). The generated files are
  committed so the app runs without that step; re-run it after the upstream
  data changes.
- The GeoJSON shapes shown when a place is selected come straight from the
  repo-root `../geometry/` folder; they are **not** copied into `public/`.
  A small plugin in `vite.config.js` serves them at `/data/geometry/` during
  `npm run dev` and copies every `*.geojson` into `dist/data/geometry/` during
  `npm run build`. So building needs the full repository checkout, not just
  the `app/` folder.
