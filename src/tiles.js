import { playerX, playerY } from "./player.js";
import { ctx, canvas } from "./canvas.js";
import { getCookie, setCookie, changeItemState } from "../cookies.js";

const tiles = [];
const TILE_WEIGHTS = [30, 30, 30, 30, 15, 15, 15, 15, 15, 0, 0];
const TILE_SOURCES = [
  "tiles/tile1.png",
  "tiles/tile2.png",
  "tiles/tile3.png",
  "tiles/tile4.png",
  "tiles/kwiatek1.png",
  "tiles/kwiatek2.png",
  "tiles/kwiatek3.png",
  "tiles/kwiatek4.png",
  "tiles/kwiatek5.png",
  "tiles/monitor.png",
  "tiles/monitor_red.png",
];

const TILE_TYPES = {
  EMPTY: 0,
  FLOWER: 1,
  MONITOR: 2,
};

const TILE_PROPERTIES = TILE_SOURCES.map((src) =>
  src.includes("kwiatek") ? TILE_TYPES.FLOWER : TILE_TYPES.EMPTY
);

// Load tile images
TILE_SOURCES.forEach((src, index) => {
  const tile = new Image();
  tile.src = src;
  tiles[index] = tile;
});

const GRID_SIZE = 32;
const TILE_SIZE = 16;
const SCALE_FACTOR = 4;
const SCALED_TILE_SIZE = TILE_SIZE * SCALE_FACTOR;
const TILE_PROBABILITY = 0.2;

// Load map image
const mapImage = new Image();
mapImage.src = "map.png";

// Tile selection logic
function getWeightedRandomFlower() {
  const flowerIndices = TILE_PROPERTIES.map((type, index) =>
    type === TILE_TYPES.FLOWER ? index : -1
  ).filter((index) => index !== -1);
  const flowerWeights = flowerIndices.map((index) => TILE_WEIGHTS[index]);
  const totalWeight = flowerWeights.reduce((sum, weight) => sum + weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (let i = 0; i < flowerIndices.length; i++) {
    cumulativeWeight += flowerWeights[i];
    if (random < cumulativeWeight) {
      return {
        image: tiles[flowerIndices[i]],
        type: TILE_TYPES.FLOWER,
      };
    }
  }
}

function getWeightedRandomTile() {
  const tileIndices = TILE_PROPERTIES.map((type, index) =>
    type === TILE_TYPES.EMPTY ? index : -1
  ).filter((index) => index !== -1);
  const tileWeights = tileIndices.map((index) => TILE_WEIGHTS[index]);
  const totalWeight = tileWeights.reduce((sum, weight) => sum + weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (let i = 0; i < tileIndices.length; i++) {
    cumulativeWeight += tileWeights[i];
    if (random < cumulativeWeight) {
      if (Math.random() < TILE_PROBABILITY)
        return {
          image: tiles[tileIndices[i]],
          type: TILE_TYPES.EMPTY,
        };
      else return null;
    }
  }
}

let tilesPos = Array.from({ length: GRID_SIZE }, () =>
  Array.from({ length: GRID_SIZE }, () => null)
);
mapImage.onload = () => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = GRID_SIZE;
  tempCanvas.height = GRID_SIZE;
  const tempCtx = tempCanvas.getContext("2d");

  // Draw the map image onto the temporary canvas to read pixel data
  tempCtx.drawImage(mapImage, 0, 0, GRID_SIZE, GRID_SIZE);
  const mapData = tempCtx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const index = (y * GRID_SIZE + x) * 4; // Get pixel data index (4 values: r, g, b, a)

      const r = mapData.data[index]; // Red channel
      const g = mapData.data[index + 1]; // Green channel
      const b = mapData.data[index + 2]; // Blue channel
      const a = mapData.data[index + 3]; // Alpha channel

      // Check if the pixel is black (RGB = 0, Alpha = 255)
      if (r === 0 && g === 0 && b === 0 && a === 255) {
        // Place a flower tile if the pixel is black
        tilesPos[y][x] = getWeightedRandomFlower();
      } else if (r == 255 && g == 255 && b == 255 && a == 255) {
        let isMonitorRed = 0;
        if (
          (index == 140 && getCookie("ruskacz") == "true") ||
          (index == 372 && getCookie("vifon") == "true") ||
          (index == 3952 && getCookie("marlboro") == "true")
        )
          isMonitorRed = 1;
        let completed = false;
        if (
          (index == 140 && getCookie("vodka") == "true") ||
          (index == 372 && getCookie("kebab") == "true") ||
          (index == 3952 && getCookie("joint") == "true")
        )
          completed = true;

        if (!completed)
          tilesPos[y][x] = {
            image: tiles[tiles.length - 2 + isMonitorRed],
            type: TILE_TYPES.MONITOR,
          };
      } else {
        // Place a random empty tile otherwise (non-black pixel)
        tilesPos[y][x] = getWeightedRandomTile();
      }
    }
  }

  // Optional: Check if map data is correctly populated
};

function animateTiles() {
  if (!tilesPos) return;

  const centerX = Math.floor(canvas.width / (2 * SCALE_FACTOR));
  const centerY = Math.floor(canvas.height / (2 * SCALE_FACTOR));

  const offsetX = centerX - playerX;
  const offsetY = centerY - playerY;

  for (let i = 0; i <= 32; i++) {
    for (let j = 0; j <= 32; j++) {
      const tileX = (i + GRID_SIZE) % GRID_SIZE;
      const tileY = (j + GRID_SIZE) % GRID_SIZE;
      const drawX = (i * TILE_SIZE + offsetX) * SCALE_FACTOR;
      const drawY = (j * TILE_SIZE + offsetY) * SCALE_FACTOR;

      const tile = tilesPos[tileY][tileX];
      if (tile) {
        ctx.drawImage(
          tile.image,
          0,
          0,
          TILE_SIZE,
          TILE_SIZE,
          Math.round(drawX),
          Math.round(drawY),
          SCALED_TILE_SIZE,
          SCALED_TILE_SIZE
        );
      }
    }
  }
}

export { animateTiles, tilesPos };
