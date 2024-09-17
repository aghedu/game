import { canvas, ctx } from "./canvas.js";
import { animatePlayer } from "./player.js";
import { animateTiles } from "./tiles.js";
import {
  getCookie,
  setCookie,
  changeItemState,
  itemStates,
} from "./cookies.js";

let itemImages = [];

/* 
setCookie("ruskacz", false);
setCookie("vodka", false);
setCookie("vifon", false);
setCookie("kebab", false);
setCookie("marlboro", false);
setCookie("joint", false);
*/

function loadImages() {
  const imageNames = [
    "ruskacz",
    "vodka",
    "vifon",
    "kebab",
    "marlboro",
    "joint",
  ];

  imageNames.forEach((name) => {
    const blankImg = new Image();
    blankImg.src = `./items/blank/${name}_blank.png`;
    itemImages.push({ name, blank: blankImg, normal: null });

    const normalImg = new Image();
    normalImg.src = `./items/normal/${name}.png`;
    normalImg.onload = () => {
      const item = itemImages.find((item) => item.name === name);
      if (item) {
        item.normal = normalImg;
      }
    };
  });
}

function renderItems() {
  let x = 10; // Starting x position
  const y = 5; // y position (top)
  const spacing = 5; // Spacing between images

  itemImages.forEach((item) => {
    const img = getCookie(item.name) == "true" ? item.normal : item.blank;
    if (img) {
      ctx.drawImage(img, x, y, img.width, img.height);
      x += 32 + img.width / 2;
    }
  });
}

function animate() {
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  animateTiles();
  animatePlayer();
  renderItems();
  requestAnimationFrame(animate);
}

function checkAllCookiesTrue() {
  const cookieNames = [
    "ruskacz",
    "vodka",
    "vifon",
    "kebab",
    "marlboro",
    "joint",
  ];
  return cookieNames.every((name) => getCookie(name) === "true");
}

function endGame() {
  canvas.style.display = "none";
  console.clear();
  document.body.innerHTML =
    "<h1>MUSISZ ODNALEŹĆ ŹRÓDŁO</h1> <!--SZUKAJ W OKOLICY 49.438166, 20.721201-->";
}

function startGame() {
  loadImages();
  animate();

  // Check for all cookies being true every second
  const checkInterval = setInterval(() => {
    if (checkAllCookiesTrue()) {
      clearInterval(checkInterval);
      setTimeout(endGame, 1000);
    }
  }, 1000);
}

startGame();

export { animate, changeItemState, getCookie };
