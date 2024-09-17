import { getCookie, setCookie, changeItemState } from "./cookies.js";
import { animateBackground } from "./background.js";
import { animateHarnas, initHarnas } from "./harnas.js";
import {
  animateLotka,
  animateArrow,
  start,
  checkCollision,
  resetLotka,
} from "./lotka.js";
let hardmode = getCookie("ruskacz") == "true" ? 1 : 0;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let score = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = "#a0cd3e";
  ctx.webkitImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
function setScore(newScore) {
  score = newScore;
  if (score == 5) {
    setCookie(getCookie("ruskacz") == "true" ? "vodka" : "ruskacz", true);
    location.href = "./index.html";
  }
}
function animate() {
  if (!start) {
    requestAnimationFrame(animate);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  animateBackground();
  animateArrow();
  animateLotka();

  animateHarnas();
  checkCollision();
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

  requestAnimationFrame(animate);
}

function init() {
  initHarnas(); // Initialize harnas position
  animate();
}

init();

export { canvas, ctx, setScore, score };
