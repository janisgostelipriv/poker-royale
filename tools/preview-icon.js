// Prueft die erzeugten PNGs und gibt eine grobe ASCII-Vorschau aus.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function decode(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('kein PNG');
  let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 2 ? 3 : colorType === 6 ? 4 : 1;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    for (let x = 0; x < stride; x++) {
      const rawVal = raw[p++];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let val;
      switch (filter) {
        case 0: val = rawVal; break;
        case 1: val = rawVal + a; break;
        case 2: val = rawVal + b; break;
        case 3: val = rawVal + ((a + b) >> 1); break;
        case 4: {
          const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
          val = rawVal + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break;
        }
        default: throw new Error('Filter ' + filter);
      }
      out[y * stride + x] = val & 0xff;
    }
  }
  return { width, height, bpp, stride, px: out, bitDepth, colorType };
}

const files = process.argv.slice(2);
for (const f of files) {
  const img = decode(f);
  console.log(`\n${path.basename(f)}  ${img.width}x${img.height}  colorType=${img.colorType} bitDepth=${img.bitDepth}`);
  const N = 32;
  let lines = [];
  for (let y = 0; y < N; y++) {
    let line = '';
    for (let x = 0; x < N; x++) {
      const sx = Math.floor(x * img.width / N), sy = Math.floor(y * img.height / N);
      const i = sy * img.stride + sx * img.bpp;
      const r = img.px[i], g = img.px[i + 1], b = img.px[i + 2];
      const lum = (r * 0.299 + g * 0.587 + b * 0.114);
      const green = g > r + 30 && g > b + 30;
      line += lum > 180 ? '#' : green ? (lum > 90 ? 'O' : 'o') : lum > 40 ? '.' : ' ';
    }
    lines.push(line);
  }
  console.log(lines.join('\n'));
}

