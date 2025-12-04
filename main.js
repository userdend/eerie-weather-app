import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Set spooky default background
scene.background = new THREE.Color(0x1a1a2e); // Dark blue-purple
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50); // Subtle fog for depth

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 20;

// Add lighting with eerie tones
const ambientLight = new THREE.AmbientLight(0x9999cc, 0.4); // Dim purplish light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xaaaadd, 0.3); // Soft moonlight
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Add eerie rim light
const rimLight = new THREE.DirectionalLight(0x6666aa, 0.2);
rimLight.position.set(-5, 3, -5);
scene.add(rimLight);

// Load house model
const loader = new GLTFLoader();
let house;

loader.load("models/forest_house.glb", (gltf) => {
  house = gltf.scene;

  const box = new THREE.Box3().setFromObject(house);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  house.position.x = -center.x;
  house.position.z = -center.z;
  house.userData.centerY = -center.y - 2.5;
  house.rotation.x = Math.PI * -0.15;
  house.rotation.y = Math.PI * 0.5;

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 6 / maxDim;
  house.scale.setScalar(scale);

  scene.add(house);

  camera.position.set(0, 2, 5);
  camera.lookAt(0, 0, 0);
});

// Weather System
let currentWeather = null;
let weatherIntensity = 24;

// Weather objects
let rainParticles = null;
let snowParticles = null;
let fogMesh = null;
let clouds = [];
let thunderLight = null;
let windParticles = null;

// Lightning system
let lightningBolts = [];
let ambientFlashLight = null;
let nextStrikeTime = 0;
let lightningState = { active: false, fadeStart: 0, duration: 0 };

// Sound system
const weatherSounds = {
  rain: new Audio("sounds/rain.mp3"),
  thunderstorm: new Audio("sounds/thunderstorm.mp3"),
  windy: new Audio("sounds/windy.mp3"),
  snow: new Audio("sounds/snow.mp3"),
  fog: new Audio("sounds/fog.mp3"),
};

// Configure all sounds to loop
Object.values(weatherSounds).forEach((sound) => {
  sound.loop = true;
  sound.volume = 0.5;
});

let currentSound = null;
let currentWeatherSound = null;
let userHasInteracted = false;
let pendingWeatherSound = null;

// Track user interaction to enable audio
function enableAudioOnInteraction() {
  if (!userHasInteracted) {
    userHasInteracted = true;
    // Play pending sound if any
    if (pendingWeatherSound) {
      playWeatherSound(pendingWeatherSound.type, pendingWeatherSound.intensity);
      pendingWeatherSound = null;
    }
  }
}

// Listen for any user interaction
["click", "touchstart", "keydown"].forEach((event) => {
  document.addEventListener(event, enableAudioOnInteraction, { once: false });
});

function stopAllSounds() {
  Object.values(weatherSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  currentSound = null;
  currentWeatherSound = null;
  pendingWeatherSound = null;

  // Update audio indicator
  const audioNameEl = document.getElementById("audio-name");
  if (audioNameEl) {
    audioNameEl.textContent = "None";
  }
}

function playWeatherSound(weatherType, intensity) {
  const sound = weatherSounds[weatherType];
  if (!sound) {
    return;
  }

  // If user hasn't interacted yet, queue the sound
  if (!userHasInteracted) {
    pendingWeatherSound = { type: weatherType, intensity: intensity };
    return;
  }

  // Stop all other sounds
  Object.values(weatherSounds).forEach((s) => {
    if (s !== sound) {
      s.pause();
      s.currentTime = 0;
    }
  });

  // Set volume
  sound.volume = 0.3 + (intensity / 100) * 0.5;
  currentSound = sound;
  currentWeatherSound = weatherType;

  // Skip first 2 seconds for thunderstorm audio
  if (weatherType === "thunderstorm") {
    sound.currentTime = 5;
  }

  // Update audio indicator
  const audioNameEl = document.getElementById("audio-name");
  if (audioNameEl) {
    audioNameEl.textContent = weatherType + ".mp3";
  }

  // Play the sound
  sound.play().catch(() => {
    // Silently ignore - user interaction required
  });
}

// Clear all weather effects
function clearAllWeather() {
  // Note: Don't stop sounds here - let playWeatherSound handle it
  // This prevents race conditions when switching weather types

  // Remove rain
  if (rainParticles) {
    scene.remove(rainParticles);
    rainParticles.geometry.dispose();
    rainParticles.material.dispose();
    rainParticles = null;
  }

  // Remove snow
  if (snowParticles) {
    scene.remove(snowParticles);
    snowParticles.geometry.dispose();
    snowParticles.material.dispose();
    snowParticles = null;
  }

  // Remove fog
  if (fogMesh) {
    scene.remove(fogMesh);
    fogMesh.geometry.dispose();
    fogMesh.material.dispose();
    fogMesh = null;
  }
  // Reset to default spooky background
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

  // Reset lighting colors to spooky defaults
  ambientLight.color.setHex(0x9999cc);
  ambientLight.intensity = 0.4;
  directionalLight.color.setHex(0xaaaadd);
  directionalLight.intensity = 0.3;

  // Remove clouds
  clouds.forEach((cloud) => {
    scene.remove(cloud);
  });
  clouds = [];

  // Remove thunder light
  if (thunderLight) {
    scene.remove(thunderLight);
    thunderLight = null;
  }

  // Remove lightning bolts
  lightningBolts.forEach((bolt) => {
    scene.remove(bolt);
    bolt.geometry.dispose();
    bolt.material.dispose();
  });
  lightningBolts = [];

  // Remove ambient flash light
  if (ambientFlashLight) {
    scene.remove(ambientFlashLight);
    ambientFlashLight = null;
  }

  // Reset lightning state
  lightningState = { active: false, fadeStart: 0, duration: 0 };
  nextStrikeTime = 0;

  // Remove wind particles
  if (windParticles) {
    scene.remove(windParticles);
    windParticles.geometry.dispose();
    windParticles.material.dispose();
    windParticles = null;
  }
}

// Weather: Clear/Sunny
function enableClear(intensity) {
  clearAllWeather();
  stopAllSounds();

  // Keep spooky atmosphere even in clear weather
  scene.background = new THREE.Color(0x2a2a3e); // Slightly lighter dark blue
  scene.fog = new THREE.Fog(0x2a2a3e, 15, 60);

  ambientLight.intensity = 0.5 + (intensity / 100) * 0.3;
  ambientLight.color.setHex(0x9999cc);
  directionalLight.intensity = 0.4 + (intensity / 100) * 0.3;
  directionalLight.color.setHex(0xaaaadd);
}

// Weather: Cloudy
function enableCloudy(intensity) {
  clearAllWeather();
  stopAllSounds();

  const cloudCount = Math.floor(5 + (intensity / 100) * 15);
  const cloudLoader = new GLTFLoader();

  for (let i = 0; i < cloudCount; i++) {
    cloudLoader.load("models/cloud_test.glb", (gltf) => {
      const cloud = gltf.scene.clone();

      cloud.position.x = (Math.random() - 0.5) * 20;
      cloud.position.y = 2 + Math.random() * 3;
      cloud.position.z = -7.5 + Math.random() * 10;

      const scale = 0.3 + (intensity / 100) * 0.7;
      cloud.scale.setScalar(scale);

      cloud.userData.speed =
        (0.2 + (intensity / 100) * 0.4) * (0.5 + Math.random() * 0.5);
      cloud.userData.floatOffset = Math.random() * Math.PI * 2;
      cloud.userData.baseY = cloud.position.y;

      clouds.push(cloud);
      scene.add(cloud);
    });
  }

  ambientLight.intensity = 0.6 - (intensity / 100) * 0.2;
}

// Weather: Rain
function enableRain(intensity) {
  clearAllWeather();

  // Add rain clouds based on intensity
  const cloudCount = Math.floor(8 + (intensity / 100) * 12);
  const cloudLoader = new GLTFLoader();

  for (let i = 0; i < cloudCount; i++) {
    cloudLoader.load("models/cloud_test.glb", (gltf) => {
      const cloud = gltf.scene.clone();

      cloud.position.x = (Math.random() - 0.5) * 25;
      cloud.position.y = 3 + Math.random() * 2;
      cloud.position.z = -7.5 + Math.random() * 10;

      // Darker, denser clouds for rain
      const scale = 0.6 + (intensity / 100) * 0.5;
      cloud.scale.setScalar(scale);

      // Make clouds darker for rain
      cloud.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.multiplyScalar(0.5 + (intensity / 100) * 0.2);
        }
      });

      cloud.userData.speed = 0.15 + (intensity / 100) * 0.25;
      cloud.userData.floatOffset = Math.random() * Math.PI * 2;
      cloud.userData.baseY = cloud.position.y;

      clouds.push(cloud);
      scene.add(cloud);
    });
  }

  // Add rain particles
  const rainCount = Math.floor(500 + (intensity / 100) * 1500);
  const rainGeometry = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 30;
    rainPositions[i * 3 + 1] = Math.random() * 20;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }

  rainGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(rainPositions, 3)
  );

  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.1,
    transparent: true,
    opacity: 0.4 + (intensity / 100) * 0.4,
  });

  rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  rainParticles.userData.velocities = new Float32Array(rainCount).map(
    () => 0.1 + (intensity / 100) * 0.2
  );
  scene.add(rainParticles);

  ambientLight.intensity = 0.5 - (intensity / 100) * 0.2;

  // Play rain sound
  playWeatherSound("rain", intensity);
}

// Weather: Thunderstorm
function enableThunderstorm(intensity) {
  clearAllWeather();

  // Add dark storm clouds based on intensity
  const cloudCount = Math.floor(12 + (intensity / 100) * 15);
  const cloudLoader = new GLTFLoader();

  for (let i = 0; i < cloudCount; i++) {
    cloudLoader.load("models/cloud_test.glb", (gltf) => {
      const cloud = gltf.scene.clone();

      cloud.position.x = (Math.random() - 0.5) * 30;
      cloud.position.y = 3.5 + Math.random() * 2.5;
      cloud.position.z = -7.5 + Math.random() * 10;

      // Larger, darker clouds for thunderstorm
      const scale = 0.7 + (intensity / 100) * 0.6;
      cloud.scale.setScalar(scale);

      // Make clouds very dark for storm
      cloud.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.multiplyScalar(0.3 + (intensity / 100) * 0.1);
        }
      });

      cloud.userData.speed = 0.2 + (intensity / 100) * 0.3;
      cloud.userData.floatOffset = Math.random() * Math.PI * 2;
      cloud.userData.baseY = cloud.position.y;

      clouds.push(cloud);
      scene.add(cloud);
    });
  }

  // Add heavy rain
  const rainCount = Math.floor(800 + (intensity / 100) * 1700);
  const rainGeometry = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 30;
    rainPositions[i * 3 + 1] = Math.random() * 20;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }

  rainGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(rainPositions, 3)
  );

  const rainMaterial = new THREE.PointsMaterial({
    color: 0x888888,
    size: 0.12,
    transparent: true,
    opacity: 0.5 + (intensity / 100) * 0.4,
  });

  rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  rainParticles.userData.velocities = new Float32Array(rainCount).map(
    () => 0.15 + (intensity / 100) * 0.25
  );
  scene.add(rainParticles);

  // Add main thunder light (bright flash point)
  thunderLight = new THREE.PointLight(0xcceeff, 0, 80);
  thunderLight.position.set(0, 12, 0);
  scene.add(thunderLight);

  // Add ambient flash light for environment illumination
  ambientFlashLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0);
  scene.add(ambientFlashLight);

  // Initialize lightning timing
  nextStrikeTime = Date.now() + 1000 + Math.random() * 2000;

  ambientLight.intensity = 0.3 - (intensity / 100) * 0.1;

  // Play thunderstorm sound
  playWeatherSound("thunderstorm", intensity);
}

// Create a lightning bolt geometry
function createLightningBolt(startX, startY, startZ, endX, endY, endZ) {
  // Validate inputs to prevent NaN
  if (
    isNaN(startX) ||
    isNaN(startY) ||
    isNaN(startZ) ||
    isNaN(endX) ||
    isNaN(endY) ||
    isNaN(endZ)
  ) {
    return null;
  }

  const points = [];
  const segments = 8 + Math.floor(Math.random() * 6);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let x = startX + (endX - startX) * t;
    let y = startY + (endY - startY) * t;
    let z = startZ + (endZ - startZ) * t;

    // Add jagged randomness (less at start and end)
    const jitter = Math.sin(t * Math.PI) * 1.5;
    if (i > 0 && i < segments) {
      x += (Math.random() - 0.5) * jitter;
      z += (Math.random() - 0.5) * jitter;
    }

    points.push(new THREE.Vector3(x, y, z));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xeeffff,
    transparent: true,
    opacity: 1,
    linewidth: 2,
  });

  const bolt = new THREE.Line(geometry, material);
  bolt.userData.createdAt = Date.now();
  bolt.userData.lifetime = 80 + Math.random() * 120;

  return bolt;
}

// Create branching lightning
function createLightningStrike(intensity) {
  // Ensure intensity is valid
  const safeIntensity = intensity || 50;

  // Random strike position in sky
  const strikeX = (Math.random() - 0.5) * 25;
  const strikeZ = (Math.random() - 0.5) * 15 - 5;
  const startY = 8 + Math.random() * 4;
  const endY = -2 + Math.random() * 4;

  // Main bolt
  const mainBolt = createLightningBolt(
    strikeX,
    startY,
    strikeZ,
    strikeX + (Math.random() - 0.5) * 3,
    endY,
    strikeZ + (Math.random() - 0.5) * 2
  );
  if (mainBolt) {
    scene.add(mainBolt);
    lightningBolts.push(mainBolt);
  }

  // Add branches based on intensity
  const branchCount = Math.floor(1 + (safeIntensity / 100) * 3);
  for (let i = 0; i < branchCount; i++) {
    const branchStart = 0.3 + Math.random() * 0.4;
    const branchY = startY - (startY - endY) * branchStart;
    const branchEndX = strikeX + (Math.random() - 0.5) * 6;
    const branchEndY = branchY - 2 - Math.random() * 3;
    const branchEndZ = strikeZ + (Math.random() - 0.5) * 4;

    const branch = createLightningBolt(
      strikeX + (Math.random() - 0.5) * 0.5,
      branchY,
      strikeZ + (Math.random() - 0.5) * 0.5,
      branchEndX,
      branchEndY,
      branchEndZ
    );
    if (branch) {
      scene.add(branch);
      lightningBolts.push(branch);
    }
  }

  // Position the thunder light at strike location
  thunderLight.position.set(strikeX, startY - 2, strikeZ);

  // Trigger flash
  const flashIntensity = 3 + (intensity / 100) * 7;
  thunderLight.intensity = flashIntensity;
  ambientFlashLight.intensity = 0.5 + (intensity / 100) * 1.5;

  // Set lightning state for fade
  lightningState = {
    active: true,
    fadeStart: Date.now(),
    duration: 100 + Math.random() * 150,
    flashIntensity: flashIntensity,
    ambientIntensity: ambientFlashLight.intensity,
  };

  // Schedule next strike (random interval for unpredictability)
  const frequencyBoost = 0.25; // 0.5 = twice as frequent, 0.25 = 4× frequent
  const minInterval = (800 - (intensity / 100) * 400) * frequencyBoost;
  const maxInterval = (4000 - (intensity / 100) * 2000) * frequencyBoost;
  nextStrikeTime =
    Date.now() + minInterval + Math.random() * (maxInterval - minInterval);
}

// Weather: Snow
function enableSnow(intensity) {
  clearAllWeather();

  const snowCount = Math.floor(300 + (intensity / 100) * 1200);
  const snowGeometry = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(snowCount * 3);

  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 30;
    snowPositions[i * 3 + 1] = Math.random() * 20;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }

  snowGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(snowPositions, 3)
  );

  const snowMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true,
    opacity: 0.6 + (intensity / 100) * 0.3,
  });

  snowParticles = new THREE.Points(snowGeometry, snowMaterial);
  snowParticles.userData.velocities = new Float32Array(snowCount).map(
    () => 0.02 + (intensity / 100) * 0.05
  );
  scene.add(snowParticles);

  ambientLight.intensity = 0.7;

  // Play snow sound
  playWeatherSound("snow", intensity);
}

// Weather: Fog
function enableFog(intensity) {
  clearAllWeather();

  // Spooky eerie fog colors - dark greenish/grayish
  const fogColor = 0x1a1a2e; // Dark greenish-gray
  const particleColor = 0x4a5a4e; // Slightly lighter greenish-gray

  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.Fog(fogColor, 1, 10 - (intensity / 100) * 5);

  // Add volumetric fog particles for better visibility
  const fogParticleCount = Math.floor(300 + (intensity / 100) * 700);
  const fogGeometry = new THREE.BufferGeometry();
  const fogPositions = new Float32Array(fogParticleCount * 3);

  for (let i = 0; i < fogParticleCount; i++) {
    fogPositions[i * 3] = (Math.random() - 0.5) * 40;
    fogPositions[i * 3 + 1] = Math.random() * 15;
    fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }

  fogGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(fogPositions, 3)
  );

  const fogMaterial = new THREE.PointsMaterial({
    color: particleColor,
    size: 2 + (intensity / 100) * 3,
    transparent: true,
    opacity: 0.2 + (intensity / 100) * 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  fogMesh = new THREE.Points(fogGeometry, fogMaterial);
  fogMesh.userData.velocities = new Float32Array(fogParticleCount).map(() => ({
    x: (Math.random() - 0.5) * 0.008,
    y: (Math.random() - 0.5) * 0.003,
    z: (Math.random() - 0.5) * 0.008,
  }));
  scene.add(fogMesh);

  // Dim, eerie lighting
  ambientLight.intensity = 0.3 - (intensity / 100) * 0.15;
  ambientLight.color.setHex(0x8a9a8e); // Greenish tint
  directionalLight.intensity = 0.2;
  directionalLight.color.setHex(0x7a8a7e); // Greenish tint

  renderer.setClearColor(fogColor);

  // Play fog sound
  playWeatherSound("fog", intensity);
}

// Weather: Windy
function enableWindy(intensity) {
  clearAllWeather();

  const windCount = Math.floor(200 + (intensity / 100) * 800);
  const windGeometry = new THREE.BufferGeometry();
  const windPositions = new Float32Array(windCount * 3);

  for (let i = 0; i < windCount; i++) {
    windPositions[i * 3] = (Math.random() - 0.5) * 30;
    windPositions[i * 3 + 1] = Math.random() * 15;
    windPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }

  windGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(windPositions, 3)
  );

  const windMaterial = new THREE.PointsMaterial({
    color: 0xdddddd,
    size: 0.15,
    transparent: true,
    opacity: 0.2 + (intensity / 100) * 0.3,
  });

  windParticles = new THREE.Points(windGeometry, windMaterial);
  windParticles.userData.speed = 0.1 + (intensity / 100) * 0.3;
  scene.add(windParticles);

  // Play windy sound
  playWeatherSound("windy", intensity);
}

// Set weather function
function setWeather(weatherType, intensity) {
  currentWeather = weatherType;
  weatherIntensity = intensity;

  switch (weatherType) {
    case "clear":
      enableClear(intensity);
      break;
    case "cloudy":
      enableCloudy(intensity);
      break;
    case "rain":
      enableRain(intensity);
      break;
    case "thunderstorm":
      enableThunderstorm(intensity);
      break;
    case "snow":
      enableSnow(intensity);
      break;
    case "fog":
      enableFog(intensity);
      break;
    case "windy":
      enableWindy(intensity);
      break;
  }
}

// Weather API Configuration
let manualOverride = false;
let currentCityData = null;
let favorites = JSON.parse(localStorage.getItem("favoriteCities")) || [];

// City database for autocomplete (popular cities)
const popularCities = [
  "London",
  "New York",
  "Tokyo",
  "Paris",
  "Berlin",
  "Moscow",
  "Sydney",
  "Toronto",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "San Jose",
  "Austin",
  "Jacksonville",
  "San Francisco",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Kolkata",
  "Chennai",
  "Beijing",
  "Shanghai",
  "Singapore",
  "Dubai",
  "Istanbul",
  "Rome",
  "Madrid",
  "Barcelona",
  "Amsterdam",
  "Vienna",
  "Prague",
  "Budapest",
  "Warsaw",
  "Stockholm",
  "Copenhagen",
  "Oslo",
  "Helsinki",
  "Athens",
  "Lisbon",
  "Dublin",
  "Brussels",
  "Zurich",
  "Geneva",
  "Milan",
  "Venice",
  "Florence",
  "Naples",
  "Manchester",
  "Liverpool",
  "Edinburgh",
];

const coords = {};

// Map OpenWeatherMap conditions to our weather types
function mapWeatherCondition(weatherMain, weatherDesc) {
  const main = weatherMain.toLowerCase();
  const desc = weatherDesc.toLowerCase();

  if (main === "thunderstorm") return "thunderstorm";
  if (main === "drizzle" || main === "rain") {
    if (desc.includes("heavy") || desc.includes("extreme"))
      return "thunderstorm";
    return "rain";
  }
  if (main === "snow") return "snow";
  if (main === "mist" || main === "fog" || main === "haze") return "fog";
  if (main === "clouds") {
    if (desc.includes("few") || desc.includes("scattered")) return "cloudy";
    return "cloudy";
  }
  if (main === "windy") return "windy";
  if (main === "clear") return "clear";

  return "clear";
}

// Calculate intensity based on weather data
function calculateIntensity(weatherData) {
  const main = weatherData.condition.toLowerCase();
  const clouds = weatherData.raw?.current?.cloud_cover || 0;
  const rain = weatherData.raw?.current?.rain || 0;
  const snow = weatherData.raw?.current?.snowfall || 0;
  const wind = weatherData.raw?.current?.wind_speed_10m || 0;

  if (main === "thunderstorm") return Math.min(70 + rain * 5, 100);
  if (main === "rain") return Math.min(40 + rain * 10, 90);
  if (main === "snow") return Math.min(40 + snow * 10, 90);
  if (main === "clouds") return Math.min(30 + clouds * 0.7, 90);
  if (main === "mist" || main === "fog") return Math.min(50 + clouds * 0.5, 90);
  if (main === "windy") return Math.min(Math.max((wind / 50) * 100, 0), 100);
  if (main === "clear") return Math.max(20, 100 - clouds);

  return 50;
}

// Fetch weather data
// Normalize strings (remove spaces and lowercase)
function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, "");
}

// Try to find a city in your list, fuzzy match
function findCity(input) {
  const normalizedInput = normalize(input);
  return popularCities.find((c) => normalize(c).includes(normalizedInput));
}

// Get coordinates from either local cache or Nominatim
async function getCoords(cityName) {
  // Check local cache first
  if (coords[cityName]) return coords[cityName];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cityName
    )}&format=json&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      const result = {
        place: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      coords[cityName] = result; // cache it
      return result;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error fetching coordinates:", err);
    return null;
  }
}

// Main function to resolve user input to coordinates
async function resolveCity(input) {
  const matchedCity = findCity(input) || input; // try local match, fallback to raw input
  const location = await getCoords(matchedCity);
  if (!location) {
    alert(`Could not find coordinates for "${input}"`);
  }
  return location; // {lat, lng} or null
}

// Fetch weather data using Open-Meteo
async function fetchWeather(cityName) {
  try {
    const location = await resolveCity(cityName);
    const lat = location.lat;
    const lon = location.lng;

    // Open-Meteo API endpoint
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure`;
    // console.log("Fetching weather from:", url);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      alert(`Error fetching weather for ${cityName}`);
      return null;
    }

    // console.log("Weather data:", data);

    // Open-Meteo returns condition in `weathercode`, you may map it:
    // 0=Clear, 1-3=Cloudy, 61-67=Rain, 71-77=Snow, 95-99=Thunderstorm
    const weatherCode = data.current.weather_code;
    let condition = "Clear";

    if ([1, 2, 3].includes(weatherCode)) condition = "Clouds";
    else if ([61, 63, 65, 66, 67].includes(weatherCode)) condition = "Rain";
    else if ([71, 73, 75, 77].includes(weatherCode)) condition = "Snow";
    else if ([95, 96, 99].includes(weatherCode)) condition = "Thunderstorm";
    else if ([45, 48].includes(weatherCode)) condition = "Fog";

    if (condition === "Clear" && data.current?.wind_speed_10m > 5) {
      condition = "Windy";
    }

    return {
      city: location.place,
      raw: data,
      condition,
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    alert("Network error. Please check your internet connection.");
    return null;
  }
}

// Display weather info
function displayWeatherInfo(data) {
  currentCityData = data;

  document.getElementById(
    "city-name"
  ).textContent = `${data.city} (${data.raw?.latitude}, ${data.raw?.longitude})`;
  document.getElementById("weather-desc").textContent = `☁️ ${data.condition}`;
  document.getElementById("temperature").textContent = `🌡️ ${Math.round(
    data.raw.current.temperature_2m
  )}°C`;
  document.getElementById(
    "humidity"
  ).textContent = `💧 Humidity: ${data.raw.current.relative_humidity_2m}%`;
  document.getElementById(
    "wind-speed"
  ).textContent = `💨 Wind: ${data.raw.current.wind_speed_10m} m/s`;

  document.getElementById("weather-info").style.display = "block";

  // Update scene if not manually overridden
  if (!manualOverride) {
    const weatherType = mapWeatherCondition(data.condition, data.condition);
    const intensity = calculateIntensity(data);
    setWeather(weatherType, intensity);

    // Update UI to reflect API weather
    document.getElementById("weather-select").value = weatherType;
    document.getElementById("intensity-slider").value = intensity;
    document.getElementById("intensity-value").textContent = intensity;
  }
}

// Autocomplete functionality
const citySearch = document.getElementById("city-search");
const autocompleteList = document.getElementById("autocomplete-list");

citySearch.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  autocompleteList.innerHTML = "";

  if (value.length < 2) {
    autocompleteList.style.display = "none";
    return;
  }

  const matches = popularCities
    .filter((city) => city.toLowerCase().includes(value))
    .slice(0, 8);

  if (matches.length > 0) {
    matches.forEach((city) => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.textContent = city;
      div.addEventListener("click", () => {
        citySearch.value = city;
        autocompleteList.style.display = "none";
      });
      autocompleteList.appendChild(div);
    });
    autocompleteList.style.display = "block";
  } else {
    autocompleteList.style.display = "none";
  }
});

// Close autocomplete when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    autocompleteList.style.display = "none";
  }
});

// Search button
document.getElementById("search-btn").addEventListener("click", async () => {
  const cityName = citySearch.value.trim();
  if (!cityName) {
    alert("Please enter a city name");
    return;
  }

  const data = await fetchWeather(cityName);

  // console.log(data);

  if (data) {
    manualOverride = false; // Reset override BEFORE displaying weather info
    displayWeatherInfo(data);
  }
});

// Add to favorites
document.getElementById("add-favorite-btn").addEventListener("click", () => {
  if (!currentCityData) return;

  const cityName = currentCityData.city;
  if (!favorites.includes(cityName)) {
    favorites.push(cityName);
    localStorage.setItem("favoriteCities", JSON.stringify(favorites));
    updateFavoritesDropdown();
    alert(`${cityName} added to favorites!`);
  } else {
    alert(`${cityName} is already in favorites!`);
  }
});

// Update favorites dropdown
function updateFavoritesDropdown() {
  const select = document.getElementById("favorites-select");
  select.innerHTML = '<option value="">-- Select Favorite --</option>';

  favorites.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    select.appendChild(option);
  });
}

// Favorites dropdown change
document
  .getElementById("favorites-select")
  .addEventListener("change", async (e) => {
    const cityName = e.target.value;
    if (!cityName) return;

    citySearch.value = cityName;
    const data = await fetchWeather(cityName);
    if (data) {
      manualOverride = false; // Reset override BEFORE displaying weather info
      displayWeatherInfo(data);
    }
  });

// Manual weather controls
const weatherSelect = document.getElementById("weather-select");
const intensitySlider = document.getElementById("intensity-slider");
const intensityValue = document.getElementById("intensity-value");

weatherSelect.addEventListener("change", (e) => {
  manualOverride = true; // User manually changed weather
  setWeather(e.target.value, weatherIntensity);
});

intensitySlider.addEventListener("input", (e) => {
  manualOverride = true; // User manually changed intensity
  weatherIntensity = parseInt(e.target.value);
  intensityValue.textContent = weatherIntensity;
  setWeather(currentWeather, weatherIntensity);
});

// Initialize
updateFavoritesDropdown();
setWeather("rain", 24);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Floating house
  if (house) {
    house.position.y = house.userData.centerY + Math.sin(time * 0.5) * 0.2;
  }

  // Animate clouds
  clouds.forEach((cloud) => {
    cloud.position.x -= cloud.userData.speed * 0.01;
    cloud.position.y =
      cloud.userData.baseY +
      Math.sin(time * 0.3 + cloud.userData.floatOffset) * 0.3;

    if (cloud.position.x < -15) {
      cloud.position.x = 20 + Math.random() * 5;
      cloud.position.z = -7.5 + Math.random() * 10;
    }
  });

  // Animate rain
  if (rainParticles) {
    const positions = rainParticles.geometry.attributes.position.array;
    const velocities = rainParticles.userData.velocities;

    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] -= velocities[i];

      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 15;
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    rainParticles.geometry.attributes.position.needsUpdate = true;
  }

  // Animate snow
  if (snowParticles) {
    const positions = snowParticles.geometry.attributes.position.array;
    const velocities = snowParticles.userData.velocities;

    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] -= velocities[i];
      positions[i * 3] += Math.sin(time + i) * 0.01;

      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 15;
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    snowParticles.geometry.attributes.position.needsUpdate = true;
  }

  // Animate lightning system
  if (currentWeather === "thunderstorm" && thunderLight) {
    const now = Date.now();

    // Trigger new lightning strike
    if (now >= nextStrikeTime) {
      createLightningStrike(weatherIntensity);
    }

    // Fade lightning flash
    if (lightningState.active) {
      const elapsed = now - lightningState.fadeStart;
      const progress = elapsed / lightningState.duration;

      if (progress >= 1) {
        // Flash complete
        thunderLight.intensity = 0;
        ambientFlashLight.intensity = 0;
        lightningState.active = false;

        // Occasional secondary flash (aftershock)
        if (Math.random() < 0.3) {
          setTimeout(() => {
            if (thunderLight && currentWeather === "thunderstorm") {
              thunderLight.intensity = lightningState.flashIntensity * 0.4;
              ambientFlashLight.intensity =
                lightningState.ambientIntensity * 0.3;
              setTimeout(() => {
                if (thunderLight) thunderLight.intensity = 0;
                if (ambientFlashLight) ambientFlashLight.intensity = 0;
              }, 30 + Math.random() * 50);
            }
          }, 50 + Math.random() * 100);
        }
      } else {
        // Quick fade out
        const fade = 1 - Math.pow(progress, 0.5);
        thunderLight.intensity = lightningState.flashIntensity * fade;
        ambientFlashLight.intensity = lightningState.ambientIntensity * fade;
      }
    }

    // Update and remove old lightning bolts
    for (let i = lightningBolts.length - 1; i >= 0; i--) {
      const bolt = lightningBolts[i];
      const age = now - bolt.userData.createdAt;

      if (age > bolt.userData.lifetime) {
        scene.remove(bolt);
        bolt.geometry.dispose();
        bolt.material.dispose();
        lightningBolts.splice(i, 1);
      } else {
        // Fade bolt opacity
        const fadeProgress = age / bolt.userData.lifetime;
        bolt.material.opacity = 1 - Math.pow(fadeProgress, 0.3);
      }
    }
  }

  // Animate wind
  if (windParticles) {
    const positions = windParticles.geometry.attributes.position.array;
    const speed = windParticles.userData.speed;

    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3] += speed;
      positions[i * 3 + 1] += Math.sin(time + i) * 0.02;

      if (positions[i * 3] > 15) {
        positions[i * 3] = -15;
        positions[i * 3 + 1] = Math.random() * 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
    }
    windParticles.geometry.attributes.position.needsUpdate = true;
  }

  // Animate fog
  if (fogMesh) {
    const positions = fogMesh.geometry.attributes.position.array;
    const velocities = fogMesh.userData.velocities;

    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      positions[i * 3 + 2] += velocities[i].z;

      // Wrap around boundaries
      if (positions[i * 3] > 20) positions[i * 3] = -20;
      if (positions[i * 3] < -20) positions[i * 3] = 20;
      if (positions[i * 3 + 1] > 15) positions[i * 3 + 1] = 0;
      if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 15;
      if (positions[i * 3 + 2] > 20) positions[i * 3 + 2] = -20;
      if (positions[i * 3 + 2] < -20) positions[i * 3 + 2] = 20;
    }
    fogMesh.geometry.attributes.position.needsUpdate = true;
  }

  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// Navigation Bar Handlers
const initialCameraPosition = new THREE.Vector3(0, 2, 5);
const initialCameraTarget = new THREE.Vector3(0, 0, 0);

// Home button - reset camera to original position
document.getElementById("home-btn").addEventListener("click", () => {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialCameraTarget);
  controls.update();
});

// About button - show modal
document.getElementById("about-btn").addEventListener("click", () => {
  document.getElementById("about-modal").classList.add("show");
});

// Close about modal
document.getElementById("close-about-btn").addEventListener("click", () => {
  document.getElementById("about-modal").classList.remove("show");
});

// Close modal when clicking outside content
document.getElementById("about-modal").addEventListener("click", (e) => {
  if (e.target.id === "about-modal") {
    document.getElementById("about-modal").classList.remove("show");
  }
});
