import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// CRC table for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, isMaskable = false) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Generate image pixels
  const rawRows = [];
  const cx = width / 2;
  const cy = height / 2;

  // Background colors: #080e1a -> #0b172d -> #050a14
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 4;

      // Base background gradient: dark blue/navy
      const normY = y / height;
      const r = Math.round(8 + (11 - 8) * normY);
      const g = Math.round(14 + (23 - 14) * normY);
      const b = Math.round(26 + (45 - 26) * normY);
      row[idx] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
      row[idx + 3] = 255;

      // Check distance from center for rounded icon if not maskable
      const cornerR = isMaskable ? 0 : width * 0.22;
      const dx = Math.max(Math.abs(x - cx) - (width / 2 - cornerR), 0);
      const dy = Math.max(Math.abs(y - cy) - (height / 2 - cornerR), 0);
      const distFromCorner = Math.sqrt(dx * dx + dy * dy);

      if (!isMaskable && distFromCorner > cornerR) {
        row[idx + 3] = 0; // Transparent outside rounded corner
        continue;
      }

      // Draw green/cyan trending chart path
      // P1: (0.2, 0.65) -> P2: (0.35, 0.52) -> P3: (0.5, 0.58) -> P4: (0.7, 0.35) -> P5: (0.85, 0.28)
      const px = x / width;
      const py = y / height;

      // Distance to trend line segment approximation
      let onLine = false;
      const points = [
        [0.18, 0.68],
        [0.35, 0.55],
        [0.52, 0.60],
        [0.70, 0.38],
        [0.85, 0.30]
      ];

      for (let i = 0; i < points.length - 1; i++) {
        const x1 = points[i][0];
        const y1 = points[i][1];
        const x2 = points[i + 1][0];
        const y2 = points[i + 1][1];

        // Project point onto segment
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        const dist = Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));

        if (dist < (isMaskable ? 0.025 : 0.032)) {
          onLine = true;
          break;
        }
      }

      if (onLine) {
        // Emerald / Cyan neon line
        row[idx] = 16;
        row[idx + 1] = 185;
        row[idx + 2] = 129;
        row[idx + 3] = 255;
      }

      // Target glowing dot at (0.85, 0.30)
      const dotDist = Math.sqrt((px - 0.85) * (px - 0.85) + (py - 0.30) * (py - 0.30));
      if (dotDist < 0.04) {
        row[idx] = 56;
        row[idx + 1] = 189;
        row[idx + 2] = 248; // Sky blue
        row[idx + 3] = 255;
      }
      if (dotDist < 0.02) {
        row[idx] = 255;
        row[idx + 1] = 255;
        row[idx + 2] = 255; // White center
        row[idx + 3] = 255;
      }

      // Gold coin badge at (0.75, 0.70)
      const coinDist = Math.sqrt((px - 0.72) * (px - 0.72) + (py - 0.68) * (py - 0.68));
      if (coinDist < 0.12) {
        row[idx] = 245;
        row[idx + 1] = 158;
        row[idx + 2] = 11; // Gold amber
        row[idx + 3] = 255;
      }
      if (coinDist < 0.10) {
        row[idx] = 251;
        row[idx + 1] = 191;
        row[idx + 2] = 36; // Lighter gold
        row[idx + 3] = 255;
      }
    }
    rawRows.push(row);
  }

  const rawBuffer = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawBuffer, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

// Generate all standard PWA icons
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, false));

console.log('Successfully generated all PWA icons in /public!');
