import { canvas, ctx } from "./canvas.js";
import { animatePlayer } from "./player.js";
import { animateTiles } from "./tiles.js";
import { initGlitches, applyGlitchIfNeeded } from "./glitch.js";
import {
  getCookie,
  setCookie,
  changeItemState,
  itemStates,
  deleteCookie,
} from "./cookies.js";

let itemImages = [];
let backgroundMusic;
let hasInteracted = false;
const successSound = new Audio("sounds/success.mp3");

function loadImages() {
  // Map new cookie keys to existing image filenames
  const items = [
    { cookie: "piwo", imageName: "ruskacz" },
    { cookie: "gorzala", imageName: "vodka" },
    { cookie: "zupka", imageName: "vifon" },
    { cookie: "kebs", imageName: "kebab" },
    { cookie: "fajki", imageName: "marlboro" },
    { cookie: "blant", imageName: "joint" },
  ];

  items.forEach(({ cookie, imageName }) => {
    const blankImg = new Image();
    blankImg.src = `./items/blank/${imageName}_blank.png`;
    itemImages.push({ cookie, imageName, blank: blankImg, normal: null });

    const normalImg = new Image();
    normalImg.src = `./items/normal/${imageName}.png`;
    normalImg.onload = () => {
      const item = itemImages.find((i) => i.imageName === imageName);
      if (item) {
        item.normal = normalImg;
      }
    };
  });
}

function renderItems() {
  let x = 10; // Starting x position
  const y = 5; // y position (top)
  const spacing = 5; // Spacing between images

  itemImages.forEach((item) => {
    const img = getCookie(item.cookie) == "true" ? item.normal : item.blank;
    if (img) {
      ctx.drawImage(img, x, y, img.width, img.height);
      x += 32 + img.width / 2;
    }
  });
}

function animate() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  animateTiles();
  animatePlayer();
  renderItems();
  // Overlay glitch if active
  applyGlitchIfNeeded(ctx, canvas);
}

function checkAllCookiesTrue() {
  const cookieNames = ["piwo", "gorzala", "zupka", "kebs", "fajki", "blant"];
  return cookieNames.every((name) => getCookie(name) === "true");
}

function endGame() {
  canvas.style.display = "none";
  console.clear();
  // Calculate elapsed time since the run started
  const startCookie = getCookie("runStartTimeMs");
  const startMs = startCookie ? parseInt(startCookie, 10) : Date.now();
  const elapsedMs = Math.max(
    0,
    Date.now() - (isNaN(startMs) ? Date.now() : startMs)
  );
  // Persist last run time for reference
  try {
    setCookie("lastRunTimeMs", String(elapsedMs));
  } catch (_) {}

  const pretty = formatDuration(elapsedMs);
  const comment = commentForTime(elapsedMs);
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <h1 style="font-size:2rem;">KOD TO: WATERFALL</h1>
      <h2 style="font-size:1.5rem;">Twój czas to: ${pretty}</h2>
      <div style="white-space:pre-line;font-size:1.1rem;max-width:800px">${comment}</div>
      <button id="reset-run" style="margin-top:8px;padding:10px 16px;font-size:1rem;border-radius:8px;border:none;background:#0d6efd;color:#fff;cursor:pointer;">Zresetuj</button>
    </div>
  `;
  if (backgroundMusic) {
    backgroundMusic.pause();
    localStorage.removeItem("musicCurrentTime");
  }
  // Wire reset button to clear cookies and reload to start
  const btn = document.getElementById("reset-run");
  if (btn) {
    btn.addEventListener("click", () => {
      try {
        resetAllGameCookies();
      } catch (_) {}
      // Also clear the saved music position
      localStorage.removeItem("musicCurrentTime");
      // Reload to the main index
      window.location.replace("https://aghedu.github.io/game/");
    });
  }
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  return `${m}m ${pad(s)}s`;
}

// Return the comment text matching the elapsed time ranges
function commentForTime(ms) {
  const min = ms / 60000;
  if (min < 3) return "NIE MOŻ LI WE!\nPOKAŻ TO ADIEMU TO CI NIE UWIERZY";
  if (min < 4) return "NIESAMOWITY WYNIK";
  if (min < 5) return "BARDZO SZYBKOOO";
  if (min < 7) return "CAŁKIEM SZYBKO";
  if (min < 10) return "OKEJ WYNIK";
  if (min < 15) return "SPROBOJ JESZCZE RAZ, MOZE DASZ RADE SZYBCIEJ :)";
  if (min < 30) return "CO TU TAK WOLNO";
  return "EJ KURWA CO TU TAK WOLNO";
}

// Clear all game-related cookies (items, flags, timers)
function resetAllGameCookies() {
  const keys = [
    // Canonical item keys
    "piwo",
    "gorzala",
    "zupka",
    "kebs",
    "fajki",
    "blant",
    // Legacy keys (for safety)
    "ruskacz",
    "vodka",
    "vifon",
    "kebab",
    "marlboro",
    "joint",
    // Timer/flags
    "runStartTimeMs",
    "lastRunTimeMs",
    "cookiesRenamedV2",
  ];
  keys.forEach((k) => deleteCookie(k));
}

function initAudio() {
  backgroundMusic = document.getElementById("background-music");
  backgroundMusic.volume = 0.5; // Set volume to 50%

  // Set up event listener to update localStorage with current time
  backgroundMusic.addEventListener("timeupdate", () => {
    localStorage.setItem(
      "musicCurrentTime",
      backgroundMusic.currentTime.toString()
    );
  });

  // Check if we have a stored current time
  const storedTime = localStorage.getItem("musicCurrentTime");
  if (storedTime) {
    backgroundMusic.currentTime = parseFloat(storedTime);
  }
}

function startAudio() {
  if (backgroundMusic && !hasInteracted) {
    backgroundMusic
      .play()
      .then(() => {
        console.log("Audio started");
        hasInteracted = true;
      })
      .catch((error) => {
        console.log("Audio play failed:", error);
        // Retry after a short delay
        setTimeout(startAudio, 1000);
      });
  }
}

function startGame() {
  loadImages();
  initAudio();
  // Initialize run start time cookie once per run
  try {
    if (!getCookie("runStartTimeMs")) {
      setCookie("runStartTimeMs", String(Date.now()));
    }
  } catch (_) {}
  // Initialize occasional glitch effects that do not disrupt gameplay
  try {
    const audio = document.getElementById("background-music");
    initGlitches({
      canvas,
      ctx,
      audio,
      minIntervalMs: 500,
      maxIntervalMs: 5000,
    });
  } catch (_) {}
  // Start fixed-timestep loop at 60 FPS for consistent behavior
  const FPS = 60;
  const STEP = 1000 / FPS;
  let last = undefined;
  let acc = 0;
  let rafId;

  function frame(now) {
    if (last === undefined) last = now;
    acc += now - last;
    last = now;

    // Cap accumulator to avoid spiral of death on tab restores
    if (acc > 1000) acc = 1000;

    let safety = 0;
    while (acc >= STEP && safety++ < 5) {
      animate();
      acc -= STEP;
    }
    rafId = requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // Check for all cookies being true every second
  const checkInterval = setInterval(() => {
    if (checkAllCookiesTrue()) {
      clearInterval(checkInterval);
      setTimeout(endGame, 1000);
    }
  }, 1000);

  // Try to resume audio
  startAudio();
}

// Add event listeners for various user interactions
const interactionEvents = [
  "click",
  "touchstart",
  "keydown",
  "mousedown",
  "pointerdown",
];

interactionEvents.forEach((eventType) => {
  document.addEventListener(eventType, startAudio, { once: true });
});

// Add a visibility change listener to handle tab switching
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && hasInteracted) {
    startAudio();
  }
});

startGame();

export { animate, changeItemState, getCookie };
