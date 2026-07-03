// Regenerates raster brand assets from the WhatIf mark (gradient square + "?").
// Source of truth for the vector mark is app/icon.svg. Run: node scripts/generate-brand-assets.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// size = canvas px, radius = corner radius in px (0 = full-bleed), fontRatio = "?" size vs canvas
function markSvg({ size, radius, fontRatio = 0.62 }) {
  const font = Math.round(size * fontRatio);
  const baseline = Math.round(size * 0.705); // visually centers "?" (incl. the dot)
  const rect =
    radius > 0
      ? `<rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>`
      : `<rect width="${size}" height="${size}" fill="url(#g)"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#a855f7"/>
      <stop offset="0.5" stop-color="#ec4899"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  ${rect}
  <text x="${size / 2}" y="${baseline}" font-family="Arial, 'Segoe UI', Helvetica, sans-serif" font-size="${font}" font-weight="700" fill="#ffffff" text-anchor="middle">?</text>
</svg>`;
}

const targets = [
  // Full-bleed for TikTok/social — circular crop reads as a gradient disc.
  { svg: markSvg({ size: 1024, radius: 0 }), out: "public/whatif-tiktok.png" },
  // Rounded, transparent corners for iOS home-screen / apple-touch-icon.
  { svg: markSvg({ size: 180, radius: 40 }), out: "app/apple-icon.png" },
];

for (const t of targets) {
  const path = join(root, t.out);
  await sharp(Buffer.from(t.svg)).png().toFile(path);
  console.log("wrote", t.out);
}
