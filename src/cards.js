import { modules } from './modules.js';

const font = 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
const artworkCache = new Map();

const palettes = {
  violet: { base: '#eee8f7', haloOne: '#b99cda', haloTwo: '#d1b5e5', blobs: [[150, 170, 560, '#d9c9ee', .48], [850, 430, 620, '#f8f5fc', .72], [360, 1040, 640, '#e3d8f1', .56], [930, 1120, 500, '#d4c3e9', .3]] },
  blue: { base: '#e8eef8', haloOne: '#a7c1e8', haloTwo: '#c0d3ee', blobs: [[160, 230, 600, '#d0def1', .48], [850, 430, 630, '#f7f9fd', .72], [380, 1060, 650, '#dbe5f4', .56], [930, 1140, 500, '#c8d8ee', .3]] },
  teal: { base: '#e6f1ef', haloOne: '#91cbbf', haloTwo: '#b4ddd3', blobs: [[150, 180, 600, '#c8e2dc', .46], [850, 450, 620, '#f7fbfa', .72], [360, 1060, 660, '#d5e9e4', .56], [940, 1140, 500, '#bddbd3', .3]] },
  rose: { base: '#f5e9ee', haloOne: '#dda2bb', haloTwo: '#edc2d1', blobs: [[150, 180, 580, '#edcfda', .46], [850, 430, 640, '#fcf7f9', .72], [360, 1060, 650, '#f0dce4', .56], [940, 1140, 500, '#e7c5d3', .3]] },
  orange: { base: '#f5ece5', haloOne: '#d6a982', haloTwo: '#e8c5a7', blobs: [[150, 180, 580, '#ead3c1', .46], [850, 430, 640, '#fcf8f4', .72], [360, 1060, 650, '#f0dfd2', .56], [940, 1140, 500, '#e3c6ae', .3]] },
  green: { base: '#eaf1eb', haloOne: '#a3c9a8', haloTwo: '#c2dcc5', blobs: [[150, 180, 580, '#d1e2d3', .46], [850, 430, 640, '#f8fbf8', .72], [360, 1060, 650, '#dce9dd', .56], [940, 1140, 500, '#c9ddcc', .3]] },
};
const modulePalettes = {
  1: 'violet', 2: 'blue', 3: 'teal', 4: 'rose', 5: 'orange', 6: 'rose',
  7: 'green', 9: 'green', 10: 'blue', 12: 'teal', 15: 'blue',
  17: 'rose', 19: 'violet', 22: 'blue',
};

export function getModulePalette(id) {
  return palettes[modulePalettes[id]] || palettes.blue;
}

function text(ctx, value, x, y, size, alpha = .93, family = font) {
  ctx.save();
  ctx.font = `400 ${size}px ${family}`;
  ctx.fillStyle = '#2d2a25';
  ctx.globalAlpha = alpha;
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-.3px';
  ctx.fillText(value, x, y);
  ctx.restore();
}

function drawArtwork(ctx, artwork) {
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  ctx.shadowColor = 'rgba(74,57,33,.2)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(artwork, 232, 440, 560, 560);
  ctx.restore();
}

async function loadArtwork(id) {
  if (!artworkCache.has(id)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = `/illustrations/module-${String(id).padStart(2, '0')}.webp`;
    artworkCache.set(id, image.decode().then(() => image).catch(error => {
      artworkCache.delete(id);
      throw error;
    }));
  }
  return artworkCache.get(id);
}

export async function createModuleCards(items = modules) {
  const [artwork] = await Promise.all([
    Promise.all(items.map(module => loadArtwork(module.id))),
    document.fonts.load('400 104px "Taste Bread HD"'),
  ]);
  return items.map((module, index) => {
    return {
      id: module.id,
      ...getModulePalette(module.id),
      draw(ctx) {
        ctx.font = '400 104px "Taste Bread HD"';
        const titleSize = Math.min(104, ...module.lines.map((line, row) => {
          const metrics = ctx.measureText(line);
          return 104 * (row ? 880 : 704) / Math.max(metrics.width, metrics.actualBoundingBoxRight);
        }));
        ctx.save();
        ctx.textAlign = 'center';
        module.lines.forEach((line, row) => text(ctx, line, 512, 300 + row * 104, titleSize, .93, '"Taste Bread HD"'));
        ctx.restore();
        drawArtwork(ctx, artwork[index]);
      },
    };
  });
}
