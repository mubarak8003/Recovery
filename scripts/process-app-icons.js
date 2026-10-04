import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const inputPath = path.resolve('src/assets/images/tradesizer_app_icon_1791101867788.jpg');
const publicDir = path.resolve('public');

if (!fs.existsSync(inputPath)) {
  console.error('Source image not found:', inputPath);
  process.exit(1);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function processIcons() {
  console.log('Processing app icons from:', inputPath);

  // 1. Standard 512x512
  await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 2. Standard 192x192
  await sharp(inputPath)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created pwa-192x192.png');

  // 3. Apple Touch Icon 180x180
  await sharp(inputPath)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 4. Favicon 48x48 / 64x64
  await sharp(inputPath)
    .resize(64, 64, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Created favicon.ico');

  // 5. Maskable 512x512: Padded with deep dark blue background (#070b14) so Android circular/squircle cropping doesn't cut the TradeSizer text or elements
  const innerResized = await sharp(inputPath)
    .resize(420, 420, { fit: 'cover' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 7, g: 11, b: 20, alpha: 1 },
    },
  })
    .composite([{ input: innerResized, gravity: 'center' }])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created pwa-maskable-512x512.png (with safe zone padding for centered text)');

  // Also create icon.png for general links
  await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon.png'));

  console.log('All icons generated successfully!');
}

processIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
