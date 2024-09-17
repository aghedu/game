import { canvas, ctx } from "./flanki.js";

const msImage = new Image();
msImage.src = "./ms.jpg";
function animateBackground() {
  ctx.drawImage(msImage, 0, 0, canvas.width, canvas.height);
}
export { animateBackground };
