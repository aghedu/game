import { canvas, ctx, setScore, score } from "./flanki.js";
import { startHarnasFlip, getHarnasDimensions } from "./harnas.js";
import { getCookie } from "./cookies.js";
let hardmode = getCookie("ruskacz") == "true" ? 1 : 0;
let start = false;
let angle = 0;
const rotationSpeed = 0.075 + hardmode * 0.03;
let increasing = true;
const arrowImage = new Image();
const arrowOrangeImage = new Image();
const lotkaImage = new Image();
let isButtonPressed = false;

let lotkaX = 0;
let lotkaY = 0;
const lotkaScaleFactor = 0.13;
let isGravityApplied = false;
let gravityStartTime = 0;
const gravityDelay = 30;
const gravity = 0.75;

let isLotkaThrown = false;
let lotkaVelocityX = 0;
let lotkaVelocityY = 0;
const minThrowSpeed = 0;
const maxThrowSpeed = 30;

let isCharging = false;
let chargeStartTime = 0;
const maxChargeTime = 1000;

let offScreenCanvas;
let offScreenCtx;

let lotkaRotation = 0;
const lotkaRotationSpeed = 0.1;

function startCharging() {
  if (!isCharging && !isLotkaThrown) {
    isCharging = true;
    chargeStartTime = Date.now();
  }
}

function initializeImages(callback) {
  let imagesLoaded = 0;

  function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 3) {
      start = true;
      resetLotka();
      prepareArrowCanvas();
      callback();
    }
  }

  arrowImage.onload = onImageLoad;
  arrowOrangeImage.onload = onImageLoad;
  lotkaImage.onload = onImageLoad;

  arrowImage.src = "./arrow_big.png";
  arrowOrangeImage.src = "./arrow_big_orange.png";
  lotkaImage.src = "./lotka.png";
}

function prepareArrowCanvas() {
  offScreenCanvas = document.createElement("canvas");
  offScreenCanvas.width = arrowImage.width;
  offScreenCanvas.height = arrowImage.height;
  offScreenCtx = offScreenCanvas.getContext("2d");
}

function animateArrow() {
  if (lotkaRotation > 0) return;
  const arrowScaleFactor = 0.13;
  const maxSize = Math.min(canvas.width, canvas.height) * arrowScaleFactor;
  const arrowWidth = maxSize;
  const arrowHeight = (arrowImage.height / arrowImage.width) * arrowWidth;

  // Calculate the arrow's position based on the lotka's position
  const arrowX = lotkaX + (lotkaImage.width * lotkaScaleFactor) / 2;
  const arrowY = canvas.height - (lotkaImage.height * lotkaScaleFactor) / 2;

  ctx.save();
  ctx.translate(arrowX, arrowY);
  ctx.rotate(angle);

  // Draw the normal arrow
  offScreenCtx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
  offScreenCtx.drawImage(arrowImage, 0, 0);
  ctx.drawImage(
    offScreenCanvas,
    -arrowWidth / 2,
    -arrowHeight / 2,
    arrowWidth,
    arrowHeight
  );

  if (isCharging) {
    const chargeTime = Math.min(Date.now() - chargeStartTime, maxChargeTime);
    const chargeProgress = chargeTime / maxChargeTime;

    // Draw the orange arrow with increasing opacity
    ctx.globalAlpha = chargeProgress;
    ctx.drawImage(
      arrowOrangeImage,
      -arrowWidth / 2,
      -arrowHeight / 2,
      arrowWidth,
      arrowHeight
    );
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Animate arrow rotation
  if (increasing) {
    angle += rotationSpeed;
    if (angle >= Math.PI / 1.5) {
      increasing = false;
    }
  } else {
    angle -= rotationSpeed;
    if (angle <= -Math.PI / 2) {
      increasing = true;
    }
  }

  angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 1.5, angle));
}

function calculateXOffset(score) {
  return ((score + 0.3) * canvas.width) / 8;
}

function animateLotka() {
  if (isLotkaThrown) {
    lotkaX += lotkaVelocityX;
    lotkaY += lotkaVelocityY;

    if (isGravityApplied && Date.now() - gravityStartTime >= gravityDelay) {
      lotkaVelocityY += gravity;
    }

    lotkaRotation += lotkaRotationSpeed;

    if (lotkaY > canvas.height || lotkaX > canvas.width) {
      setScore(0);
      resetLotka();
    }
  }

  // Draw the rotated lotka
  ctx.save();
  ctx.translate(
    lotkaX + (lotkaImage.width * lotkaScaleFactor) / 2,
    lotkaY + (lotkaImage.height * lotkaScaleFactor) / 2
  );
  ctx.rotate(lotkaRotation);
  ctx.drawImage(
    lotkaImage,
    -(lotkaImage.width * lotkaScaleFactor) / 2,
    -(lotkaImage.height * lotkaScaleFactor) / 2,
    lotkaImage.width * lotkaScaleFactor,
    lotkaImage.height * lotkaScaleFactor
  );
  ctx.restore();
}

function resetLotka() {
  isLotkaThrown = false;
  const xOffset = calculateXOffset(score);
  lotkaX = xOffset;
  lotkaY = canvas.height - lotkaImage.height * lotkaScaleFactor;
  lotkaVelocityX = 0;
  lotkaVelocityY = 0;
  isGravityApplied = false;
  lotkaRotation = 0;
}

function throwLotka() {
  if (isCharging) {
    isLotkaThrown = true;
    isCharging = false;

    const chargeTime = Math.min(Date.now() - chargeStartTime, maxChargeTime);
    const chargeProgress = chargeTime / maxChargeTime;
    const throwSpeed =
      minThrowSpeed + (maxThrowSpeed - minThrowSpeed) * chargeProgress;

    const throwAngle = Math.PI / 2 - angle;

    lotkaVelocityX = Math.cos(throwAngle) * throwSpeed;
    lotkaVelocityY = -Math.sin(throwAngle) * throwSpeed;

    gravityStartTime = Date.now();
    isGravityApplied = true;

    lotkaRotation = throwAngle;
  }
}

function checkCollision() {
  const harnas = getHarnasDimensions();
  harnas.width /= 2;
  harnas.x += harnas.width / 2;
  const lotkaWidth = lotkaImage.width * lotkaScaleFactor;
  const lotkaHeight = lotkaImage.height * lotkaScaleFactor;

  const lotkaCenterX = lotkaX + lotkaWidth / 2;
  const lotkaCenterY = lotkaY + lotkaHeight / 2;

  const corners = [
    { x: -lotkaWidth / 2, y: -lotkaHeight / 2 },
    { x: lotkaWidth / 2, y: -lotkaHeight / 2 },
    { x: lotkaWidth / 2, y: lotkaHeight / 2 },
    { x: -lotkaWidth / 2, y: lotkaHeight / 2 },
  ].map((corner) => {
    const rotatedX =
      corner.x * Math.cos(lotkaRotation) - corner.y * Math.sin(lotkaRotation);
    const rotatedY =
      corner.x * Math.sin(lotkaRotation) + corner.y * Math.cos(lotkaRotation);
    return {
      x: lotkaCenterX + rotatedX,
      y: lotkaCenterY + rotatedY,
    };
  });

  const harnasLeft = harnas.x;
  const harnasRight = harnas.x + harnas.width;
  const harnasTop = harnas.y;
  const harnasBottom = harnas.y + harnas.height;

  const collision = corners.some(
    (corner) =>
      corner.x > harnasLeft &&
      corner.x < harnasRight &&
      corner.y > harnasTop &&
      corner.y < harnasBottom
  );

  if (collision) {
    startHarnasFlip();
    setScore(score + 1);
    resetLotka();
    return true;
  }
  return false;
}

// Event listeners
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    startCharging();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    throwLotka();
  }
});

const arrowUpButton = document.getElementById("arrow-up");

arrowUpButton.addEventListener("mousedown", (event) => {
  event.preventDefault();
  isButtonPressed = true;
  startCharging();
});

arrowUpButton.addEventListener("mouseup", (event) => {
  event.preventDefault();
  isButtonPressed = false;
  throwLotka();
});

arrowUpButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  isButtonPressed = true;
  startCharging();
});

arrowUpButton.addEventListener("pointerup", (event) => {
  event.preventDefault();
  isButtonPressed = false;
  throwLotka();
});

arrowUpButton.addEventListener("touchmove", (event) => {
  event.preventDefault();
});

function init() {
  initializeImages(() => {});
}

init();

export { start, animateArrow, animateLotka, resetLotka, checkCollision };
