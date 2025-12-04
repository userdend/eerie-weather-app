# Changelog

All notable changes to the Eerie Weather App will be documented in this file.

## [1.0.0] - 2025-12-03

### Added

#### 3D Scene & Visuals

- Three.js scene with spooky dark blue-purple atmosphere
- Floating haunted house model with gentle bobbing animation
- OrbitControls for camera rotation and zoom
- Eerie lighting system (ambient, directional, rim lights)
- Scene fog for depth effect

#### Weather Effects

- **Clear**: Lighter background with no particles
- **Cloudy**: Animated cloud models floating across the scene
- **Rain**: Falling rain particles with dark clouds
- **Thunderstorm**: Heavy rain, dark storm clouds, and lightning system
- **Snow**: Drifting snowflakes with horizontal sway
- **Fog**: Volumetric fog particles with reduced visibility
- **Windy**: Horizontal wind particles

#### Lightning System

- Jagged lightning bolt geometry with randomized segments
- Branching bolts that scale with intensity
- Bright PointLight flash at strike location
- Ambient HemisphereLight for environment illumination
- Random strike intervals for unpredictability
- Fade animation for realistic flash decay

#### Sound System

- Looping ambient audio for each weather type:
  - `rain.mp3`
  - `thunderstorm.mp3` (skips first 2 seconds)
  - `windy.mp3`
  - `snow.mp3`
  - `fog.mp3`
- Volume scaling based on intensity
- Browser autoplay handling with user interaction detection
- Audio indicator showing current playing sound

#### Weather API Integration

- Real-time weather data from Open-Meteo API
- City geocoding via Nominatim (OpenStreetMap)
- Autocomplete suggestions for popular cities
- Weather condition mapping to visual effects
- Intensity calculation from API data

#### User Interface

- **Manual Control Panel**: Weather type dropdown, intensity slider (0-100)
- **Location Weather Panel**: City search, weather info display
- **Favorites System**: Save cities to localStorage, quick access dropdown
- **Navigation Bar**: Home button (camera reset), About button (modal)
- **About Modal**: App description and audio credits
- Collapsible/minimizable panels
- Custom SVG-shaped buttons

#### Theming & Styling

- "October Crow" custom spooky font
- Dark color palette with blood-red accents
- Semi-transparent panels with backdrop blur
- Custom icons for panels, buttons, and logo
- Hover effects on buttons

### Technical Details

- Built with Vite for fast development
- Pure vanilla JavaScript (no frameworks)
- ES6 modules
- Responsive WebGL canvas
- LocalStorage for favorites persistence

## Audio Credits

- **Windy, Rain, Thunderstorm**: [Pixabay](https://pixabay.com)
- **Snow, Fog**: Dragon Nest, Eyedentity Games

## [1.1.0] - 2025-12-04

### Added

- Custom icons in `public/icons/` folder:
  - `logo.png` - App logo for navigation bar
  - `home.png` - Home button icon
  - `about.png` - About button icon
  - `manual-control.png` - Manual Control panel icon
  - `weather-location.png` - Location Weather panel icon
  - `favourite.png` - Add to Favorites button icon
- `CHANGELOG.md` - Project changelog documentation

### Changed

- Replaced emoji icons with custom PNG icons throughout the UI:
  - Navigation bar logo and buttons
  - Panel headers
  - Add to Favorites button
- Default weather intensity changed from 50 to 24
- Thunderstorm audio now skips first 2 seconds when playing
- All buttons now use the "October Crow" font (`font-family: inherit`)

### Fixed

- Buttons not inheriting the custom spooky font
