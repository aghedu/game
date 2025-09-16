// Lightweight glitch effects used across pages. Designed to be non-invasive and
// only affect a single frame; normal rendering continues next frame.

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function tearAndDisplace(ctx, canvas, maxSlices = 8) {
  const { width, height } = canvas;
  const numSlices = Math.max(1, Math.floor(rand(1, maxSlices)));
  try {
    for (let i = 0; i < numSlices; i++) {
      const sliceHeight = Math.max(1, Math.floor(rand(2, height / 8)));
      const sliceY = Math.floor(rand(0, Math.max(1, height - sliceHeight)));
      const offsetX = Math.floor(rand(-width * 0.1, width * 0.1));
      const data = ctx.getImageData(0, sliceY, width, sliceHeight);
      ctx.putImageData(data, offsetX, sliceY);
    }
  } catch (_) {
    // getImageData/putImageData can throw on tainted canvas; ignore gracefully.
  }
}

function chromaticAberration(ctx, canvas, intensity = 2.5) {
  const { width, height } = canvas;
  try {
    const original = ctx.getImageData(0, 0, width, height);
    const r = new ImageData(width, height);
    const g = new ImageData(width, height);
    const b = new ImageData(width, height);
    const src = original.data;
    const rd = r.data,
      gd = g.data,
      bd = b.data;
    for (let i = 0; i < src.length; i += 4) {
      rd[i] = src[i];
      rd[i + 3] = src[i + 3];
      gd[i + 1] = src[i + 1];
      gd[i + 3] = src[i + 3];
      bd[i + 2] = src[i + 2];
      bd[i + 3] = src[i + 3];
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter"; // additively blend channels
    const rShift = Math.round(rand(-intensity, intensity));
    const gShift = Math.round(rand(-intensity, intensity));
    const bShift = Math.round(rand(-intensity, intensity));
    ctx.putImageData(r, rShift, 0);
    ctx.putImageData(g, gShift, 0);
    ctx.putImageData(b, bShift, 0);
    ctx.restore();
  } catch (_) {
    // Ignore if canvas is tainted or operation unsupported
  }
}

function audioStutter(audio, durationMs = 220, stutterDurationMs = 30) {
  if (!audio || audio.paused) return;
  try {
    const originalTime = audio.currentTime;
    const start = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - start;
      if (elapsed >= durationMs) {
        clearInterval(id);
        try {
          audio.currentTime = originalTime + durationMs / 1000;
        } catch (_) {}
        return;
      }
      try {
        audio.currentTime = Math.max(0, originalTime - 0.08);
      } catch (_) {}
    }, stutterDurationMs);
  } catch (_) {}
}

function scheduleRandom(fn, minMs, maxMs) {
  const next = () => {
    const delay = Math.max(0, rand(minMs, maxMs));
    setTimeout(() => {
      try {
        fn();
      } finally {
        next();
      }
    }, delay);
  };
  next();
}

let glitchActiveUntil = 0;
let effectFn = null;
let tmpCanvas = null;
let tmpCtx = null;

function ensureTmp(width, height) {
  if (!tmpCanvas) {
    tmpCanvas = document.createElement("canvas");
    tmpCtx = tmpCanvas.getContext("2d");
  }
  if (tmpCanvas.width !== width || tmpCanvas.height !== height) {
    tmpCanvas.width = width;
    tmpCanvas.height = height;
  }
}

function crtBlast(ctx, canvas) {
  const { width, height } = canvas;
  ensureTmp(width, height);
  try {
    // Copy current frame
    tmpCtx.clearRect(0, 0, width, height);
    tmpCtx.drawImage(canvas, 0, 0);

    ctx.save();
    // Vertical roll
    const s = Math.round(rand(-height * 0.15, height * 0.15));
    ctx.clearRect(0, 0, width, height);
    if (s >= 0) {
      // move down
      ctx.drawImage(
        tmpCanvas,
        0,
        0,
        width,
        height - s,
        0,
        s,
        width,
        height - s
      );
      ctx.drawImage(tmpCanvas, 0, height - s, width, s, 0, 0, width, s);
    } else {
      const up = -s;
      // move up
      ctx.drawImage(
        tmpCanvas,
        0,
        up,
        width,
        height - up,
        0,
        0,
        width,
        height - up
      );
      ctx.drawImage(tmpCanvas, 0, 0, width, up, 0, height - up, width, up);
    }

    // Heavy tearing and color separation
    tearAndDisplace(ctx, canvas, 28);
    chromaticAberration(ctx, canvas, 8.0);

    // Scanline overlay
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let y = 0; y < height; y += 2) ctx.fillRect(0, y, width, 1);

    // Brightness flash
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } catch (_) {}
}

function blockCopy(ctx, canvas, maxBlocks = 6, maxOffsetRatio = 0.2) {
  const { width, height } = canvas;
  ensureTmp(width, height);
  try {
    // Snapshot once to avoid feedback during copying
    tmpCtx.clearRect(0, 0, width, height);
    tmpCtx.drawImage(canvas, 0, 0);
    const n = Math.max(1, Math.floor(rand(1, maxBlocks)));
    for (let i = 0; i < n; i++) {
      const sw = Math.floor(rand(width * 0.08, width * 0.3));
      const sh = Math.floor(rand(height * 0.06, height * 0.25));
      const sx = Math.floor(rand(0, Math.max(1, width - sw)));
      const sy = Math.floor(rand(0, Math.max(1, height - sh)));
      let dx = Math.floor(
        sx + rand(-width * maxOffsetRatio, width * maxOffsetRatio)
      );
      let dy = Math.floor(
        sy + rand(-height * maxOffsetRatio, height * maxOffsetRatio)
      );
      dx = Math.max(0, Math.min(width - sw, dx));
      dy = Math.max(0, Math.min(height - sh, dy));
      ctx.drawImage(tmpCanvas, sx, sy, sw, sh, dx, dy, sw, sh);
    }
  } catch (_) {}
}

function applyGlitchIfNeeded(ctx, canvas) {
  if (!ctx || !canvas) return;
  if (
    performance.now() <= glitchActiveUntil &&
    typeof effectFn === "function"
  ) {
    try {
      effectFn(ctx, canvas);
    } catch (_) {}
  }
}

function initGlitches({
  canvas,
  ctx,
  audio,
  minIntervalMs = 3000,
  maxIntervalMs = 7000,
} = {}) {
  if (!canvas || !ctx) return;
  scheduleRandom(
    () => {
      const roll = Math.random();
      let duration;
      if (roll > 0.96) {
        // Rare, strong CRT-like blast
        duration = rand(220, 420);
        effectFn = (c, cv) => crtBlast(c, cv);
        if (audio) audioStutter(audio, rand(260, 420));
      } else if (roll < 0.35) {
        duration = rand(120, 220);
        effectFn = (c, cv) => blockCopy(c, cv, 8, 0.25);
        if (audio && Math.random() < 0.35) audioStutter(audio, rand(140, 260));
      } else if (roll < 0.6) {
        duration = rand(130, 220);
        effectFn = (c, cv) => tearAndDisplace(c, cv, 12);
        if (audio && Math.random() < 0.25) audioStutter(audio, rand(140, 240));
      } else if (roll < 0.85) {
        duration = rand(150, 260);
        effectFn = (c, cv) => {
          blockCopy(c, cv, 10, 0.28);
          if (Math.random() < 0.4) tearAndDisplace(c, cv, 14);
        };
        if (audio && Math.random() < 0.3) audioStutter(audio, rand(160, 280));
      } else if (roll < 0.9) {
        duration = rand(150, 260);
        effectFn = (c, cv) => {
          tearAndDisplace(c, cv, 22);
          if (Math.random() < 0.5) chromaticAberration(c, cv, 5.5);
        };
        if (audio && Math.random() < 0.4) audioStutter(audio, rand(180, 300));
      } else {
        duration = rand(170, 300);
        effectFn = (c, cv) => {
          tearAndDisplace(c, cv, 18);
          chromaticAberration(c, cv, 7.5);
        };
        if (audio) audioStutter(audio, rand(220, 380));
      }
      // Occasionally extend the effect to linger longer
      let extra = 0;
      if (roll > 0.96) {
        // Strong CRT blast: higher chance and longer extension
        if (Math.random() < 0.45) extra = rand(400, 1200);
      } else {
        if (Math.random() < 0.22) extra = rand(250, 700);
      }
      glitchActiveUntil = performance.now() + duration + extra;
    },
    minIntervalMs,
    maxIntervalMs
  );
}

function initGlitchesLight({
  canvas,
  ctx,
  minIntervalMs = 7000,
  maxIntervalMs = 14000,
  effects,
  audio,
} = {}) {
  const opts = Object.assign(
    { blockCopy: true, tear: true, chroma: true, crt: false, stutter: false },
    effects || {}
  );
  if (!canvas || !ctx) return;
  scheduleRandom(
    () => {
      const roll = Math.random();
      let duration;
      if (opts.crt && roll > 0.998) {
        // Extremely rare small CRT-like nudge, no audio
        duration = rand(120, 220);
        effectFn = (c, cv) => {
          // mild version of crt blast: minimal roll and lighter overlays
          const { width, height } = cv;
          ensureTmp(width, height);
          try {
            tmpCtx.clearRect(0, 0, width, height);
            tmpCtx.drawImage(cv, 0, 0);
            const s = Math.round(rand(-height * 0.05, height * 0.05));
            c.clearRect(0, 0, width, height);
            if (s >= 0) {
              c.drawImage(
                tmpCanvas,
                0,
                0,
                width,
                height - s,
                0,
                s,
                width,
                height - s
              );
              c.drawImage(tmpCanvas, 0, height - s, width, s, 0, 0, width, s);
            } else {
              const up = -s;
              c.drawImage(
                tmpCanvas,
                0,
                up,
                width,
                height - up,
                0,
                0,
                width,
                height - up
              );
              c.drawImage(
                tmpCanvas,
                0,
                0,
                width,
                up,
                0,
                height - up,
                width,
                up
              );
            }
            tearAndDisplace(c, cv, 10);
            chromaticAberration(c, cv, 2.0);
          } catch (_) {}
        };
      } else if (roll < 0.4) {
        duration = rand(70, 130);
        effectFn = (c, cv) => blockCopy(c, cv, 4, 0.18);
        if (audio && opts.stutter && Math.random() < 0.12)
          audioStutter(audio, rand(120, 200));
      } else if (roll < 0.75) {
        duration = rand(70, 130);
        effectFn = (c, cv) => tearAndDisplace(c, cv, 6);
        if (audio && opts.stutter && Math.random() < 0.1)
          audioStutter(audio, rand(120, 180));
      } else {
        duration = rand(90, 150);
        effectFn = (c, cv) => {
          tearAndDisplace(c, cv, 10);
          if (Math.random() < 0.2) chromaticAberration(c, cv, 2.5);
        };
        if (opts.chroma && opts.tear) {
          if (audio && opts.stutter && Math.random() < 0.1)
            audioStutter(audio, rand(140, 220));
        } else if (opts.blockCopy) {
          effectFn = (c, cv) => blockCopy(c, cv, 4, 0.15);
          if (audio && opts.stutter && Math.random() < 0.12)
            audioStutter(audio, rand(120, 200));
        } else if (opts.tear) {
          effectFn = (c, cv) => tearAndDisplace(c, cv, 6);
          if (audio && opts.stutter && Math.random() < 0.1)
            audioStutter(audio, rand(120, 180));
        } else {
          effectFn = () => {};
        }
      }
      // Small chance to extend lightly
      if (Math.random() < 0.1) duration += rand(80, 200);
      glitchActiveUntil = performance.now() + duration;
    },
    minIntervalMs,
    maxIntervalMs
  );
}

export { initGlitches, initGlitchesLight, applyGlitchIfNeeded };
