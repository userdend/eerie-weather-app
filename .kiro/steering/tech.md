# Technical Stack

## Build System

- **Vite**: Modern build tool and dev server
- **Base Path**: `/eerie-weather-app/` (configured in vite.config.js)

## Core Technologies

- **Three.js** (v0.181.2): 3D rendering engine
  - GLTFLoader for 3D models
  - OrbitControls for camera interaction
  - Particle systems for weather effects
- **three-stdlib** (v2.36.1): Additional Three.js utilities
- **Vanilla JavaScript**: No frameworks, pure ES6+ modules
- **HTML5 Canvas**: WebGL rendering via Three.js
- **Web Audio API**: Looping ambient sounds

## External APIs

- **Open-Meteo API**: Real-time weather data (no API key required)
- **Nominatim (OpenStreetMap)**: Geocoding for city search

## Common Commands

```bash
# Development server (runs on http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Browser Features Used

- LocalStorage for favorites persistence
- Audio autoplay (requires user interaction)
- WebGL for 3D rendering
- Fetch API for weather data

## Asset Types

- **3D Models**: GLB format (forest_house.glb, cloud_test.glb)
- **Audio**: MP3 files for weather sounds
- **Fonts**: TTF format (OctoberCrow.ttf)
- **SVG**: Inline data URIs for custom button shapes
