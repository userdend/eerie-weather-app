# 🌩️ Eerie Weather App

An immersive 3D weather visualization experience built with Three.js. Watch a spooky floating house react to real-time weather conditions from cities around the world, or manually control the atmosphere with rain, thunderstorms, snow, fog, and more.

![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## ✨ Features

- **7 Weather Effects**: Clear, Cloudy, Rain, Thunderstorm, Snow, Fog, and Windy
- **Dynamic Lightning**: Jagged bolts with branching effects and dramatic flashes
- **Ambient Sounds**: Looping audio for each weather type
- **Real-time Weather**: Search any city to visualize its current weather
- **Favorite Cities**: Save locations for quick access
- **Adjustable Intensity**: Control the strength of weather effects
- **Spooky Theme**: Custom font, eerie lighting, and atmospheric visuals

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd eerie-weather-app
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 🎮 Controls

- **Mouse Drag**: Rotate camera around the scene
- **Scroll**: Zoom in/out
- **Weather Dropdown**: Select weather effect
- **Intensity Slider**: Adjust effect strength (0-100)
- **City Search**: Enter a city name to fetch real weather
- **Home Button**: Reset camera to default position
- **About Button**: View app information and credits

## 📁 Project Structure

```
├── index.html          # Main HTML with UI components
├── main.js             # Three.js scene and weather logic
├── models/
│   ├── forest_house.glb   # Floating house model
│   └── cloud_test.glb     # Cloud model
├── sounds/
│   ├── rain.mp3
│   ├── thunderstorm.mp3
│   ├── windy.mp3
│   ├── snow.mp3
│   └── fog.mp3
├── fonts/
│   └── October Crow.ttf   # Custom spooky font
└── .kiro/specs/           # Feature specifications
```

## 🎵 Audio Credits

- **Windy, Rain, Thunderstorm**: [Pixabay](https://pixabay.com)
- **Snow, Fog**: Dragon Nest, Eyedentity Games

## 🛠️ Built With

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Build tool
- [Open-Meteo API](https://open-meteo.com/) - Weather data
- [Nominatim](https://nominatim.org/) - Geocoding

## 📄 License

This project is for educational and demonstration purposes.
