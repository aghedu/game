import { getCookie, setCookie } from "./cookies.js";
import { reloadScript } from "./reload.js";
import { initGlitchesLight, applyGlitchIfNeeded } from "./glitch.js";

function resetGame() {
  // To be safe, ensure the old loop is dead before reloading.
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  reloadScript("lapanie.js");
}
const wrongSound = new Audio("sounds/kurwa.mp3");
const correctSound = new Audio("sounds/correct.mp3");
correctSound.volume = 0.35;
const successSound = new Audio("sounds/success_bell.mp3");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- Game State and Loop Variables ---
let hardmode = getCookie("vifon") == "true" ? 1 : 0;
let score = -3 * hardmode;
let stop = false;
let rafId = null;
let gameOverTime = null; // ** NEW: Timestamp for when the game ends **

const FPS = 60;
const STEP = 1000 / FPS;
let last = performance.now();
let acc = 0;

// --- Player and Object State ---
let playerX = 0,
  playerY = 0,
  playerWidth = 50,
  playerHeight = 50;
let fruits = [];
const goodFruitImages = [],
  badFruitImages = [];
let background;
let velocityX = 0,
  maxSpeed = 15,
  acceleration = 0.9,
  deceleration = 0.9;
let isMoving = { left: false, right: false };
let imagesLoaded = 0,
  totalImages = 0;
let playerFrame = 0,
  playerAnimationSpeed = 30,
  playerDirection = 1;
let playerImages = { standing: [], walking: [] };
const gameOverImg = new Image();
gameOverImg.src = "a.png";
const maxRedFruits = 8;
let redFruitCount = 0;
let defaultWidth = 50;

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    rafId = requestAnimationFrame(mainLoop);
  }
}

function loadImages() {
  const goodFruitFiles = ["trzy_zero.png"];
  const badFruitFiles = ["dwa_zero.png"];
  const playerStandingFiles = ["standing1.png", "standing2.png"];
  const playerWalkingFiles = ["walking1.png", "walking2.png"];
  totalImages =
    goodFruitFiles.length +
    badFruitFiles.length +
    playerStandingFiles.length +
    playerWalkingFiles.length +
    1;
  background = new Image();
  background.onload = onImageLoad;
  background.src = "lapanie/informatyka.jpg";
  [
    ...playerStandingFiles,
    ...playerWalkingFiles,
    ...goodFruitFiles,
    ...badFruitFiles,
  ].forEach((file) => {
    const img = new Image();
    img.onload = onImageLoad;
    if (playerStandingFiles.includes(file)) {
      img.src = `lapanie/player/${file}`;
      playerImages.standing.push(img);
    } else if (playerWalkingFiles.includes(file)) {
      img.src = `lapanie/player/${file}`;
      playerImages.walking.push(img);
    } else if (goodFruitFiles.includes(file)) {
      img.src = `lapanie/do_zlapania/${file}`;
      goodFruitImages.push(img);
    } else {
      img.src = `lapanie/do_omijania/${file}`;
      badFruitImages.push(img);
    }
  });
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
  playerY = canvas.height - playerHeight * 2.75;
  playerX = canvas.width / 2 - playerWidth / 2;
}
window.addEventListener("resize", resizeCanvas);

function createFruit() {
  const isBad = Math.random() < 0.75 && redFruitCount < maxRedFruits;
  if (isBad) redFruitCount++;
  const imageArray = isBad ? badFruitImages : goodFruitImages;
  const randomImage = imageArray[Math.floor(Math.random() * imageArray.length)];
  let width = defaultWidth;
  let height = (randomImage.height / randomImage.width) * defaultWidth;
  return {
    x: Math.random() * (canvas.width - width),
    y: -100,
    width,
    height,
    speed: Math.random() * (9 + hardmode) + (4 + hardmode / 2),
    isBad,
    image: randomImage,
  };
}

function updatePlayerPosition() {
  if (isMoving.left) velocityX = Math.max(velocityX - acceleration, -maxSpeed);
  if (isMoving.right) velocityX = Math.min(velocityX + acceleration, maxSpeed);
  playerDirection = isMoving.left ? -1 : isMoving.right ? 1 : playerDirection;
  if (!isMoving.left && !isMoving.right) {
    velocityX *= deceleration;
    if (Math.abs(velocityX) < 0.1) velocityX = 0;
  }
  playerX += velocityX;
  playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));
  playerFrame += isMoving.left || isMoving.right ? 5 : 1;
}

function moveFruits() {
  fruits.forEach((fruit) => {
    fruit.y += fruit.speed;
  });
  fruits = fruits.filter((fruit) => {
    if (fruit.y >= canvas.height) {
      if (fruit.isBad) redFruitCount--;
      return false;
    }
    return true;
  });
  if (Math.random() < 0.0325) fruits.push(createFruit());
}

function checkCollisions() {
  for (let i = fruits.length - 1; i >= 0; i--) {
    const fruit = fruits[i];
    if (
      playerX < fruit.x + fruit.width &&
      playerX + playerWidth > fruit.x &&
      playerY < fruit.y + fruit.height &&
      playerY + playerHeight > fruit.y
    ) {
      if (fruit.isBad) {
        if (!stop) {
          stop = true;
          wrongSound.play();
          gameOverTime = performance.now(); // ** NEW: Set the death timestamp **
        }
      } else {
        correctSound.play();
        score++;
        fruits.splice(i, 1);
        if (score > 4) {
          stop = true;
          fruits = [];
          setCookie(getCookie("vifon") == "true" ? "kebab" : "vifon", true);
          successSound.play();
          // We can use setTimeout here because navigation doesn't conflict with the loop
          window.setTimeout(() => {
            window.location.replace("index.html");
          }, 1000);
        }
      }
    }
  }
}

function update() {
  updatePlayerPosition();
  moveFruits();
  checkCollisions();
}

function draw() {
  if (stop) {
    ctx.drawImage(gameOverImg, 0, 0, canvas.width, canvas.height);
    return;
  }
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.webkitImageSmoothingEnabled = true;
  ctx.imageSmoothingEnabled = true;
  fruits.forEach((fruit) =>
    ctx.drawImage(fruit.image, fruit.x, fruit.y, fruit.width, fruit.height)
  );
  ctx.restore();
  ctx.save();
  if (playerDirection === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-playerX - playerWidth, 0);
  } else {
    ctx.translate(playerX, 0);
  }
  const currentImages =
    isMoving.left || isMoving.right
      ? playerImages.walking
      : playerImages.standing;
  const currentFrame =
    Math.floor(playerFrame / playerAnimationSpeed) % currentImages.length;
  ctx.drawImage(
    currentImages[currentFrame],
    0,
    playerY,
    playerWidth,
    playerHeight
  );
  ctx.restore();
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.strokeText(`Ilość ECTS: ${score * 5} 🤓`, 10, 30);
  ctx.fillText(`Ilość ECTS: ${score * 5} 🤓`, 10, 30);
  // Apply a gentle visual-only glitch overlay after rendering
  try {
    applyGlitchIfNeeded(ctx, canvas);
  } catch (_) {}
}

function mainLoop(now) {
  if (stop && gameOverTime) {
    // ** NEW: Game Over logic is now inside the loop **
    if (now - gameOverTime > 1000) {
      resetGame(); // Timer elapsed, reset the game.
      return; // Stop this final frame.
    }
  }

  acc += now - last;
  last = now;
  while (acc >= STEP) {
    if (!stop) {
      // Only update logic if the game is running
      update();
    }
    acc -= STEP;
  }
  draw();
  rafId = requestAnimationFrame(mainLoop);
}

// --- Event Listeners ---
document
  .getElementById("arrow-left")
  .addEventListener("pointerdown", () => (isMoving.left = true));
document
  .getElementById("arrow-right")
  .addEventListener("pointerdown", () => (isMoving.right = true));
document
  .getElementById("arrow-left")
  .addEventListener("pointerup", () => (isMoving.left = false));
document
  .getElementById("arrow-right")
  .addEventListener("pointerup", () => (isMoving.right = false));
document.getElementById("arrow-left").addEventListener("touchend", (e) => {
  e.preventDefault();
  isMoving.left = false;
});
document.getElementById("arrow-right").addEventListener("touchend", (e) => {
  e.preventDefault();
  isMoving.right = false;
});

// --- Initialize ---
resizeCanvas();
loadImages();
// Gentle, rare glitches (visual-only) on Łapanie; avoid audio stutter
try {
  initGlitchesLight({
    canvas,
    ctx,
    minIntervalMs: 1000,
    maxIntervalMs: 4000,
    effects: {
      blockCopy: true,
      tear: false,
      chroma: false,
      crt: false,
      stutter: false,
    },
  });
} catch (_) {}

export { canvas, ctx };
