"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { quickSave, savePhotos, type QuickFields } from "@/app/admin/actions";
import { categories, colourFamilies, delivery, occasions, site } from "@/config/site";
import { inr, mediaSrc, stockLabel } from "@/lib/format";
import { productHref } from "@/lib/seo";
import type { Media, Product, ProductStatus } from "@/lib/types";
import { uploadPhoto } from "./upload";

const chip = (on: boolean) =>
  `inline-flex min-h-8 items-center rounded-full border px-3 text-[0.8125rem] font-medium transition ${
    on ? "border-peacock bg-peacock text-white" : "border-line bg-white text-ink hover:border-peacock"}`;

const fieldsOf = (p: Product): QuickFields => ({
  name: p.name, price: p.price, stock: p.stock, category: p.category, colour: p.colour, colourHex: p.colourHex,
  colourFamily: p.colourFamily, weave: p.weave, occasion: p.occasion, description: p.description,
  featured: p.featured, silkMark: p.silkMark, status: p.status,
});

/** Types text out once, for the first reveal of an AI draft. */
function TypeOut({ text, run }: { text: string; run: boolean }) {
  const first = useRef(run);
  const [n, setN] = useState(run ? 0 : text.length);
  useEffect(() => {
    if (!first.current) return setN(text.length);
    first.current = false;
    let i = 0;
    const t = setInterval(() => { i += Math.max(1, Math.round(text.length / 28)); setN(Math.min(i, text.length)); if (i >= text.length) clearInterval(t); }, 28);
    return () => clearInterval(t);
  }, [text, run]);
  return <span className={n < text.length ? "caret" : ""}>{text.slice(0, n)}</span>;
}

function Section({ title, hint, children, delay = 0, reveal }: { title: string; hint?: string; children: React.ReactNode; delay?: number; reveal: boolean }) {
  return (
    <section className={`rounded-xl bg-white p-4 ring-1 ring-line ${reveal ? "fade-up" : ""}`} style={reveal ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

type Pending = { id: string; preview: string; pct: number; error?: string };

/** Photos: add more at any time, reorder, choose the cover, remove. Saves straight away. */
function PhotoManager({ code, media, setMedia }: { code: string; media: Media[]; setMedia: (m: Media[]) => void }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [msg, setMsg] = useState("");
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function persist(next: Media[], before: Media[]) {
    setMedia(next);
    const r = await savePhotos(code, next.map((m) => m.url));
    if ("error" in r) { setMedia(before); setMsg(r.error); } else setMsg("");
  }
  const move = (i: number, to: number) => {
    if (to < 0 || to >= media.length) return;
    const next = [...media];
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m);
    persist(next, media);
  };
  const remove = (i: number) => {
    if (media.length === 1) return setMsg("A piece needs at least one photo. Add another before removing this one.");
    persist(media.filter((_, k) => k !== i), media);
  };

  async function add(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    for (const f of imgs) {
      const id = Math.random().toString(36).slice(2);
      setPending((xs) => [...xs, { id, preview: URL.createObjectURL(f), pct: 0 }]);
      try {
        const r = await uploadPhoto(f, { code, onProgress: (pct) => setPending((xs) => xs.map((x) => (x.id === id ? { ...x, pct } : x))) });
        setMedia(r.product.media);
        setPending((xs) => xs.filter((x) => x.id !== id));
      } catch (e) {
        setPending((xs) => xs.map((x) => (x.id === id ? { ...x, error: (e as Error).message } : x)));
      }
    }
  }

  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); add([...e.dataTransfer.files]); }}
      className={`rounded-xl transition ${over ? "bg-marigold/15 ring-2 ring-marigold" : ""}`}>
      <ul className="grid grid-cols-3 gap-2 @sm:grid-cols-4 @md:grid-cols-6 @2xl:grid-cols-8">
        {media.map((m, i) => (
          <li key={m.url} className="pop-in group relative">
            <span className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-tint ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaSrc(m, 480)} alt="" className="max-h-full max-w-full object-contain" />
            </span>
            {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-deep px-1.5 py-px text-[0.625rem] font-semibold text-marigold">Cover</span>}
            <span className="absolute inset-x-1 bottom-1 flex justify-between gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <span className="flex gap-0.5">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left" className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-xs shadow disabled:opacity-40">←</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === media.length - 1} aria-label="Move right" className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-xs shadow disabled:opacity-40">→</button>
              </span>
              <span className="flex gap-0.5">
                {i > 0 && <button type="button" onClick={() => move(i, 0)} aria-label="Make this the cover photo" title="Make cover" className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-xs text-amber shadow">★</button>}
                <button type="button" onClick={() => remove(i)} aria-label="Remove photo" className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-xs text-rose shadow">✕</button>
              </span>
            </span>
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.id} className="pop-in relative">
            <span className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-tint ring-1 ring-marigold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="max-h-full max-w-full object-contain opacity-60" />
              {!p.error && <span aria-hidden className="ai-scan absolute inset-0" />}
              <span className="absolute inset-x-2 bottom-2">
                {p.error ? <span className="block rounded bg-white/95 p-1.5 text-[0.6875rem] font-medium text-rose">{p.error}</span> : (
                  <span className="block h-1.5 overflow-hidden rounded-full bg-white/70">
                    <span className="progress-stripes block h-full rounded-full bg-peacock transition-[width] duration-300" style={{ width: `${Math.max(6, p.pct)}%` }} />
                  </span>
                )}
              </span>
            </span>
            {p.error && <button type="button" onClick={() => setPending((xs) => xs.filter((x) => x.id !== p.id))} className="mt-1 text-xs underline">Dismiss</button>}
          </li>
        ))}
        <li>
          <button type="button" onClick={() => input.current?.click()}
            className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-line bg-mist text-center text-sm font-medium text-peacock transition hover:border-peacock hover:bg-white">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-base ring-1 ring-line">+</span>
            <span className="px-1 text-[0.6875rem] leading-tight">Add photos</span>
          </button>
        </li>
      </ul>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add([...(e.target.files ?? [])]); e.target.value = ""; }} />
      {msg && <p role="alert" className="mt-2 text-sm text-rose">{msg}</p>}
    </div>
  );
}

/** What shoppers will see: the product page, as you type. */
function StorePreview({ p, f, media, reveal }: { p: Product; f: QuickFields; media: Media[]; reveal: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { if (shown >= media.length) setShown(0); }, [media.length, shown]);
  const cover = media[shown] ?? media[0];
  const cat = categories.find((c) => c.slug === f.category);
  const href = productHref({ code: p.code, name: f.name || "piece" });
  const title = `${f.name}${f.colour && !f.name.toLowerCase().includes(f.colour.toLowerCase()) ? ` in ${f.colour}` : ""} · Banarasi ${cat?.singular ?? "piece"}`;
  return (
    <div className="overflow-hidden rounded-xl bg-mist ring-1 ring-line">
      <div className="flex items-center gap-1.5 border-b border-line bg-white px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#f2b8b5]" /><span className="h-2.5 w-2.5 rounded-full bg-[#f3d9a4]" /><span className="h-2.5 w-2.5 rounded-full bg-[#bfe0c9]" />
        <span className="ml-2 min-w-0 truncate rounded-full bg-mist px-3 py-1 text-[0.6875rem] text-muted">{site.url.replace(/^https?:\/\//, "")}{href}</span>
      </div>
      <div className="p-3.5">
        {cover ? (
          <div className="flex aspect-[4/5] max-h-[360px] items-center justify-center overflow-hidden rounded-lg bg-tint">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={cover.url} src={mediaSrc(cover, 800)} alt="" className="fade-up max-h-full max-w-full object-contain" />
          </div>
        ) : <div className="aspect-[4/5] rounded-lg bg-tint" />}
        {media.length > 1 && (
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {media.map((m, i) => (
              <button key={m.url} type="button" onClick={() => setShown(i)} aria-label={`Photo ${i + 1}`}
                className={`h-14 w-11 shrink-0 overflow-hidden rounded ring-2 ${i === shown ? "ring-peacock" : "ring-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaSrc(m, 480)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <p className="label mt-4 text-[0.6875rem] text-amber">{cat?.singular} · Code {p.code} · {site.currentDrop.label}</p>
        <h4 className="display mt-1 text-[1.35rem] leading-tight"><TypeOut text={f.name || "Untitled piece"} run={reveal} /></h4>
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
          {[f.weave, f.colour, ...(f.silkMark ? ["Silk Mark certified"] : [])].filter(Boolean).map((t) => (
            <span key={t} className="rounded-full border border-line bg-white px-2.5 py-1">{t}</span>
          ))}
          <span className={`rounded-full px-2.5 py-1 font-semibold ${f.stock > 0 ? "bg-deep text-cream" : "bg-rose text-white"}`}>{stockLabel(f.stock)}</span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{f.description || "Add a description."}</p>
        <p className="display mt-3 text-2xl">{inr(f.price || 0)} <span className="font-sans text-xs font-normal text-muted">incl. all taxes</span></p>
        <div className="mt-3 grid gap-2">
          <span className="btn btn-primary pointer-events-none w-full !min-h-9 !py-1.5 text-xs">Add to bag</span>
          <span className="btn btn-wa pointer-events-none w-full !min-h-9 !py-1.5 text-xs">Buy on WhatsApp</span>
        </div>
        <p className="mt-3 text-xs text-muted">Ships next working day · 3 to 6 days · Free above {inr(delivery.freeShippingAbove)} · 7-day returns</p>
      </div>
      <div className="border-t border-line bg-white p-4">
        <p className="text-[0.6875rem] font-semibold text-muted">On Google</p>
        <p className="mt-1 truncate text-xs text-[#1a7f37]">{site.url.replace(/^https?:\/\//, "")} › product</p>
        <p className="truncate text-[0.9375rem] text-[#1a0dab]">{title} | {site.brand}</p>
        <p className="line-clamp-2 text-xs text-muted">{f.description.slice(0, 158)}</p>
      </div>
    </div>
  );
}

/** Gold burst and a drawn tick: the moment a piece goes live. */
function LiveBurst() {
  const sparks = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const d = 46 + (i % 3) * 14;
    return { x: `${Math.cos(a) * d}px`, y: `${Math.sin(a) * d}px`, c: i % 2 ? "#e9a23b" : "#0f4443", delay: (i % 4) * 30 };
  }), []);
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center">
      {sparks.map((s, i) => (
        <span key={i} className="spark" style={{ ["--x" as string]: s.x, ["--y" as string]: s.y, background: s.c, animationDelay: `${s.delay}ms` }} />
      ))}
      <span className="pop-in grid h-11 w-11 place-items-center rounded-full bg-peacock text-white shadow-lg">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path className="draw-check" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </span>
  );
}

/**
 * The whole listing on one screen: photos, every field, and a live preview of the store page.
 * Used for fresh AI drafts and for editing pieces already in the catalogue.
 */
export function ListingStudio({ product, onSaved, reveal = false }: {
  product: Product; onSaved?: (p: Product) => void; reveal?: boolean;
}) {
  const [f, setF] = useState<QuickFields>(() => fieldsOf(product));
  const [saved, setSaved] = useState<QuickFields>(() => fieldsOf(product));
  const [media, setMediaState] = useState<Media[]>(product.media);
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [justLive, setJustLive] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => setMediaState(product.media), [product.media]);
  const setMedia = (m: Media[]) => { setMediaState(m); onSaved?.({ ...product, ...f, media: m, status, category: f.category as Product["category"] }); };
  const set = <K extends keyof QuickFields>(k: K, v: QuickFields[K]) => { setF((x) => ({ ...x, [k]: v })); setMsg(null); };
  const dirty = JSON.stringify({ ...f, status: 0 }) !== JSON.stringify({ ...saved, status: 0 });

  function save(next: ProductStatus) {
    start(async () => {
      const r = await quickSave(product.code, { ...f, status: next });
      if ("error" in r) { setMsg({ ok: false, text: r.error }); return; }
      const wasLive = status === "live";
      setStatus(r.status);
      setSaved({ ...f, status: r.status });
      setJustLive(r.status === "live" && !wasLive);
      setMsg(r.status === "live" ? (wasLive ? { ok: true, text: "Changes are live on the store." } : null) : { ok: true, text: r.status === "draft" ? "Saved as a draft. Only you can see it." : "Saved." });
      onSaved?.({ ...product, ...f, media, status: r.status, category: f.category as Product["category"] });
    });
  }

  const live = status === "live";
  const url = productHref({ code: product.code, name: saved.name });
  const steps = [
    { label: "Photos", done: media.length > 0 },
    { label: "Name and price", done: Boolean(f.name.trim()) && f.price > 0 },
    { label: "Details", done: Boolean(f.colour && f.weave && f.occasion.length) },
    { label: "Description", done: f.description.trim().length >= 60 },
  ];
  const ready = steps.filter((s) => s.done).length;

  return (
    <div className="@container">
    <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_300px] @6xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
        <Section title="Photos" hint="First photo is the cover. Add more any time." reveal={reveal} delay={0}>
          <PhotoManager code={product.code} media={media} setMedia={setMedia} />
        </Section>

        <Section title="Title and price" reveal={reveal} delay={90}>
          <div className="grid grid-cols-2 gap-3 @lg:grid-cols-[1fr_150px_120px]">
            <label className="col-span-2 block @lg:col-span-1">
              <span className="field-label flex justify-between">Title <span className="font-normal">{f.name.length}/80</span></span>
              <input value={f.name} onChange={(e) => set("name", e.target.value)} className="field font-medium" maxLength={80} />
            </label>
            <label className="block">
              <span className="field-label">Price (₹)</span>
              <input value={f.price || ""} onChange={(e) => set("price", Number(e.target.value.replace(/\D/g, "")))} inputMode="numeric" className="field font-semibold" />
            </label>
            <label className="block">
              <span className="field-label">Stock</span>
              <span className="flex">
                <button type="button" onClick={() => set("stock", Math.max(0, f.stock - 1))} className="h-[42px] w-9 rounded-l-xl border border-line bg-white text-lg" aria-label="One less">−</button>
                <input value={f.stock} onChange={(e) => set("stock", Number(e.target.value.replace(/\D/g, "")) || 0)} inputMode="numeric" className="field !rounded-none !border-x-0 !px-1 text-center" aria-label="Stock" />
                <button type="button" onClick={() => set("stock", f.stock + 1)} className="h-[42px] w-9 rounded-r-xl border border-line bg-white text-lg" aria-label="One more">+</button>
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs text-muted">Shoppers see {inr(f.price || 0)}, all taxes included. {f.stock === 1 ? "Shown as “1 of 1”." : ""}</p>
        </Section>

        <Section title="What it is" reveal={reveal} delay={180}>
          <span className="field-label">Category</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => <button key={c.slug} type="button" onClick={() => set("category", c.slug)} className={chip(f.category === c.slug)}>{c.singular}</button>)}
          </div>
          <div className="mt-4 grid gap-3 @md:grid-cols-2">
            <label className="block">
              <span className="field-label">Colour name</span>
              <span className="flex items-center gap-2">
                <input type="color" value={f.colourHex} onChange={(e) => set("colourHex", e.target.value)} className="h-[42px] w-[42px] shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1" aria-label="Colour swatch" />
                <input value={f.colour} onChange={(e) => set("colour", e.target.value)} className="field" placeholder="e.g. Rani pink" />
              </span>
            </label>
            <label className="block">
              <span className="field-label">Weave or motif</span>
              <input value={f.weave} onChange={(e) => set("weave", e.target.value)} className="field" placeholder="e.g. Zari buti" />
            </label>
          </div>
          <span className="field-label mt-4">Colour family <span className="font-normal">(for the colour filter)</span></span>
          <div className="flex flex-wrap gap-2">
            {colourFamilies.map((c) => (
              <button key={c.slug} type="button" onClick={() => set("colourFamily", c.slug)} className={chip(f.colourFamily === c.slug)}>
                <span className="mr-2 h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />{c.label}
              </button>
            ))}
          </div>
          <span className="field-label mt-4">Occasions</span>
          <div className="flex flex-wrap gap-2">
            {occasions.map((o) => {
              const on = f.occasion.includes(o.slug);
              return <button key={o.slug} type="button" aria-pressed={on} className={chip(on)} onClick={() => set("occasion", on ? f.occasion.filter((x) => x !== o.slug) : [...f.occasion, o.slug])}>{o.label}</button>;
            })}
          </div>
        </Section>

        <Section title="Description" hint={`${f.description.length}/1200`} reveal={reveal} delay={270}>
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} className="field leading-relaxed" maxLength={1200} />
          <p className="mt-2 text-xs text-muted">Describe what you can see: colour, motifs, border, pallu. Write “pure silk” or “handloom” only for Silk Mark pieces.</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-5 w-5 accent-[#0f4443]" /> Feature on homepage
            </label>
            <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" checked={f.silkMark} onChange={(e) => set("silkMark", e.target.checked)} className="h-5 w-5 accent-[#0f4443]" /> Silk Mark certified
            </label>
          </div>
        </Section>
      </div>

      <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 @4xl:sticky @4xl:top-4 @4xl:self-start">
        <div className={`rounded-xl bg-white p-4 ring-1 ring-line ${reveal ? "fade-up" : ""}`} style={reveal ? { animationDelay: "120ms" } : undefined}>
          {justLive ? (
            <div className="pop-in flex items-center gap-4" role="status">
              <LiveBurst />
              <div className="min-w-0">
                <p className="display text-xl leading-tight">Live on the store</p>
                <p className="mt-0.5 text-sm text-muted">Shoppers can buy it now.</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                  <a href={url} target="_blank" rel="noopener" className="text-peacock underline underline-offset-4">View it ↗</a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`New in: ${saved.name}, ${inr(saved.price)}\n${site.url}${url}`)}`} target="_blank" rel="noopener noreferrer" className="text-wa underline underline-offset-4">Share on WhatsApp ↗</a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-[#e3f1e8] text-[#17613a]" : status === "sold_out" ? "bg-rose/10 text-rose" : "bg-marigold/25 text-amber"}`}>
                  <span className={`h-2 w-2 rounded-full ${live ? "bg-[#2fa866] pulse-ring" : status === "sold_out" ? "bg-rose" : "bg-marigold"}`} />
                  {live ? "Live" : status === "sold_out" ? "Sold out" : "Draft · only you can see it"}
                </span>
                <span className="text-xs text-muted">{ready}/4 ready</span>
              </div>
              <ol className="mt-3 grid grid-cols-4 gap-1.5">
                {steps.map((s) => (
                  <li key={s.label}>
                    <span className={`block h-1.5 rounded-full transition-colors duration-500 ${s.done ? "bg-peacock" : "bg-line"}`} />
                    <span className={`mt-1 block text-[0.6875rem] leading-tight ${s.done ? "text-ink" : "text-muted"}`}>{s.label}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${msg.ok ? "bg-tint text-peacock" : "bg-rose/10 text-rose"}`}>{msg.text}</p>}

          <div className="mt-4 grid gap-2">
            {live ? (
              <>
                <button type="button" disabled={pending || !dirty} onClick={() => save("live")} className="btn btn-primary w-full">
                  {pending ? "Saving…" : dirty ? "Save changes" : "All changes saved"}
                </button>
                <div className="flex items-center justify-between gap-2">
                  <button type="button" disabled={pending} onClick={() => save("draft")} className="min-h-10 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline">Hide from store</button>
                  {!justLive && <a href={url} target="_blank" rel="noopener" className="text-sm font-medium text-peacock underline underline-offset-4">View on store ↗</a>}
                </div>
              </>
            ) : (
              <>
                <button type="button" disabled={pending} onClick={() => save("live")}
                  className={`btn btn-gold relative w-full overflow-hidden ${pending ? "progress-stripes" : ""}`}>
                  {pending ? "Going live…" : "Publish to the store"}
                </button>
                <button type="button" disabled={pending} onClick={() => save("draft")} className="btn btn-ghost w-full">{dirty ? "Save draft" : "Keep as draft"}</button>
              </>
            )}
          </div>
          {dirty && !pending && <p className="mt-2 text-center text-xs text-amber">You have unsaved changes</p>}
        </div>

        <div className={reveal ? "fade-up" : ""} style={reveal ? { animationDelay: "200ms" } : undefined}>
          <p className="mb-2 px-1 text-xs font-semibold text-muted">Live preview</p>
          <StorePreview p={product} f={f} media={media} reveal={reveal} />
        </div>
      </aside>
    </div>
    </div>
  );
}

export function Thumb({ p, className = "" }: { p: Product; className?: string }) {
  const m = p.media[0];
  if (!m) return <span className={`block aspect-[3/4] rounded-lg bg-tint ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaSrc(m, 480)} width={m.width} height={m.height} alt="" loading="lazy" className={`block h-auto w-full rounded-lg ${className}`} />;
}
