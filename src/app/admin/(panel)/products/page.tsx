import { ProductBoard } from "@/components/admin/ProductBoard";
import { QuickAdd } from "@/components/admin/QuickAdd";
import { aiEnabled } from "@/lib/ai";
import { listProducts } from "@/lib/store";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const all = await listProducts({ includeHidden: true });
  const live = all.filter((p) => p.status === "live").length;
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-amber">Catalogue</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">Your pieces</h1>
          <p className="mt-2 text-sm text-muted">{live} live on the store · {all.length - live} hidden or sold</p>
        </div>
      </header>
      <QuickAdd aiOn={aiEnabled} />
      <ProductBoard products={all} startStatus={status} />
    </div>
  );
}
