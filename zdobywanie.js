import { getCookie, setCookie } from "./cookies.js";
import { reloadScript } from "./reload.js";
import { initGlitchesLight, applyGlitchIfNeeded } from "./glitch.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const vomitSound = new Audio("sounds/vomit.mp3");
const gulpSound = new Audio("sounds/gulp.mp3");
const successSound = new Audio("sounds/success_bell.mp3");
// Game variables
let hardmode = getCookie("fajki") == "true" ? 1 : 0;
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
// Slightly wider platforms
const width = 84 - hardmode * 6;
const height = 20;
let platforms = [];
let stopGame = false;
let score = 0;
let gameLoop;
// Gentler tilt
let tiltSensitivity = 0.45;
let cameraY = 0;
let gameFrozen = false;
let freezeTimer = 0;
let freezeStage = 0; // 0: not frozen, 1: szot1, 2: szot2
// iOS motion + fallback controls
let motionEnabled = false;
let isPressingLeft = false;
let isPressingRight = false;

// Movement variables
let maxSpeed = 12;
let acceleration = 0.6;
let deceleration = 0.85;
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
    img.src = `pietra${hardmode}/pietro_${i}.jpg`;
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
      Math.max(1, (canvas.height - newY) / canvas.height) / 2.2;
    let newWidth = width + Math.random() * 30;
    platforms.push({
      x: Math.random() * (canvas.width - newWidth),
      y: newY,
      width: newWidth,
      height,
      // Slightly slower platforms
      velocityX: 1.8 + 1.6 * hardmode + Math.random() * 4.5 * +speedMultiplier,
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
        Math.abs(player.velocityX) > 0.1
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
  // Overlay glitch if active
  applyGlitchIfNeeded(ctx, canvas);
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

  // Apply deceleration
  player.velocityX *= deceleration;

  // Fallback touch controls (if motion not enabled)
  if (!motionEnabled) {
    if (isPressingLeft) player.velocityX -= acceleration;
    if (isPressingRight) player.velocityX += acceleration;
    player.velocityX = Math.max(
      -maxSpeed,
      Math.min(maxSpeed, player.velocityX)
    );
  }

  // Update player position based on velocity
  player.x += player.velocityX;

  // Set player direction based on velocity
  if (player.velocityX > 0.1) {
    player.direction = 1;
  } else if (player.velocityX < -0.1) {
    player.direction = -1;
  }

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
    gulpSound.play();
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
    vomitSound.play();
    player.state = "rzyg1";
    player.velocityY = 0; // Stop the player
    player.y = cameraY + canvas.height - player.height; // Position the player at the bottom of the screen
    setTimeout(() => {
      cancelAnimationFrame(gameLoop);
      if (!stopGame) reloadScript("zdobywanie.js");
      stopGame = true;
    }, 1000); // Show rzyg1.png for 2 seconds before reloading
  }

  player.frame += Math.abs(player.velocityX) > 0.1 ? 5 : 1;
}

function handleDeviceMotion(event) {
  const tilt = event.accelerationIncludingGravity.x;
  player.velocityX -= tilt * tiltSensitivity;
  player.velocityX = Math.max(-maxSpeed, Math.min(maxSpeed, player.velocityX));
}

let stopped = false;

function gameLoopFunction() {
  if (score > 13) {
    if (!stopped) {
      setCookie(getCookie("fajki") == "true" ? "blant" : "fajki", true);
      stopped = true;
      successSound.play();
      setTimeout(() => {
        window.location.replace("index.html");
      }, 1000);
    }
  }
  update();
  draw();
}

function init() {
  setupCanvas();
  createPlatforms();
  score = -1;
  currentBackgroundIndex = 0;
  try {
    // Lighter and rarer on Zdobywanie
    initGlitchesLight({
      canvas,
      ctx,
      minIntervalMs: 1000,
      maxIntervalMs: 5000,
      effects: { stutter: true },
      audio: window.pageAudio,
    });
  } catch (_) {}
  // Start fixed-timestep loop at 60 FPS
  const FPS = 60;
  const STEP = 1000 / FPS;
  let last;
  let acc = 0;
  function frame(now) {
    if (last === undefined) last = now;
    acc += now - last;
    last = now;
    if (acc > 1000) acc = 1000;
    let safety = 0;
    while (acc >= STEP && safety++ < 5) {
      gameLoopFunction();
      acc -= STEP;
    }
    gameLoop = requestAnimationFrame(frame);
  }
  gameLoop = requestAnimationFrame(frame);

  // iOS motion permission / fallback
  setupMotionOrFallback();
}

loadPlayerImages();

window.addEventListener("resize", setupCanvas);
// Motion listeners are attached via setupMotionOrFallback

function setupMotionOrFallback() {
  // If motion events exist
  if (window.DeviceMotionEvent) {
    // iOS 13+: requestPermission needed
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      showMotionPrompt();
    } else {
      // Non-iOS or older: enable immediately
      window.addEventListener("devicemotion", handleDeviceMotion, true);
      motionEnabled = true;
    }
  } else {
    // No motion API: fallback controls
    addFallbackControls();
  }
}

function showMotionPrompt() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.color = "white";
  overlay.style.font = "bold 18px Arial";
  overlay.innerHTML = `
    <div style="text-align:center">
      <div>Włącz sterowanie ruchem, aby grać</div>
      <button id="enable-motion" style="margin-top:12px;padding:10px 16px;font-size:16px">Zezwól</button>
    </div>`;
  document.body.appendChild(overlay);
  const btn = overlay.querySelector("#enable-motion");
  const tryEnable = async () => {
    try {
      const res = await DeviceMotionEvent.requestPermission();
      if (res === "granted") {
        window.addEventListener("devicemotion", handleDeviceMotion, true);
        motionEnabled = true;
        overlay.remove();
      } else {
        overlay.remove();
        addFallbackControls();
      }
    } catch (e) {
      overlay.remove();
      addFallbackControls();
    }
  };
  btn.addEventListener("click", tryEnable, { once: true });
  btn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      tryEnable();
    },
    { once: true, passive: false }
  );
}

function addFallbackControls() {
  // Create simple left/right touch zones
  const left = document.createElement("div");
  const right = document.createElement("div");
  [left, right].forEach((el) => {
    el.style.position = "fixed";
    el.style.bottom = "0";
    el.style.width = "50vw";
    el.style.height = "22vh";
    el.style.zIndex = "9998";
    el.style.opacity = "0.0"; // Invisible zones
  });
  left.style.left = "0";
  right.style.right = "0";
  document.body.appendChild(left);
  document.body.appendChild(right);

  const onDownLeft = (e) => {
    e.preventDefault();
    isPressingLeft = true;
  };
  const onUpLeft = (e) => {
    e.preventDefault();
    isPressingLeft = false;
  };
  const onDownRight = (e) => {
    e.preventDefault();
    isPressingRight = true;
  };
  const onUpRight = (e) => {
    e.preventDefault();
    isPressingRight = false;
  };

  left.addEventListener("pointerdown", onDownLeft);
  left.addEventListener("pointerup", onUpLeft);
  left.addEventListener("pointercancel", onUpLeft);
  left.addEventListener("touchstart", onDownLeft, { passive: false });
  left.addEventListener("touchend", onUpLeft, { passive: false });
  left.addEventListener("touchcancel", onUpLeft, { passive: false });

  right.addEventListener("pointerdown", onDownRight);
  right.addEventListener("pointerup", onUpRight);
  right.addEventListener("pointercancel", onUpRight);
  right.addEventListener("touchstart", onDownRight, { passive: false });
  right.addEventListener("touchend", onUpRight, { passive: false });
  right.addEventListener("touchcancel", onUpRight, { passive: false });
}
