import { modules } from './modules.js';

const font = 'system-ui, -apple-system, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
const artworkCache = new Map();

// Ivory and richer sand gradients with restrained ochre accents.
const themes = [
  { base: '#f3eada', blobs: [[140,120,520,'#ffffff',.8],[170,640,540,'#dcc5a1',.55],[860,520,540,'#efe0c8',.65],[560,760,360,'#c3a36e',.38],[900,1160,520,'#fffdf8',.65]] },
  { base: '#e8d8bf', blobs: [[900,250,520,'#fffdf8',.75],[720,620,470,'#cfaf7b',.42],[560,1000,700,'#f6eddf',.65],[230,360,540,'#dcc5a1',.4],[820,1060,260,'#bd9b64',.28],[960,1200,420,'#ffffff',.8]] },
  { base: '#dfc9a8', blobs: [[600,560,360,'#bd9e6b',.4],[860,240,560,'#f9f2e6',.8],[290,720,520,'#cfaf7d',.42],[150,1160,460,'#eaddc6',.65],[820,1010,540,'#fffdf8',.7]] },
  { base: '#f1e6d4', blobs: [[80,700,440,'#dcc3a0',.48],[100,1250,420,'#e8d5b8',.55],[520,320,540,'#ffffff',.85],[500,760,540,'#d4b788',.48],[520,770,330,'#bc9c64',.34],[950,1150,520,'#fffdf8',.7]] },
  { base: '#e5d4b9', blobs: [[560,700,380,'#bea16e',.38],[840,300,540,'#fffdf8',.8],[250,520,500,'#d2b78d',.4],[300,1110,580,'#f4eada',.7],[920,1110,400,'#ffffff',.6]] },
  { base: '#ecdec6', blobs: [[880,250,580,'#fffdf8',.8],[170,1090,640,'#d9bc8d',.6],[560,620,430,'#c1a16c',.38],[960,1210,380,'#faf4e9',.7]] },
];

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
  ctx.drawImage(artwork, 222, 360, 580, 580);
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
    document.fonts.load('400 104px "Matcha Style"'),
  ]);
  return items.map((module, index) => {
    return {
      id: module.id,
      ...themes[(module.id - 1) % themes.length],
      draw(ctx) {
        ctx.font = '400 104px "Matcha Style"';
        const titleSize = Math.min(104, ...module.lines.map((line, row) => {
          const metrics = ctx.measureText(line);
          return 104 * (row ? 880 : 704) / Math.max(metrics.width, metrics.actualBoundingBoxRight);
        }));
        module.lines.forEach((line, row) => text(ctx, line, 72, 150 + row * 104, titleSize, .93, '"Matcha Style"'));
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,.65)';
        ctx.beginPath();
        ctx.roundRect(808, 108, 144, 64, 32);
        ctx.fill();
        ctx.strokeStyle = 'rgba(74,57,33,.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = `400 30px ${font}`;
        ctx.fillStyle = '#514b41';
        ctx.globalAlpha = .82;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`, 880, 140);
        ctx.restore();

        drawArtwork(ctx, artwork[index]);

        module.copy.forEach((line, row) => text(ctx, line, 72, 1128 + row * 56, 44, .78));
      },
    };
  });
}
