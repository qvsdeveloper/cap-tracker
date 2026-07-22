// Generates simple CAP-themed PNG icons (navy background, gold delta-wing
// silhouette) with zero dependencies, since this machine has no image
// libraries installed. Pure pixel buffer -> PNG chunk encoder.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const CAP_BLUE = [0x0d, 0x2b, 0x55];
const CAP_GOLD = [0xc9, 0xa2, 0x27];

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size, pixelFn) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Delta-wing "plane" silhouette: a triangle pointing up plus a horizontal
// stabilizer bar, roughly centered, scaled to the icon size.
function pixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / w; // -0.5..0.5
  const ny = (y - cy) / h;

  // Fuselage + wings: a triangle with apex at top.
  const apexY = -0.32;
  const baseY = 0.30;
  const halfWidthAtY = (yy) => {
    const t = (yy - apexY) / (baseY - apexY);
    return t <= 0 ? 0 : 0.34 * Math.min(t, 1);
  };
  const inWing = ny >= apexY && ny <= baseY && Math.abs(nx) <= halfWidthAtY(ny);

  // Tail stabilizer bar near the base.
  const inTail = ny >= 0.20 && ny <= 0.30 && Math.abs(nx) <= 0.20;

  // Vertical fuselage stripe.
  const inFuselage = ny >= apexY && ny <= 0.34 && Math.abs(nx) <= 0.045;

  if (inWing || inTail || inFuselage) {
    return [...CAP_GOLD, 255];
  }
  return [...CAP_BLUE, 255];
}

for (const size of [192, 512]) {
  const png = makePng(size, pixel);
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), png);
  console.log(`Wrote icon-${size}.png (${png.length} bytes)`);
}
