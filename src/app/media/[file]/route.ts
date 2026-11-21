// Serves photos uploaded from the dashboard in local demo mode (.data/uploads).
// With Supabase connected, photos are served from Supabase Storage instead.
import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[\w-]+\.webp$/.test(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
