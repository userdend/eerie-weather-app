# 🌩️ Building a Haunted Weather App: A Spooky Journey into 3D Web Development

_When the fog rolls in and lightning strikes, you know you're not in Kansas anymore..._

---

## 👻 The Idea That Haunted Me

It started on a dark and stormy night (okay, it was actually a Tuesday afternoon, but let me set the mood here). I wanted to build something that combined my love for atmospheric visuals with practical functionality. What if checking the weather could be... _spooky_?

Enter the **Eerie Weather App** — a 3D weather visualization experience where a haunted floating house reacts to real-time weather conditions from cities around the world. Rain? The skies darken and droplets fall. Thunderstorm? Lightning cracks across the sky with an eerie glow. It's like having your own personal haunted house that tells you whether to bring an umbrella.

![Screenshot: Main scene with floating house](screenshots/main-scene.png)
_The floating house awaits, shrouded in eternal twilight..._

---

## 🎨 Designing for the Darkness: UI & Visual Inspiration

### The Color Palette of Nightmares

Every good haunted experience needs the right atmosphere. I chose a color scheme that whispers "something wicked this way comes":

- **Background**: Deep blue-purple (`#1a1a2e`) — like the sky just before a storm
- **Accent**: Blood red (`#460809` → `#f4320b` on hover) — because what's spooky without a little crimson?
- **Text Glow**: Ethereal red with text shadows that pulse like a heartbeat

```css
h3 {
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}
```

### The "October Crow" Font

Nothing says "haunted" quite like the right typography. I found the **October Crow** font — jagged, hand-drawn, and delightfully creepy. It transforms ordinary buttons into ancient spell incantations.

```css
@font-face {
  font-family: "October Crow";
  src: url("/fonts/October Crow.ttf") format("truetype");
}

body {
  font-family: "October Crow", Arial, sans-serif;
}
```

### Buttons That Look Like Ancient Tablets

Flat rectangles? Too boring for a haunted app. I crafted custom SVG-shaped buttons that look like weathered stone tablets:

![Screenshot: Custom button styling](screenshots/buttons.png)
_Buttons fit for a witch's spellbook_

The secret? Inline SVG as a background image with the fill color encoded:

```css
background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 180"><path d="M974.6 145.6a177.7..." fill="%23460809"></path></svg>');
```

---

## 🏚️ Conjuring the 3D Scene

### Three.js: The Séance Begins

The heart of this haunted experience is **Three.js**. Setting up the scene felt like preparing a ritual:

```javascript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
```

The fog is crucial — it creates depth and that "something lurking in the distance" feeling.

### The Floating House

Every haunted app needs a haunted house. I loaded a GLB model and made it float with a gentle sinusoidal bob:

```javascript
loader.load("models/forest_house.glb", (gltf) => {
  house = gltf.scene;
  house.userData.centerY = -center.y - 2.5;
  scene.add(house);
});

// In the animation loop:
house.position.y = house.userData.centerY + Math.sin(time * 0.5) * 0.2;
```

![Screenshot: Floating house animation](screenshots/floating-house.png)
_It floats. It bobs. It judges your weather choices._

### Eerie Lighting

Three lights work together to create the atmosphere:

1. **Ambient Light** (purplish) — the base "moonlit" glow
2. **Directional Light** — soft moonlight from above
3. **Rim Light** — that subtle backlight that makes things look otherworldly

```javascript
const ambientLight = new THREE.AmbientLight(0x9999cc, 0.4);
const directionalLight = new THREE.DirectionalLight(0xaaaadd, 0.3);
const rimLight = new THREE.DirectionalLight(0x6666aa, 0.2);
```

---

## ⚡ When Lightning Strikes: The Thunder System

This was the most fun (and challenging) part. Real lightning isn't a straight line — it's jagged, branching, and terrifying.

### Creating Jagged Bolts

I generate lightning bolts as a series of points with random "jitter" applied:

```javascript
function createLightningBolt(startX, startY, startZ, endX, endY, endZ) {
  const points = [];
  const segments = 8 + Math.floor(Math.random() * 6);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let x = startX + (endX - startX) * t;
    let y = startY + (endY - startY) * t;

    // The magic: jagged randomness
    const jitter = Math.sin(t * Math.PI) * 1.5;
    if (i > 0 && i < segments) {
      x += (Math.random() - 0.5) * jitter;
    }

    points.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.Line(geometry, material);
}
```

### Branching Lightning

Real lightning branches! Based on intensity, I spawn additional bolts that fork off the main strike:

```javascript
const branchCount = Math.floor(1 + (intensity / 100) * 3);
for (let i = 0; i < branchCount; i++) {
  const branch = createLightningBolt(/* branch coordinates */);
  scene.add(branch);
}
```

### The Flash

When lightning strikes, the whole scene lights up momentarily:

```javascript
thunderLight.intensity = flashIntensity;
ambientFlashLight.intensity = 0.5 + (intensity / 100) * 1.5;

// Then fade it out
const fade = 1 - Math.pow(progress, 0.5);
thunderLight.intensity = flashIntensity * fade;
```

![Screenshot: Lightning strike](screenshots/lightning.png)
_CRACK! The sky splits open..._

---

## 🌧️ Weather Effects: A Particle Symphony

Each weather type has its own particle system:

| Weather      | Particles              | Special Effects    |
| ------------ | ---------------------- | ------------------ |
| Rain         | Falling droplets       | Dark clouds        |
| Snow         | Drifting flakes        | Horizontal sway    |
| Fog          | Floating wisps         | Reduced visibility |
| Wind         | Horizontal streaks     | Fast movement      |
| Thunderstorm | Heavy rain + lightning | The whole package  |

The intensity slider controls particle count, speed, and opacity:

```javascript
const rainCount = Math.floor(500 + (intensity / 100) * 1500);
rainMaterial.opacity = 0.4 + (intensity / 100) * 0.4;
```

---

## 🔊 Sounds of the Storm

What's a thunderstorm without the rumble? Each weather type has its own looping ambient audio:

```javascript
const weatherSounds = {
  rain: new Audio("sounds/rain.mp3"),
  thunderstorm: new Audio("sounds/thunderstorm.mp3"),
  windy: new Audio("sounds/windy.mp3"),
  snow: new Audio("sounds/snow.mp3"),
  fog: new Audio("sounds/fog.mp3"),
};
```

### The Autoplay Challenge

Browsers block autoplay until user interaction. My solution? Queue the sound and play it on first click:

```javascript
let userHasInteracted = false;
let pendingWeatherSound = null;

["click", "touchstart", "keydown"].forEach((event) => {
  document.addEventListener(event, () => {
    if (!userHasInteracted) {
      userHasInteracted = true;
      if (pendingWeatherSound) {
        playWeatherSound(
          pendingWeatherSound.type,
          pendingWeatherSound.intensity
        );
      }
    }
  });
});
```

---

## 🌍 Real Weather from Real Places

The app fetches actual weather data using the **Open-Meteo API**:

```javascript
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code...`;
const data = await fetch(url).then((r) => r.json());
```

Weather codes get mapped to our spooky effects:

```javascript
if ([95, 96, 99].includes(weatherCode)) condition = "Thunderstorm";
else if ([61, 63, 65].includes(weatherCode)) condition = "Rain";
else if ([71, 73, 75].includes(weatherCode)) condition = "Snow";
```

![Screenshot: Location search panel](screenshots/location-panel.png)
_Search for any city and watch the weather come alive_

---

## 🧭 Navigation: Finding Your Way in the Dark

### The Bottom Navigation Bar

A fixed bottom bar provides quick access:

- **🏠 Home**: Resets the camera to its original position
- **ℹ️ About**: Opens a modal with app info and credits

```javascript
document.getElementById("home-btn").addEventListener("click", () => {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialCameraTarget);
  controls.update();
});
```

### Collapsible Panels

Both control panels can be minimized to keep the view clean:

```javascript
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  panel.classList.toggle("minimized");
}
```

---

## 😱 Challenges & How I Survived Them

### 1. The NaN Lightning Bug

**Problem**: Sometimes lightning bolts would cause `Computed radius is NaN` errors.

**Solution**: Validate all coordinates before creating geometry:

```javascript
if (isNaN(startX) || isNaN(startY) || isNaN(endZ)) {
  return null;
}
```

### 2. Audio Race Conditions

**Problem**: Switching weather rapidly caused `play() interrupted by pause()` errors.

**Solution**: Track the current sound and only stop _other_ sounds:

```javascript
Object.values(weatherSounds).forEach((s) => {
  if (s !== sound) {
    s.pause();
    s.currentTime = 0;
  }
});
```

### 3. Manual Override vs API Weather

**Problem**: Searching a city would override manual weather selection.

**Solution**: A `manualOverride` flag that gets reset _before_ displaying new API weather:

```javascript
if (data) {
  manualOverride = false; // Reset BEFORE displaying
  displayWeatherInfo(data);
}
```

---

## 🎃 Try It If You Dare

The Eerie Weather App is live and waiting for you. Search for your city, crank up the thunderstorm intensity, and let the lightning illuminate your screen.

Whether you're a developer looking for Three.js inspiration or just someone who wants to check the weather in the most dramatic way possible — this app is for you.

**[🌩️ Launch the Eerie Weather App](#)**

_May your skies be stormy and your code be bug-free._

---

## 📸 Screenshots Gallery

![Screenshot: Thunderstorm effect](screenshots/thunderstorm.png)
_Full thunderstorm with lightning and heavy rain_

![Screenshot: Snow effect](screenshots/snow.png)
_Peaceful snowfall... or is it?_

![Screenshot: Fog effect](screenshots/fog.png)
_The fog rolls in, visibility drops..._

![Screenshot: About modal](screenshots/about-modal.png)
_Credits where credits are due_

---

## 🛠️ Tech Stack

- **Three.js** — 3D rendering
- **Vite** — Build tool
- **Open-Meteo API** — Weather data
- **Nominatim** — Geocoding
- **Pure HTML/CSS/JS** — No frameworks, just vibes

---

_Built with 🖤 and a healthy fear of thunderstorms_
