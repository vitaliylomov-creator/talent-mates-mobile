// Brand asset generator. Re-run any time the M wordmark or icon spec changes.
//   node scripts/generate-brand-assets.mjs
//
// Output: assets/images/{icon,android-icon-foreground,android-icon-background,
// android-icon-monochrome,splash-icon,favicon}.png
//
// Note on fonts: librsvg/resvg used by sharp does not have DM Serif Display
// installed system-wide, so the M renders in whichever serif the SVG renderer
// falls back to. Visually close enough for v1.0 — swap with a designer-cut PNG
// before App Store submission if needed.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../assets/images');

const PURPLE = '#794DC6';
const WHITE = '#ffffff';

function makeBg(size, color = PURPLE) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${color}"/>
  </svg>`;
}

function makeM(size, color = WHITE) {
  const fontSize = Math.round(size * 0.62);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
          fill="${color}" font-family="DM Serif Display, Times New Roman, Georgia, serif"
          font-size="${fontSize}" font-weight="400" dy="0.04em">M</text>
  </svg>`;
}

function makeIconWithM(size) {
  const fontSize = Math.round(size * 0.62);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${PURPLE}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
          fill="${WHITE}" font-family="DM Serif Display, Times New Roman, Georgia, serif"
          font-size="${fontSize}" font-weight="400" dy="0.04em">M</text>
  </svg>`;
}

async function svgToPng(svg, outPath, resizeTo) {
  let pipe = sharp(Buffer.from(svg)).png();
  if (resizeTo) pipe = pipe.resize(resizeTo, resizeTo);
  await pipe.toFile(outPath);
  console.log(`  ✓ ${outPath.split('/').pop()}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Generating MATE brand assets…');

  // App icon — purple bg + M (iOS + Android legacy)
  await svgToPng(makeIconWithM(1024), `${OUT}/icon.png`);
  // Android adaptive — foreground (M on transparent, sits over backgroundColor)
  await svgToPng(makeM(1024), `${OUT}/android-icon-foreground.png`);
  // Android adaptive — monochrome (for themed icons)
  await svgToPng(makeM(1024), `${OUT}/android-icon-monochrome.png`);
  // Android adaptive — background (kept for legacy paths, unused when backgroundColor set)
  await svgToPng(makeBg(1024), `${OUT}/android-icon-background.png`);
  // Splash icon — M on transparent, centered on purple bg (via splash plugin config)
  await svgToPng(makeM(1024), `${OUT}/splash-icon.png`);
  // Favicon for web
  await svgToPng(makeIconWithM(256), `${OUT}/favicon.png`, 48);

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
