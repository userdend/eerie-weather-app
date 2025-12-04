# Project Structure

## Root Files

- **index.html**: Main HTML with embedded CSS and UI components
- **main.js**: Core application logic (Three.js scene, weather system, API integration)
- **vite.config.js**: Vite configuration with base path
- **package.json**: Dependencies and npm scripts

## Public Assets

All static assets are in the `public/` directory:

```
public/
├── fonts/
│   └── OctoberCrow.ttf          # Custom spooky font
├── models/
│   ├── forest_house.glb         # Main floating house 3D model
│   └── cloud_test.glb           # Cloud model for weather effects
└── sounds/
    ├── rain.mp3                 # Rain ambient sound
    ├── thunderstorm.mp3         # Thunderstorm ambient sound
    ├── snow.mp3                 # Snow ambient sound
    ├── fog.mp3                  # Fog ambient sound
    └── windy.mp3                # Wind ambient sound
```

## Code Organization (main.js)

The main.js file is organized into logical sections:

1. **Scene Setup**: Three.js initialization, camera, renderer, controls
2. **Lighting**: Ambient, directional, and rim lights
3. **Model Loading**: GLTFLoader for house model
4. **Weather System**: State management and weather type functions
5. **Particle Systems**: Rain, snow, fog, wind particle generators
6. **Lightning System**: Bolt generation, branching, and flash effects
7. **Sound System**: Audio management with autoplay handling
8. **Weather API**: Open-Meteo integration, geocoding, city search
9. **UI Event Handlers**: Search, favorites, manual controls
10. **Animation Loop**: Particle updates, lightning timing, camera controls

## UI Components (index.html)

- **Panels Container** (top-right): Weather control and location search panels
- **Navigation Bar** (bottom): Logo, Home, and About buttons
- **About Modal**: Credits and app information overlay

## Styling Approach

All CSS is embedded in index.html using a single `<style>` tag. Key patterns:

- Dark, semi-transparent panels with backdrop blur
- Custom SVG button backgrounds (inline data URIs)
- Collapsible panels with `.minimized` class
- Fixed positioning for UI overlays
- Custom font-face declaration for October Crow

## Configuration

- **Module Type**: CommonJS (package.json)
- **Entry Point**: main.js loaded as ES module in HTML
- **No Build Output Tracking**: node_modules/ in .gitignore
