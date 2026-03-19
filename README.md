# TARDIP

**Terrestrial Antipodal Reflection & Diametric Inversion Point**

A 3D globe webapp that lets you explore antipodal points on Earth — the spot diametrically opposite to any location, straight through the planet's core.

## Features

- 🌍 **Interactive 3D Globe** — CesiumJS-powered Google Earth–style viewer with OpenStreetMap tiles
- 🔍 **Location Search** — Look up any city, postal code, country, or address via Nominatim (OSM)
- 📍 **Current Location** — One-click geolocation with IP-based fallback
- 🎯 **Antipode Visualization** — Markers, glowing arc, and animated fly-to sequence
- 🗺️ **Reverse Geocoding** — See what's at your antipode (nearest city/town or ocean name)
- 📱 **Responsive** — Works on desktop and mobile browsers
- 🔓 **Fully Open Source** — No API keys, no proprietary services

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Vanilla TypeScript + Vite |
| 3D Globe | [CesiumJS](https://cesium.com/cesiumjs/) |
| Map Tiles | [OpenStreetMap](https://www.openstreetmap.org/) |
| Geocoding | [Nominatim](https://nominatim.org/) |
| IP Location | [ipapi.co](https://ipapi.co/) |
| Hosting | GitHub Pages |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

An **antipode** is the point on Earth's surface diametrically opposite to a given point. For any location at coordinates (φ, λ), the antipode is at (-φ, λ ± 180°).

Fun facts:
- Only ~4% of Earth's land has land antipodes (most land's antipode is ocean)
- Spain/Portugal ↔ New Zealand is one of the few land-to-land antipode pairs
- The term comes from Greek: *anti-* (opposite) + *pous* (foot) — "those with feet opposite"

## Deployment

The app deploys automatically to GitHub Pages via GitHub Actions on push to `main`. The workflow builds the static site and publishes the `dist/` directory.

## License

MIT
