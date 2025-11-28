const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/images/icon-centered.svg');
  const svg = fs.readFileSync(svgPath);

  // Generate 512x512 icon
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, '../public/images/icon-512.png'));
  console.log('Generated icon-512.png');

  // Generate 192x192 icon
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, '../public/images/icon-192.png'));
  console.log('Generated icon-192.png');

  // Generate 180x180 apple icon
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/images/apple-icon.png'));
  console.log('Generated apple-icon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
