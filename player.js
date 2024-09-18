import { ctx, canvas, updateCamera, draw } from "./canvas.js";
import { tilesPos } from "./tiles.js";

const playerSpriteSheet = new Image();

playerSpriteSheet.src = "spritesheet.png";
let playerStart = false;
let spriteWidth;
let spriteHeight;
playerSpriteSheet.onload = () => {
  playerStart = true;
  spriteWidth = playerSpriteSheet.width / cols;
  spriteHeight = playerSpriteSheet.height / rows;
};
const cols = 4;
const rows = 4;

const totalFrames = 4;
const SCALE_FACTOR = 4;
const TILE_SIZE = 16;
const PLAYER_SIZE = TILE_SIZE * SCALE_FACTOR;

let currentFrame = 0;
let srcX = 0;
let srcY = 0;
let framesDawn = 0;
let playerX = TILE_SIZE * 16 - 8;
let playerY = TILE_SIZE * 16 - 16;
let velocityX = 0;
let velocityY = 0;
let maxSpeed = 0.5;
let acceleration = 0.25;
let deceleration = 0.4;
let isMoving = { left: false, right: false, up: false, down: false };
let stop = false;

function checkCollisions() {
  if (!tilesPos) return;

  const centerX = Math.floor(canvas.width / (2 * SCALE_FACTOR));
  const centerY = Math.floor(canvas.height / (2 * SCALE_FACTOR));

  const offsetX = centerX - playerX;
  const offsetY = centerY - playerY;

  const startCol = Math.floor(playerX / TILE_SIZE - centerX / TILE_SIZE);
  const endCol = Math.ceil(playerX / TILE_SIZE + centerX / TILE_SIZE);
  const startRow = Math.floor(playerY / TILE_SIZE - centerY / TILE_SIZE);
  const endRow = Math.ceil(playerY / TILE_SIZE + centerY / TILE_SIZE);

  const playerHitboxSize = PLAYER_SIZE - 24;
  const playerLeft = canvas.width / 2 - playerHitboxSize / 2;
  const playerTop = canvas.height / 2 - playerHitboxSize / 2 + 16;
  const playerRight = playerLeft + playerHitboxSize;
  const playerBottom = playerTop + playerHitboxSize + 16;

  let collisions = [];
  for (let i = startCol; i <= endCol; i++) {
    for (let j = startRow; j <= endRow; j++) {
      const tileX = (i + tilesPos[0].length) % tilesPos[0].length;
      const tileY = (j + tilesPos.length) % tilesPos.length;
      const drawX = (i * TILE_SIZE + offsetX) * SCALE_FACTOR;
      const drawY = (j * TILE_SIZE + offsetY) * SCALE_FACTOR;

      const tile = tilesPos[tileY][tileX];
      if (tile && (tile.type === 1 || tile.type == 2)) {
        const tileRight = drawX + TILE_SIZE * SCALE_FACTOR;
        const tileBottom = drawY + TILE_SIZE * SCALE_FACTOR;

        if (
          playerLeft < tileRight &&
          playerRight > drawX &&
          playerTop < tileBottom &&
          playerBottom > drawY
        ) {
          const overlapLeft = tileRight - playerLeft;
          const overlapRight = playerRight - drawX;
          const overlapTop = tileBottom - playerTop;
          const overlapBottom = playerBottom - drawY;

          const minHorizontalOverlap = Math.min(overlapLeft, overlapRight);
          const minVerticalOverlap = Math.min(overlapTop, overlapBottom);

          if (minHorizontalOverlap < minVerticalOverlap) {
            if (overlapLeft < overlapRight) {
              collisions.push({ direction: "right", overlap: overlapLeft });
            } else {
              collisions.push({ direction: "left", overlap: overlapRight });
            }
          } else {
            if (overlapTop < overlapBottom) {
              collisions.push({ direction: "bottom", overlap: overlapTop });
            } else {
              collisions.push({ direction: "top", overlap: overlapBottom });
            }
          }

          if (tile.type == 2 && !stop) {
            stop = true;

            if (playerX < 200) location.href = "./flanki.html";
            else if (playerY > 200 && playerX > 200)
              location.href = "./zdobywanie.html";
            else location.href = "./lapanie.html";
          }
        }
      }
    }
  }

  // Sort collisions by overlap amount
  collisions.sort((a, b) => b.overlap - a.overlap);

  // Handle collisions
  for (const collision of collisions) {
    switch (collision.direction) {
      case "right":
        playerX -= collision.overlap / SCALE_FACTOR;
        break;
      case "left":
        playerX += collision.overlap / SCALE_FACTOR;
        break;
      case "bottom":
        playerY -= collision.overlap / SCALE_FACTOR;
        break;
      case "top":
        playerY += collision.overlap / SCALE_FACTOR;
        break;
    }
  }

  return collisions.length > 0 ? collisions[0].direction : null;
}
function updatePlayerPosition() {
  if (stop) return;
  // Apply acceleration
  if (isMoving.left) velocityX = Math.max(velocityX - acceleration, -maxSpeed);
  if (isMoving.right) velocityX = Math.min(velocityX + acceleration, maxSpeed);
  if (isMoving.up) velocityY = Math.max(velocityY - acceleration, -maxSpeed);
  if (isMoving.down) velocityY = Math.min(velocityY + acceleration, maxSpeed);

  // Apply deceleration
  if (!isMoving.left && !isMoving.right) {
    velocityX *= deceleration;
    if (Math.abs(velocityX) < 0.1) velocityX = 0;
  }
  if (!isMoving.up && !isMoving.down) {
    velocityY *= deceleration;
    if (Math.abs(velocityY) < 0.1) velocityY = 0;
  }
  // Store old position
  let oldX = playerX;
  let oldY = playerY;

  // Update position
  playerX += velocityX;
  playerY += velocityY;
  const collision = checkCollisions();
  if (collision) {
    switch (collision) {
      case "left":
        playerX = oldX;
        velocityX = 0;
        break;
      case "right":
        playerX = oldX;
        velocityX = 0;
        break;
      case "top":
        playerY = oldY;
        velocityY = 0;
        break;
      case "bottom":
        playerY = oldY;
        velocityY = 0;
        break;
    }
  }

  // Update sprite direction
  if (Math.abs(velocityX) > Math.abs(velocityY)) {
    if (velocityX < 0) srcY = spriteHeight;
    else if (velocityX > 0) srcY = 2 * spriteHeight;
  } else if (Math.abs(velocityY) > 0) {
    if (velocityY < 0) srcY = 3 * spriteHeight;
    else srcY = 0;
  }

  // Determine if moving for animation purposes
  isMoving.any = Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1;

  // Update camera position
  updateCamera(playerX, playerY);
}
document
  .getElementById("arrow-left")
  .addEventListener("mousedown", () => (isMoving.left = true));
document
  .getElementById("arrow-right")
  .addEventListener("mousedown", () => (isMoving.right = true));
document
  .getElementById("arrow-up")
  .addEventListener("mousedown", () => (isMoving.up = true));
document
  .getElementById("arrow-down")
  .addEventListener("mousedown", () => (isMoving.down = true));

document
  .getElementById("arrow-left")
  .addEventListener("mouseup", () => (isMoving.left = false));
document
  .getElementById("arrow-right")
  .addEventListener("mouseup", () => (isMoving.right = false));
document
  .getElementById("arrow-up")
  .addEventListener("mouseup", () => (isMoving.up = false));
document
  .getElementById("arrow-down")
  .addEventListener("mouseup", () => (isMoving.down = false));
document.addEventListener("keydown", (e) => {
  resetMoving();
  if (e.key === "ArrowLeft") {
    isMoving.left = true;
  } else if (e.key === "ArrowRight") {
    isMoving.right = true;
  } else if (e.key === "ArrowUp") {
    isMoving.up = true;
  } else if (e.key === "ArrowDown") {
    isMoving.down = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") {
    isMoving.left = false;
  } else if (e.key === "ArrowRight") {
    isMoving.right = false;
  } else if (e.key === "ArrowUp") {
    isMoving.up = false;
  } else if (e.key === "ArrowDown") {
    isMoving.down = false;
  }
});
function resetMoving() {
  isMoving.left = false;
  isMoving.right = false;
  isMoving.up = false;
  isMoving.down = false;
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
document.getElementById("arrow-up").addEventListener("touchstart", (e) => {
  e.preventDefault();
  resetMoving();
  isMoving.up = true;
});
document.getElementById("arrow-down").addEventListener("touchstart", (e) => {
  e.preventDefault();
  resetMoving();
  isMoving.down = true;
});

document
  .getElementById("arrow-left")
  .addEventListener("touchend", () => (isMoving.left = false));
document
  .getElementById("arrow-right")
  .addEventListener("touchend", () => (isMoving.right = false));
document
  .getElementById("arrow-up")
  .addEventListener("touchend", () => (isMoving.up = false));
document
  .getElementById("arrow-down")
  .addEventListener("touchend", () => (isMoving.down = false));

document.addEventListener("touchend", () => {
  resetMoving();
});
function animatePlayer() {
  updatePlayerPosition();
  draw();

  currentFrame = currentFrame % totalFrames;
  srcX = currentFrame * spriteWidth;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.drawImage(
    playerSpriteSheet,
    isMoving.any ? srcX : 0,
    srcY,
    spriteWidth,
    spriteHeight,
    (-spriteWidth * SCALE_FACTOR) / 2,
    (-spriteHeight * SCALE_FACTOR) / 2,
    spriteWidth * SCALE_FACTOR,
    spriteHeight * SCALE_FACTOR
  );
  ctx.restore();

  framesDawn++;
  if (framesDawn >= 10) {
    currentFrame++;
    framesDawn = 0;
  }
}

export { playerX, playerY, animatePlayer };
