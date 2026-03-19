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
- 🛰️ **Satellite View** — Toggle between street map and satellite imagery
- 🔓 **Fully Open Source** — No API keys required, all dependencies properly licensed

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Vanilla TypeScript + Vite |
| 3D Globe | [CesiumJS](https://cesium.com/cesiumjs/) |
| Map Tiles | [OpenStreetMap](https://www.openstreetmap.org/) |
| Satellite Tiles | [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) |
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

## Licenses & Attributions

This project uses the following open-source libraries and services:

### Libraries

| Library | License | Link |
|---------|---------|------|
| CesiumJS | Apache-2.0 | [github.com/CesiumGS/cesium](https://github.com/CesiumGS/cesium) |
| Vite | MIT | [github.com/vitejs/vite](https://github.com/vitejs/vite) |
| vite-plugin-cesium | MIT | [github.com/nshen/vite-plugin-cesium](https://github.com/nshen/vite-plugin-cesium) |
| TypeScript | Apache-2.0 | [github.com/microsoft/TypeScript](https://github.com/microsoft/TypeScript) |

### Tile Services

| Service | Terms | Attribution |
|---------|-------|-------------|
| OpenStreetMap | [ODbL 1.0](https://www.openstreetmap.org/copyright) | © OpenStreetMap contributors |
| Esri World Imagery | [Esri Master License Agreement](https://www.esri.com/en-us/legal/terms/full-master-agreement) | Esri, Maxar, Earthstar Geographics, and the GIS User Community |

### APIs

| Service | Terms | Notes |
|---------|-------|-------|
| Nominatim | [Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) | Max 1 req/sec, requires User-Agent |
| ipapi.co | [Terms of Service](https://ipapi.co/terms/) | Free tier: 1,000 requests/day |

## License

MIT
