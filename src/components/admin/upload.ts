"use client";
import type { Product } from "@/lib/types";

/** Shrink big phone photos in the browser before upload: much faster on mobile data. Never crops. */
export async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2_500_000) return file;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.9));
  } catch {
    return file;
  }
}

export type UploadResult = { product: Product; ai?: boolean; aiEnabled?: boolean; ms: number };

/**
 * Send one photo. Without `code` it becomes a new draft piece (the AI writes the listing);
 * with `code` it is added to that piece. `onSent` fires once the bytes have left the browser.
 */
export async function uploadPhoto(
  file: File, opts: { code?: string; onProgress?: (pct: number) => void; onSent?: () => void } = {},
): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", await shrink(file), file.name.replace(/\.\w+$/, "") + ".jpg");
  if (opts.code) body.append("code", opts.code);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/quick-add");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.upload.onload = () => { opts.onProgress?.(100); opts.onSent?.(); };
    xhr.onload = () => {
      const json = xhr.response ?? {};
      if (xhr.status >= 200 && xhr.status < 300) resolve(json as UploadResult);
      else reject(new Error(json.error || (xhr.status === 401 ? "Please sign in again." : "Upload failed. Try again.")));
    };
    xhr.onerror = () => reject(new Error("No connection. Check the internet and try again."));
    xhr.send(body);
  });
}
