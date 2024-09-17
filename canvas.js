const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const container = document.getElementById("canvas-container");

let zoomLevel = 2;
let cameraX = 0;
let cameraY = 0;

function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  ctx.fillStyle = "#a0cd3e";

  ctx.webkitImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
}

function updateCamera(playerX, playerY) {
  cameraX = canvas.width / 2 - playerX * zoomLevel;
  cameraY = canvas.height / 2 - playerY * zoomLevel;
}

function zoom(factor, centerX, centerY) {
  const oldZoom = zoomLevel;
  zoomLevel *= factor;
  zoomLevel = Math.max(0.5, Math.min(2, zoomLevel)); // Limit zoom level between 0.5 and 2

  // Adjust camera to zoom into the point under the mouse
  cameraX += (centerX - canvas.width / 2) * (1 - factor);
  cameraY += (centerY - canvas.height / 2) * (1 - factor);
}

// Event listeners
window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  zoom(e.deltaY > 0 ? 0.9 : 1.1, x, y);
});

// Initial setup
resizeCanvas();

ctx.fillStyle = "#a0cd3e";
ctx.webkitImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

function draw() {
  ctx.save();
  ctx.translate(cameraX, cameraY);
  ctx.scale(zoomLevel, zoomLevel);
  ctx.restore();
}

export { canvas, ctx, updateCamera, draw };
