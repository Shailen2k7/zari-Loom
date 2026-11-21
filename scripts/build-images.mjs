// Image pipeline: assets/photos/*.jpeg -> public/products/*.webp (+ src/data/media.json)
// Rules: never crop a product photo, keep the natural aspect ratio, compress to WebP.
// Composite model shots (one main panel + close-up panels separated by white lines)
// are split along those white lines so each panel becomes its own gallery image.
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "assets/photos";
const OUT = "public/products";
const WIDTHS = [480, 800, 1200];
// Photos that are composites (main shot + close-up panels)
const COMPOSITES = new Set(["p01", "p02", "p03", "p04", "p05", "p06", "p07", "p08", "p09", "n32", "n33", "n34", "n35", "n36", "n37"]);

async function raw(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, c: info.channels };
}

// fraction of near-white pixels along a column (x) between rows y0..y1
function colWhite(img, x, y0, y1) {
  let n = 0;
  for (let y = y0; y < y1; y++) {
    const i = (y * img.w + x) * img.c;
    if (img.data[i] > 238 && img.data[i + 1] > 238 && img.data[i + 2] > 238) n++;
  }
  return n / (y1 - y0);
}
function rowWhite(img, y, x0, x1) {
  let n = 0;
  for (let x = x0; x < x1; x++) {
    const i = (y * img.w + x) * img.c;
    if (img.data[i] > 215 && img.data[i + 1] > 215 && img.data[i + 2] > 215) n++;
  }
  return n / (x1 - x0);
}
// group consecutive indices into [start,end] bands
function bands(idx) {
  const out = [];
  for (const i of idx) {
    const last = out[out.length - 1];
    if (last && i - last[1] <= 2) last[1] = i;
    else out.push([i, i]);
  }
  return out;
}

async function splitComposite(file) {
  const img = await raw(file);
  const cols = [];
  for (let x = Math.floor(img.w * 0.45); x < Math.floor(img.w * 0.85); x++)
    if (colWhite(img, x, 0, img.h) > 0.88) cols.push(x);
  const vb = bands(cols);
  if (!vb.length) return [{ left: 0, top: 0, width: img.w, height: img.h }];
  const [vx0, vx1] = vb[0];
  const panels = [{ left: 0, top: 0, width: vx0, height: img.h }];
  const rx = vx1 + 1;
  const rows = [];
  for (let y = Math.floor(img.h * 0.1); y < Math.floor(img.h * 0.95); y++)
    if (rowWhite(img, y, rx + 4, img.w - 4) > 0.92) rows.push(y);
  let top = 0;
  for (const [y0, y1] of bands(rows)) {
    if (y0 - top > 60) panels.push({ left: rx, top, width: img.w - rx, height: y0 - top });
    top = y1 + 1;
  }
  if (img.h - top > 60) panels.push({ left: rx, top, width: img.w - rx, height: img.h - top });
  return panels;
}

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
const manifest = {};
for (const f of files) {
  const id = path.parse(f).name;
  const file = path.join(SRC, f);
  const meta = await sharp(file).metadata();
  const panels = COMPOSITES.has(id)
    ? await splitComposite(file)
    : [{ left: 0, top: 0, width: meta.width, height: meta.height }];
  manifest[id] = [];
  for (let p = 0; p < panels.length; p++) {
    const key = `${id}-${"abcdef"[p]}`;
    const box = panels[p];
    const widths = WIDTHS.filter((w) => w < box.width).concat(box.width <= 1200 ? [box.width] : []);
    for (const w of widths) {
      await sharp(file).extract(box).resize({ width: w }).webp({ quality: 80, effort: 5 }).toFile(path.join(OUT, `${key}-${w}.webp`));
    }
    manifest[id].push({ key, width: box.width, height: box.height, widths });
  }
  // Composites also get the whole, unsplit picture as a "cover" for product cards (2:3, nothing cut).
  if (COMPOSITES.has(id)) {
    const key = `${id}-full`;
    const widths = WIDTHS.filter((w) => w < meta.width).concat(meta.width <= 1200 ? [meta.width] : []);
    for (const w of widths) await sharp(file).resize({ width: w }).webp({ quality: 80, effort: 5 }).toFile(path.join(OUT, `${key}-${w}.webp`));
    manifest[`${id}~cover`] = [{ key, width: meta.width, height: meta.height, widths }];
  }
  console.log(id, panels.map((b) => `${b.width}x${b.height}`).join("  "));
}
await writeFile("src/data/media.json", JSON.stringify(manifest, null, 1));
