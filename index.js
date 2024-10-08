import { canvas, ctx } from "./canvas.js";
import { animatePlayer } from "./player.js";
import { animateTiles } from "./tiles.js";
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
  const imageNames = [
    "ruskacz",
    "vodka",
    "vifon",
    "kebab",
    "marlboro",
    "joint",
  ];

  imageNames.forEach((name) => {
    const blankImg = new Image();
    blankImg.src = `./items/blank/${name}_blank.png`;
    itemImages.push({ name, blank: blankImg, normal: null });

    const normalImg = new Image();
    normalImg.src = `./items/normal/${name}.png`;
    normalImg.onload = () => {
      const item = itemImages.find((item) => item.name === name);
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
    const img = getCookie(item.name) == "true" ? item.normal : item.blank;
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
  requestAnimationFrame(animate);
}

function checkAllCookiesTrue() {
  const cookieNames = [
    "ruskacz",
    "vodka",
    "vifon",
    "kebab",
    "marlboro",
    "joint",
  ];
  return cookieNames.every((name) => getCookie(name) === "true");
}

function endGame() {
  canvas.style.display = "none";
  console.clear();
  document.body.innerHTML = "<h1>ZNAJDŹ ŹRÓDŁO</h1>";
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
  animate();

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
