import { getCookie, setCookie, changeItemState } from "./cookies.js";
import { animateBackground } from "./background.js";
import { initGlitchesLight, applyGlitchIfNeeded } from "./glitch.js";
import { animateHarnas, initHarnas } from "./harnas.js";
import {
  animateLotka,
  animateArrow,
  start,
  checkCollision,
  resetLotka,
} from "./lotka.js";
let hardmode = getCookie("piwo") == "true" ? 1 : 0;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let score = 0;
const successSound = new Audio("sounds/success-bell.mp3");
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = "#a0cd3e";
  ctx.webkitImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
}
const wrongSound = new Audio("sounds/wrong.mp3");
let stop = false;
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
function setScore(newScore) {
  if (newScore == 0) wrongSound.play();

  score = newScore;
  if (score == 5 && !stop) {
    setCookie(getCookie("piwo") == "true" ? "gorzala" : "piwo", true);
    window.setInterval(() => {
      window.location.replace("./index.html");
    }, 1000);

    stop = true;
  }
}
function animate() {
  if (!start) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  animateBackground();
  animateArrow();
  animateLotka();

  animateHarnas();
  checkCollision();
  // Overlay glitch if active
  applyGlitchIfNeeded(ctx, canvas);
  // Display score
  ctx.font = hardmode ? "bold 18px Arial" : "bold 24px Arial";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;

  ctx.strokeText(
    hardmode
      ? `Iloawsc pwiaa w  pueszecexd:  ${500 - score * 100}ml 🍺🤮`
      : `Ilość piwa w puszce: ${500 - score * 100}ml 🍺`,
    2,
    35
  );
  ctx.fillText(
    hardmode
      ? `Iloawsc pwiaa w  pueszecexd:  ${500 - score * 100}ml 🍺🤮`
      : `Ilość piwa w puszce: ${500 - score * 100}ml 🍺`,
    2,
    35
  );
}

function init() {
  initHarnas(); // Initialize harnas position
  try {
    // Lighter but a bit more frequent on Flanki
    initGlitchesLight({
      canvas,
      ctx,
      minIntervalMs: 1000,
      maxIntervalMs: 4000,
      effects: { stutter: true },
      audio: window.pageAudio,
    });
  } catch (_) {}
  // Start fixed-timestep loop at 60 FPS for consistency across devices
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
      animate();
      acc -= STEP;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

init();

export { canvas, ctx, setScore, score };
