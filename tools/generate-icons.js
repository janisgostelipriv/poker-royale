/**
 * Erzeugt die PWA-Icons (reines Node, keine Dependencies).
 * Aufruf:  node tools/generate-icons.js
 * Motiv:   dunkler Hintergrund + gruener Chip + Pik-Symbol
 *
 * Ergebnis: icons/icon-192.png, icon-512.png, icon-512-maskable.png,
 *           icons/apple-touch-icon-180.png
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'icons');

const BG = [11, 18, 32];       // #0b1220
const CHIP = [34, 197, 94];    // #22c55e
const CHIP_DARK = [22, 101, 52];
const INK = [8, 14, 25];

/* ---------- PNG schreiben ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.slice(4, 8 + data.length)), 8 + data.length);
  return out;
}

function writePng(file, size, rgb) {
  const stride = size * 3;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // Filter: none
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

/* ---------- Motiv ---------- */
// Pik-Symbol in normalisierten Koordinaten (-1..1, y nach unten)
function inSpade(x, y) {
  // Spitze oben + zwei Lappen
  const tri = pointInTriangle(x, y, 0, -1, -0.95, 0.18, 0.95, 0.18);
  const lobeL = Math.hypot(x + 0.48, y - 0.16) <= 0.5;
  const lobeR = Math.hypot(x - 0.48, y - 0.16) <= 0.5;
  // Stiel
  const stem = y >= 0.1 && y <= 0.88 && Math.abs(x) <= 0.07 + (y - 0.1) * 0.42;
  return tri || lobeL || lobeR || stem;
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * Farbe eines Punktes (Koordinaten -1..1, Mitte = 0/0).
 * scale: Groesse des Motivs (maskable -> kleiner wegen Safe Zone)
 */
function colorAt(nx, ny, scale) {
  const d = Math.hypot(nx, ny);
  const chipR = 0.95 * scale;
  const ringR = 0.78 * scale;

  if (d > chipR) return BG;

  // Chip-Rand mit 8 helleren Segmenten
  if (d > ringR) {
    const ang = Math.atan2(ny, nx) + Math.PI;
    const seg = Math.floor(ang / (Math.PI / 8));
    return seg % 2 === 0 ? CHIP : CHIP_DARK;
  }

  // Innenflaeche + Pik
  const s = 0.62 * scale;
  if (inSpade(nx / s, (ny + 0.02 * scale) / s)) return INK;
  return CHIP;
}

function render(size, scale) {
  const rgb = Buffer.alloc(size * size * 3);
  const SS = 3; // 3x3 Supersampling fuer weiche Kanten
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const nx = ((x + (sx + 0.5) / SS) / size) * 2 - 1;
          const ny = ((y + (sy + 0.5) / SS) / size) * 2 - 1;
          const c = colorAt(nx, ny, scale);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 3;
      rgb[i] = Math.round(r / n);
      rgb[i + 1] = Math.round(g / n);
      rgb[i + 2] = Math.round(b / n);
    }
  }
  return rgb;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ['icon-192.png', 192, 0.86],
  ['icon-512.png', 512, 0.86],
  ['icon-512-maskable.png', 512, 0.62], // Motiv innerhalb der Safe Zone (80 %)
  ['apple-touch-icon-180.png', 180, 0.84],
];

for (const [name, size, scale] of targets) {
  writePng(path.join(OUT_DIR, name), size, render(size, scale));
  console.log('erzeugt: icons/' + name + '  ' + size + 'x' + size);
}

