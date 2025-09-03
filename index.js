import { canvas, ctx } from "./canvas.js";
import { animatePlayer } from "./player.js";
import { animateTiles } from "./tiles.js";
import { initGlitches, applyGlitchIfNeeded } from "./glitch.js";
import {
  getCookie,
  setCookie,
  changeItemState,
  itemStates,
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
  document.body.innerHTML = "<h1>WATERFALL</h1>";
  if (backgroundMusic) {
    backgroundMusic.pause();
    localStorage.removeItem("musicCurrentTime");
  }
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
