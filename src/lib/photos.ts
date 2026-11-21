// Turn one uploaded photo into web-ready WebP sizes. Never crops: only scales, keeping the natural shape.
import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";
import { savePhotoFiles } from "./store";
import type { Media } from "./types";

const WIDTHS = [480, 800, 1200];
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export type Prepared = { upright: Buffer; width: number; height: number; forAi: Buffer };

/** Step 1 (fast): turn the photo upright and make a small JPEG for the AI to read. */
export async function preparePhoto(input: Buffer): Promise<Prepared> {
  // .rotate() applies the phone's EXIF orientation so portrait shots stay portrait.
  const { data: upright, info } = await sharp(input, { failOn: "error", limitInputPixels: 60_000_000 }).rotate()
    .resize({ width: 2000, height: 2400, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const forAi = await sharp(upright).resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  return { upright, width: info.width, height: info.height, forAi };
}

/** Step 2: make the WebP sizes and store them. Runs while the AI is reading the photo. */
export async function savePhoto({ upright, width, height }: Prepared): Promise<Media> {
  const widths = WIDTHS.filter((w) => w < width).concat(width <= 1200 ? [width] : []);
  const files = await Promise.all(widths.map(async (w) => ({
    width: w,
    data: await sharp(upright).resize({ width: w }).webp({ quality: 80, effort: 4 }).toBuffer(),
  })));
  const key = `u${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const url = await savePhotoFiles(key, files);
  return { url, type: "photo", width, height, widths };
}
