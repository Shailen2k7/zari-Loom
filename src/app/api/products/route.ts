import { NextResponse } from "next/server";
import { listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

// Small public list used by the bag, wishlist and account pages.
export async function GET() {
  const products = await listProducts();
  return NextResponse.json(
    products.map((p) => ({
      code: p.code, name: p.name, category: p.category, colour: p.colour, weave: p.weave,
      price: p.price, stock: p.stock, media: p.media.slice(0, 1),
    })),
  );
}
