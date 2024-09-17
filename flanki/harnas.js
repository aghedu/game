import { canvas, ctx } from "./flanki.js";
import { getCookie } from "../cookies.js";

let hardmode = getCookie("ruskacz") == "true" ? 1 : 0;
const harnasImage = new Image();
harnasImage.src = "../harnas.png";
const harnasScaleFactor = 0.15;

let harnasState = "normal"; // Can be "normal", "flipping", "lying", or "rising"
let stateChangeTime = 0;
const flipDuration = 500; // 0.5 seconds for flipping
const lyingDuration = 1000; // 1 second for lying down
const risingDuration = 500; // 0.5 seconds for rising back up

let currentRotation = 0;
let harnasX, harnasY;

// New variables for hardmode movement
let harnasDirection = 1; // 1 for right, -1 for left
const harnasSpeed = 2; // Adjust this value to change the speed of movement
let startHarnasX; // Starting X position for hardmode movement
const movementRange = 100; // Range of movement in pixels

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function respawnHarnas() {
  const harnasWidth = harnasImage.width * harnasScaleFactor;
  const harnasHeight = harnasImage.height * harnasScaleFactor;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const offsetX =
    (Math.random() - 0.5) * (canvas.width - movementRange - harnasWidth);
  const offsetY = ((Math.random() - 0.5) * canvas.height) / 2;

  harnasX = Math.max(
    movementRange / 2,
    Math.min(
      canvas.width - harnasWidth - movementRange / 2,
      centerX + offsetX - harnasWidth / 2
    )
  );
  harnasY = Math.max(
    0,
    Math.min(canvas.height - harnasHeight, centerY + offsetY - harnasHeight / 2)
  );

  startHarnasX = harnasX;
}

function animateHarnas() {
  const harnasWidth = harnasImage.width * harnasScaleFactor;
  const harnasHeight = harnasImage.height * harnasScaleFactor;

  // Hardmode movement
  if (hardmode) {
    harnasX += (harnasSpeed + Math.random()) * harnasDirection;
    if (
      harnasX <= startHarnasX - movementRange ||
      harnasX <= movementRange / 2 ||
      harnasX >= startHarnasX + movementRange ||
      harnasX >= canvas.width - movementRange / 2
    ) {
      harnasDirection *= -1;
    }
  }

  ctx.save();
  ctx.translate(harnasX + harnasWidth / 2, harnasY + harnasHeight / 2);

  const currentTime = Date.now();
  const timeSinceStateChange = currentTime - stateChangeTime;

  if (harnasState === "flipping") {
    const progress = Math.min(timeSinceStateChange / flipDuration, 1);
    currentRotation = (easeInOutQuad(progress) * Math.PI) / 2;

    if (progress === 1) {
      harnasState = "lying";
      stateChangeTime = currentTime;
    }
  } else if (harnasState === "lying") {
    currentRotation = Math.PI / 2;

    if (timeSinceStateChange > lyingDuration) {
      harnasState = "rising";
      stateChangeTime = currentTime;
      respawnHarnas();
    }
  } else if (harnasState === "rising") {
    const progress = Math.min(timeSinceStateChange / risingDuration, 1);
    currentRotation = ((1 - easeInOutQuad(progress)) * Math.PI) / 2;

    if (progress === 1) {
      harnasState = "normal";
      currentRotation = 0;
    }
  }

  ctx.rotate(currentRotation);
  ctx.drawImage(
    harnasImage,
    -harnasWidth / 2,
    -harnasHeight / 2,
    harnasWidth,
    harnasHeight
  );
  ctx.restore();
}

function startHarnasFlip() {
  if (harnasState === "normal") {
    harnasState = "flipping";
    stateChangeTime = Date.now();
  }
}

function getHarnasDimensions() {
  return {
    width: harnasImage.width * harnasScaleFactor,
    height: harnasImage.height * harnasScaleFactor,
    x: harnasX,
    y: harnasY,
  };
}

function initHarnas() {
  respawnHarnas(); // Initial spawn
}

export { animateHarnas, startHarnasFlip, getHarnasDimensions, initHarnas };
