import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

const rounded = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#3E5C58"/>
  <circle cx="256" cy="248" r="126" fill="none" stroke="#F3EFE6" stroke-width="12"/>
  <path d="M300 164c-66 16-112 74-112 136s50 120 116 130c-56-18-94-68-94-122s38-106 90-144z" fill="#F3EFE6"/>
</svg>`;

const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3E5C58"/>
  <circle cx="256" cy="250" r="92" fill="none" stroke="#F3EFE6" stroke-width="10"/>
  <path d="M288 190c-48 12-82 54-82 100s36 88 86 96c-42-14-70-50-70-90s28-78 66-106z" fill="#F3EFE6"/>
</svg>`;

async function png(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, file));
}

await png(rounded, 192, 'icon-192.png');
await png(rounded, 512, 'icon-512.png');
await png(rounded, 180, 'apple-touch-icon.png');
await png(maskable, 512, 'icon-maskable-512.png');
console.log('icons written');
