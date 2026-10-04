import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const inputPath = path.resolve('src/assets/images/tradesizer_clean_bleed.jpg');
const publicDir = path.resolve('public');

if (!fs.existsSync(inputPath)) {
  console.error('Source image not found:', inputPath);
  process.exit(1);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function processIcons() {
  console.log('Generating edge-to-edge dark blue icons from:', inputPath);

  // Background color rgb(5, 21, 46) -> #05152e
  const bgColor = { r: 5, g: 21, b: 46, alpha: 1 };

  // 1. Standard full-bleed 512x512
  await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 2. Standard full-bleed 192x192
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

  // 4. Favicon 64x64
  await sharp(inputPath)
    .resize(64, 64, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Created favicon.ico');

  // 5. Maskable 512x512 with safe-zone on solid dark blue canvas
  const inner512 = await sharp(inputPath)
    .resize(410, 410, { fit: 'cover' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: bgColor,
    },
  })
    .composite([{ input: inner512, gravity: 'center' }])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created pwa-maskable-512x512.png');

  // 6. Maskable 192x192 with safe-zone on solid dark blue canvas
  const inner192 = await sharp(inputPath)
    .resize(154, 154, { fit: 'cover' })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: bgColor,
    },
  })
    .composite([{ input: inner192, gravity: 'center' }])
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));
  console.log('✓ Created pwa-maskable-192x192.png');

  // 7. General icon.png
  await sharp(inputPath)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon.png'));
  console.log('✓ Created icon.png');

  console.log('All seamless dark-blue icons generated successfully with ZERO white corners!');
}

processIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
