import { getCookie, setCookie } from "./cookies.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const container = document.getElementById("canvas-container");
let hardmode = getCookie("vifon") == "true" ? 1 : 0;
let playerX = 0;
let playerY = 0;
let playerWidth = 50;
let playerHeight = 50;
let fruits = [];
let score = -3 * hardmode;
let stop = false;

// Variables for smooth movement
const goodFruitImages = [];
const badFruitImages = [];
let background;
let playerImg;
let velocityX = 0;
let maxSpeed = 15;
let acceleration = 0.9;
let deceleration = 0.9;
let isMoving = { left: false, right: false };
let imagesLoaded = 0;
let playerFrame = 0;
let playerAnimationSpeed = 30;
let playerDirection = 1; // 1 for right, -1 for left

const totalImages = goodFruitImages.length + badFruitImages.length;
let playerImages = {
  standing: [],
  walking: [],
};

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    animate();
  }
}

function loadImages() {
  const goodFruitFiles = ["trzy_zero.png"];
  const badFruitFiles = ["dwa_zero.png"];
  background = new Image();
  background.onload = onImageLoad;
  background.src = "lapanie/informatyka.jpg";
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
  goodFruitFiles.forEach((file) => {
    const img = new Image();
    img.onload = onImageLoad;
    img.src = `lapanie/do_zlapania/${file}`;
    goodFruitImages.push(img);
  });

  badFruitFiles.forEach((file) => {
    const img = new Image();
    img.onload = onImageLoad;
    img.src = `lapanie/do_omijania/${file}`;
    badFruitImages.push(img);
  });
}

loadImages();
const img = new Image();
img.src = "a.png";

// Variables for limiting red fruits
const maxRedFruits = 8;
let redFruitCount = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = "#a0cd3e";
  ctx.webkitImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
  playerY = canvas.height - playerHeight * 2.75;
  playerX = canvas.width / 2 - playerWidth / 2;
}

let defaultWidth = 50;
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function createFruit() {
  const isBad = Math.random() < 0.85 && redFruitCount < maxRedFruits;
  if (isBad) redFruitCount++;

  const imageArray = isBad ? badFruitImages : goodFruitImages;
  const randomImage = imageArray[Math.floor(Math.random() * imageArray.length)];

  let width = defaultWidth;
  let height = (randomImage.height / randomImage.width) * defaultWidth;

  return {
    x: Math.random() * (canvas.width - width),
    y: -100,
    width: width,
    height: height,
    speed: Math.random() * 9 + (3 + hardmode * 2),
    isBad: isBad,
    image: randomImage,
  };
}

function drawPlayer() {
  ctx.save();

  if (playerDirection === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-playerX - playerWidth, 0);
  } else {
    ctx.translate(playerX, 0);
  }

  let currentImages =
    isMoving.left || isMoving.right
      ? playerImages.walking
      : playerImages.standing;
  let currentFrame =
    Math.floor(playerFrame / playerAnimationSpeed) % currentImages.length;

  ctx.drawImage(
    currentImages[currentFrame],
    0,
    playerY,
    playerWidth,
    playerHeight
  );

  ctx.restore();
}

function drawFruits() {
  ctx.save();
  ctx.webkitImageSmoothingEnabled = true;
  ctx.imageSmoothingEnabled = true;

  fruits.forEach((fruit) => {
    ctx.drawImage(fruit.image, fruit.x, fruit.y, fruit.width, fruit.height);
  });

  ctx.restore();
}

function moveFruits() {
  if (stop) return;
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

  if (Math.random() < 0.035) {
    fruits.push(createFruit());
  }
}

function updatePlayerPosition() {
  if (stop) return;

  if (isMoving.left) {
    velocityX = Math.max(velocityX - acceleration, -maxSpeed);
    playerDirection = -1;
  }
  if (isMoving.right) {
    velocityX = Math.min(velocityX + acceleration, maxSpeed);
    playerDirection = 1;
  }

  if (!isMoving.left && !isMoving.right) {
    velocityX *= deceleration;
    if (Math.abs(velocityX) < 0.1) velocityX = 0;
  }

  playerX += velocityX;
  playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX));
  playerFrame += isMoving.left || isMoving.right ? 5 : 1;
}

function checkCollisions() {
  fruits.forEach((fruit, index) => {
    if (
      playerX < fruit.x + fruit.width &&
      playerX + playerWidth > fruit.x &&
      playerY < fruit.y + fruit.height &&
      playerY + playerHeight > fruit.y
    ) {
      if (fruit.isBad) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (!stop) {
          window.setTimeout(() => {
            location.reload();
          }, 1000);
        }
        stop = true;
      } else {
        score++;
        fruits.splice(index, 1);
      }
    }
  });
}

function animate(timestamp) {
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  if (score > 5) {
    setCookie(getCookie("vifon") == "true" ? "kebab" : "vifon", true);
    location.href = "index.html";
    return;
  }
  updatePlayerPosition();
  drawPlayer();
  drawFruits();
  moveFruits();
  checkCollisions();
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.strokeText(`Ilość ECTS: ${score * 5} 🤓`, 10, 30);
  ctx.fillText(`Ilość ECTS: ${score * 5} 🤓`, 10, 30);

  requestAnimationFrame(animate);
}

function handleTouchStart(direction, event) {
  event.preventDefault();
  isMoving[direction] = true;
}

function handleTouchEnd(direction, event) {
  event.preventDefault();
  isMoving[direction] = false;
}

function handleMouseDown(direction) {
  isMoving[direction] = true;
}

function handleMouseUp(direction) {
  isMoving[direction] = false;
}
function resetMoving() {
  isMoving.left = false;
  isMoving.right = false;
}
// For touch devices
document.getElementById("arrow-left").addEventListener("touchstart", (e) => {
  e.preventDefault();
  resetMoving();
  isMoving.left = true;
});
document.getElementById("arrow-right").addEventListener("touchstart", (e) => {
  e.preventDefault();
  resetMoving();
  isMoving.right = true;
});

document
  .getElementById("arrow-left")
  .addEventListener("touchend", () => (isMoving.left = false));
document
  .getElementById("arrow-right")
  .addEventListener("touchend", () => (isMoving.right = false));

document.addEventListener("touchend", () => {
  resetMoving();
});
animate();

export { canvas, ctx, animate };
