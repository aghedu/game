import { getCookie, setCookie } from "./cookies.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Game variables
let hardmode = getCookie("marlboro") == "true" ? 1 : 0;
let player = {
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  velocityX: 0,
  velocityY: 0,
  direction: 1, // 1 for right, -1 for left
  frame: 0,
  animationSpeed: 30,
  state: "normal", // Can be 'normal', 'szot1', 'szot2', 'rzyg1'
};
const width = 80 - hardmode * 10;
const height = 20;
let platforms = [];
let stopGame = false;
let score = 0;
let gameLoop;
let tiltSensitivity = 2;
let cameraY = 0;
let gameFrozen = false;
let freezeTimer = 0;
let freezeStage = 0; // 0: not frozen, 1: szot1, 2: szot2

// Movement variables
let maxSpeed = 12;
let acceleration = 0.6;
let deceleration = 0.85;
let isMoving = { left: false, right: false };
let jumpedPlatforms = new Set();

// Player images
let playerImages = {
  standing: [],
  walking: [],
  szot1: null,
  szot2: null,
  rzyg1: null,
};
let imagesLoaded = 0;
const totalImages = 7; // 2 standing + 2 walking + szot1 + szot2 + rzyg1

// Background images
let backgroundImages = [];
const maxBackgrounds = 15; // Load backgrounds for levels 0 to 14
let currentBackgroundIndex = 0;

// Grass image
let grassImage;

function loadBackgroundImages() {
  for (let i = 0; i <= maxBackgrounds; i++) {
    const img = new Image();
    img.src = `pietra/pietro_${i}.jpg`;
    backgroundImages.push(img);
  }
}

function loadPlayerImages() {
  ["standing1.png", "standing2.png"].forEach((file) => {
    const img = new Image();
    img.onload = onImageLoad;
    img.src = `lapanie/player/${file}`;
    playerImages.standing.push(img);
  });

  ["walking1.png", "walking2.png"].forEach((file) => {
    const img = new Image();
    img.onload = onImageLoad;
    img.src = `lapanie/player/${file}`;
    playerImages.walking.push(img);
  });

  playerImages.szot1 = new Image();
  playerImages.szot1.onload = onImageLoad;
  playerImages.szot1.src = "lapanie/player/szot1.png";

  playerImages.szot2 = new Image();
  playerImages.szot2.onload = onImageLoad;
  playerImages.szot2.src = "lapanie/player/szot2.png";

  playerImages.rzyg1 = new Image();
  playerImages.rzyg1.onload = onImageLoad;
  playerImages.rzyg1.src = "lapanie/player/rzyg1.png";
}

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    loadBackgroundImages();
    loadGrassImage();
  }
}

function loadGrassImage() {
  grassImage = new Image();
  grassImage.src = "grass_1.jpg";
  grassImage.onload = init;
}

function setupCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height;
  cameraY = player.height / 2;

  platforms.push({
    x: player.x - player.width / 3,
    y: canvas.height,
    width,
    height,
    velocityX: 0,
  });
}

function pushNewPlatform(newY) {
  if (platforms.length < 15) {
    let speedMultiplier =
      Math.max(1, (canvas.height - newY) / canvas.height) / 2;
    let newWidth = width + Math.random() * 30;
    platforms.push({
      x: Math.random() * (canvas.width - newWidth),
      y: newY,
      width: newWidth,
      height,
      velocityX: 2 + 2 * hardmode + Math.random() * 5 * +speedMultiplier,
    });
  }
}

function createPlatforms() {
  const platformCount = 15;
  for (let i = 1; i < platformCount; i++) {
    pushNewPlatform(
      canvas.height - i * (canvas.height / 5) + Math.random() * 10
    );
  }
}

function drawPlayer() {
  ctx.save();

  if (player.direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-player.x - player.width, 0);
  } else {
    ctx.translate(player.x, 0);
  }

  let currentImage;
  switch (player.state) {
    case "szot1":
      currentImage = playerImages.szot1;
      break;
    case "szot2":
      currentImage = playerImages.szot2;
      break;
    case "rzyg1":
      currentImage = playerImages.rzyg1;
      break;
    default:
      let currentImages =
        isMoving.left || isMoving.right
          ? playerImages.walking
          : playerImages.standing;
      let currentFrame =
        Math.floor(player.frame / player.animationSpeed) % currentImages.length;
      currentImage = currentImages[currentFrame];
  }

  ctx.drawImage(
    currentImage,
    0,
    player.y - cameraY,
    player.width,
    player.height
  );

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  const currentBackground = backgroundImages[currentBackgroundIndex];
  if (currentBackground) {
    ctx.drawImage(currentBackground, 0, 0, canvas.width, canvas.height);
  }

  platforms.forEach((platform) => {
    ctx.drawImage(
      grassImage,
      platform.x,
      platform.y - cameraY,
      platform.width,
      platform.height
    );
  });

  drawPlayer();
}

function update() {
  if (gameFrozen) {
    freezeTimer--;
    if (freezeTimer <= 0) {
      if (freezeStage === 1) {
        // Switch to szot2
        player.state = "szot2";
        freezeStage = 2;
        freezeTimer = 13; // Set timer for szot2 duration
      } else if (freezeStage === 2) {
        // End freeze, jump
        gameFrozen = false;
        freezeStage = 0;
        player.state = "normal";
        player.velocityY = -13; // Jump after szot2
        // Change background after animation
        currentBackgroundIndex = Math.min(
          currentBackgroundIndex + 1,
          maxBackgrounds
        );
      }
    }
    return;
  }

  player.velocityY += 0.5;
  player.y += player.velocityY;

  if (isMoving.left) {
    player.velocityX = Math.max(player.velocityX - acceleration, -maxSpeed);
    player.direction = -1;
  }
  if (isMoving.right) {
    player.velocityX = Math.min(player.velocityX + acceleration, maxSpeed);
    player.direction = 1;
  }

  if (!isMoving.left && !isMoving.right) {
    player.velocityX *= deceleration;
    if (Math.abs(player.velocityX) < 0.1) player.velocityX = 0;
  }

  player.x += player.velocityX;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;

  let shouldJump = false;
  let jumpedPlatform = null;
  platforms.forEach((platform) => {
    if (
      player.y + player.height > platform.y &&
      player.y + player.height < platform.y + platform.height &&
      player.x < platform.x + platform.width &&
      player.x + player.width > platform.x &&
      player.velocityY > 0
    ) {
      if (
        Math.abs(platform.y - (cameraY + height)) <
        canvas.height - player.height / 2
      ) {
        shouldJump = true;
        jumpedPlatform = platform;
      }
    }

    platform.x += platform.velocityX;

    if (platform.x <= 0 || platform.x + platform.width >= canvas.width) {
      platform.velocityX *= -1;
    }
  });

  if (shouldJump && !gameFrozen && !jumpedPlatforms.has(jumpedPlatform)) {
    gameFrozen = true;
    freezeTimer = 13; // ~200ms at 60fps
    freezeStage = 1;
    player.state = "szot1";
    jumpedPlatforms.add(jumpedPlatform);
    score++;
  } else if (shouldJump && !gameFrozen) {
    player.velocityY = -13; // Normal jump without animation
  }

  if (player.y < cameraY + canvas.height / 2) {
    cameraY = player.y - canvas.height / 2;
  }

  while (platforms.length < 15) {
    pushNewPlatform(platforms[platforms.length - 1].y - canvas.height / 5);
  }

  if (player.y > cameraY + canvas.height && !gameFrozen) {
    gameFrozen = true;
    player.state = "rzyg1";
    player.velocityY = 0; // Stop the player
    player.y = cameraY + canvas.height - player.height; // Position the player at the bottom of the screen
    setTimeout(() => {
      cancelAnimationFrame(gameLoop);
      if (!stopGame) location.reload();
      stopGame = true;
    }, 200); // Show rzyg1.png for 2 seconds before reloading
  }

  player.frame += isMoving.left || isMoving.right ? 5 : 1;
}

function handleDeviceMotion(event) {
  const tilt = event.accelerationIncludingGravity.x;
  player.velocityX -= tilt * tiltSensitivity;
}
let stopped = false;

function gameLoopFunction() {
  if (score > 13) {
    if (!stopped)
      setCookie(getCookie("marlboro") == "true" ? "joint" : "marlboro", true);
    stopped = true;
    setTimeout(() => {
      location.href = "index.html";
    }, 75);
  }
  update();
  draw();
  gameLoop = requestAnimationFrame(gameLoopFunction);
}

function init() {
  setupCanvas();
  createPlatforms();
  score = -1;
  currentBackgroundIndex = 0;
  gameLoop = requestAnimationFrame(gameLoopFunction);
}

loadPlayerImages();

window.addEventListener("resize", setupCanvas);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") isMoving.left = true;
  else if (e.key === "ArrowRight") isMoving.right = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") isMoving.left = false;
  else if (e.key === "ArrowRight") isMoving.right = false;
});

document
  .getElementById("arrow-left")
  .addEventListener("mousedown", () => (isMoving.left = true));
document
  .getElementById("arrow-right")
  .addEventListener("mousedown", () => (isMoving.right = true));
document
  .getElementById("arrow-left")
  .addEventListener("mouseup", () => (isMoving.left = false));
document
  .getElementById("arrow-right")
  .addEventListener("mouseup", () => (isMoving.right = false));

document.getElementById("arrow-left").addEventListener("touchstart", (e) => {
  e.preventDefault();
  isMoving.left = true;
});
document.getElementById("arrow-right").addEventListener("touchstart", (e) => {
  e.preventDefault();
  isMoving.right = true;
});

document
  .getElementById("arrow-left")
  .addEventListener("touchend", () => (isMoving.left = false));
document
  .getElementById("arrow-right")
  .addEventListener("touchend", () => (isMoving.right = false));

document.addEventListener("mouseup", () => {
  isMoving.left = false;
  isMoving.right = false;
});

document.addEventListener("touchend", () => {
  isMoving.left = false;
  isMoving.right = false;
});

canvas.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  if (touch.clientX < canvas.width / 2) {
    isMoving.left = true;
  } else {
    isMoving.right = true;
  }
});

canvas.addEventListener("touchend", () => {
  isMoving.left = false;
  isMoving.right = false;
});

if (window.DeviceMotionEvent) {
  window.addEventListener("devicemotion", handleDeviceMotion, true);
}
