import { productHref } from "@/lib/seo";
import Link from "next/link";
import { DropGrid } from "@/components/DropGrid";
import { Arrow, Eye, Home as HomeIcon, Loom, Return, WhatsApp } from "@/components/Icons";
import { HeroLooks, type Look } from "@/components/HeroLooks";
import { Photo } from "@/components/Photo";
import { occasions, site } from "@/config/site";
import { cardMedia, inr, stockLabel, waLink } from "@/lib/format";
import { listProducts } from "@/lib/store";
import type { Product } from "@/lib/types";
import { homeJsonLd, JsonLd } from "@/lib/seo";

export const revalidate = 60;

// The homepage only ever shows pieces photographed on a model.
const byPhoto = (all: Product[], id: string) => all.find((p) => p.media[0]?.url.startsWith(`/products/${id}-`));

function Kicker({ children, light = false, center = false }: { children: React.ReactNode; light?: boolean; center?: boolean }) {
  return (
    <p className={`label flex items-center gap-3 ${center ? "justify-center" : ""} ${light ? "text-marigold" : "text-amber"}`}>
      <span className="h-px w-10 bg-current opacity-70" />
      {children}
      {center && <span className="h-px w-10 bg-current opacity-70" />}
    </p>
  );
}

/** A horizontal lookbook rail. Every photo keeps its own shape: fixed height, natural width. */
function Rail({ items, light = false, caption = true }: { items: Product[]; light?: boolean; caption?: boolean }) {
  return (
    <div className="rail no-scrollbar flex snap-x gap-4 overflow-x-auto pb-3 sm:gap-6">
      {items.map((p) => (
        <Link key={p.code} href={productHref(p)} className="group shrink-0 snap-start">
          <span className="block overflow-hidden">
            <Photo m={cardMedia(p)} alt={`Model wearing the ${p.name}`} want={480} sizes="300px"
              className="h-[340px] !w-auto transition duration-700 group-hover:scale-[1.03] sm:h-[420px]" />
          </span>
          {caption && (
            <span className="mt-2.5 block max-w-[260px]">
              <span className={`display block text-lg leading-snug ${light ? "text-cream group-hover:text-marigold" : "group-hover:text-peacock"}`}>{p.name}</span>
              <span className={`text-sm ${light ? "text-cream/65" : "text-muted"}`}>{inr(p.price)}{p.stock <= 1 ? " · One of one" : ""}</span>
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const everything = await listProducts();
  // Newest first, so a piece added from the dashboard shows at the front of every row.
  const all = everything.filter((p) => p.onModel).sort((a, b) => Number(b.code) - Number(a.code));

  const heroMain = byPhoto(all, "n04") ?? all[0];
  // Hero looks: pairs of 2:3 model photos (a saree with an Anarkali or a set).
  const heroPairs: Look[][] = [["n04", "n27"], ["n02", "n26"], ["n08", "n29"], ["n12", "n23"], ["n07", "n22"]]
    .map((pair) => pair.map((id) => byPhoto(all, id)).filter((p): p is Product => Boolean(p))
      .map((p) => ({ media: p.media[0], name: p.name, href: productHref(p), price: inr(p.price) })))
    .filter((pair) => pair.length === 2);
  const sarees = all.filter((p) => p.category === "saree");
  const anarkalis = all.filter((p) => p.category === "anarkali");
  const sets = all.filter((p) => p.category === "suit_set");
  const editMain = byPhoto(all, "n10");
  const editSide = byPhoto(all, "n15");

  const tiles = [
    { label: "Sarees", href: "/collection?category=saree", p: byPhoto(all, "n05") ?? sarees[0], n: sarees.length },
    { label: "Anarkalis", href: "/collection?category=anarkali", p: byPhoto(all, "n26") ?? anarkalis[0], n: anarkalis.length },
    { label: "Suit sets", href: "/collection?category=suit_set", p: byPhoto(all, "n22") ?? sets[0], n: sets.length },
  ].filter((t) => t.p);

  const occasionPhoto: Record<string, string> = { bride: "n02", "mother-of-the-bride": "n03", festive: "n08", gifts: "n06" };
  const words = ["Zari buti", "Kalga border", "Peacock zari", "Jangla jaal", "Paisley pallu", "Woven in Varanasi"];

  return (
    <>
      <JsonLd data={homeJsonLd(everything)} />

      {/* HERO + STRIP: together they fill exactly one screen, on desktop and on the phone. */}
      <section className="relative flex flex-col overflow-hidden bg-cream text-ink"
        style={{ height: "max(600px, calc(100svh - var(--chrome)))", ["--photo-w" as string]: "min(calc((max(600px, calc(100svh - var(--chrome))) - var(--strip) - 104px) * 2 / 3), 300px)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #e9a23b 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <div className="wrap relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-5 py-4 sm:py-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:grid-rows-1 xl:items-center xl:gap-16 xl:py-8">
          <div className="min-h-0 xl:order-2">
            <HeroLooks pairs={heroPairs} />
          </div>
          <div className="rise self-center xl:order-1 xl:max-w-xl">
            <Kicker>{site.currentDrop.label} · Live now</Kicker>
            <h1 className="display mt-3 text-[2.15rem] leading-[1.05] sm:text-6xl xl:mt-6 xl:text-[3.25rem] 2xl:text-[3.5rem]">
              Woven in Banaras.
              <em className="block text-peacock">Worn for a lifetime.</em>
            </h1>
            <p className="mt-6 hidden max-w-md text-[1.0625rem] leading-relaxed text-muted sm:block">
              Sarees, Anarkalis and suit sets from the looms of Varanasi. Most pieces are one of one, photographed in full, and shipped across India.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:gap-3">
              <Link href="#drop" className="btn btn-primary whitespace-nowrap !px-4 sm:!px-7">Shop the drop</Link>
              <a href={waLink("Hi! I would like to see the new drop.")} target="_blank" rel="noopener noreferrer" className="btn btn-ghost whitespace-nowrap !px-4 sm:!px-7">WhatsApp us</a>
            </div>
            <dl className="mt-10 hidden max-w-md grid-cols-3 border-t border-line pt-6 xl:grid">
              {[["One of one", "Most pieces"], ["Free", "Shipping over ₹2,999"], ["7 days", "Easy returns"]].map(([a, b]) => (
                <div key={b}><dt className="display text-2xl text-peacock">{a}</dt><dd className="label mt-1.5 text-xs text-muted">{b}</dd></div>
              ))}
            </dl>
          </div>
        </div>
        <div className="relative shrink-0" style={{ height: "var(--strip)" }}>
          <div className="zari-border" aria-hidden />
          <div className="overflow-hidden bg-peacock-dark py-3.5" aria-hidden>
            <div className="marquee flex w-max gap-10 whitespace-nowrap">
              {[...words, ...words, ...words, ...words].map((w, i) => (
                <span key={i} className="display flex items-center gap-10 text-lg italic leading-5 text-cream/80">
                  {w} <span className="h-1.5 w-1.5 rotate-45 bg-marigold" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY TRIPTYCH */}
      <section className="wrap py-12 md:py-16">
        <div className="text-center">
          <Kicker center>The house of Banaras</Kicker>
          <h2 className="display mt-3 text-[2rem] leading-tight sm:text-[2.75rem] lg:text-5xl">Three ways to <em className="text-peacock">wear the weave</em></h2>
        </div>
        <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:gap-8">
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className="group block w-[74%] shrink-0 snap-start sm:w-auto">
              <span className="cell relative block">
                <Photo fit m={t.p!.media[0]} alt={`${t.label}: model wearing the ${t.p!.name}`} want={800}
                  sizes="(min-width: 640px) 31vw, 92vw" className="!rounded-none" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pb-5 pt-20 text-cream">
                  <span className="display block text-3xl lg:text-4xl">{t.label}</span>
                  <span className="label mt-2 inline-flex items-center gap-2 text-xs text-cream/85">{t.n} pieces <Arrow width={14} height={14} /></span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* THE DROP (on-model pieces only) */}
      <section id="drop" className="scroll-mt-28 border-t border-line bg-white py-12 md:py-16">
        <div className="wrap">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <Kicker>This week&apos;s drop</Kicker>
              <h2 className="display mt-3 text-[2rem] leading-tight sm:text-[2.75rem] lg:text-5xl">Fresh off <em className="text-peacock">the loom</em></h2>
            </div>
            <Link href="/collection" className="label inline-flex min-h-11 items-center gap-2 text-peacock underline-offset-8 hover:underline">
              View the full collection <Arrow width={15} height={15} />
            </Link>
          </div>
          <DropGrid products={all} />
        </div>
      </section>

      {/* THE SAREE EDIT */}
      {editMain && (
        <section className="bg-cream py-12 md:py-16">
          <div className="wrap grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
            <div className="grid grid-cols-[1.5fr_1fr] items-end gap-4">
              <Link href={productHref(editMain)} className="group block overflow-hidden">
                <Photo m={editMain.media[0]} alt={`Model wearing the ${editMain.name}`} want={800} sizes="(min-width: 1024px) 360px, 55vw"
                  className="!rounded-none transition duration-700 group-hover:scale-[1.02]" />
              </Link>
              {editSide && (
                <Link href={productHref(editSide)} className="group block overflow-hidden lg:mb-10">
                  <Photo m={editSide.media[0]} alt={`Model wearing the ${editSide.name}`} want={480} sizes="(min-width: 1024px) 240px, 36vw"
                    className="!rounded-none" />
                </Link>
              )}
            </div>
            <div>
              <Kicker>The saree edit</Kicker>
              <h2 className="display mt-3 text-[2rem] leading-tight sm:text-[2.75rem] lg:text-5xl">Six yards of <em className="text-peacock">quiet grandeur</em></h2>
              <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-muted">
                Zari buti scattered like stars, a broad woven border, and a pallu that does the talking. Every saree is shown on a model so you can see how it falls before it arrives.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/collection?category=saree" className="btn btn-primary">Shop {sarees.length} sarees</Link>
                <a href={waLink("Hi! Please help me choose a saree. The occasion is: ")} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <WhatsApp width={17} height={17} /> Ask a stylist
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8"><Rail items={sarees.slice(0, 14)} /></div>
        </section>
      )}

      {/* ANARKALI SALON: dark stage to match the photography */}
      {anarkalis.length > 0 && (
        <section className="on-dark bg-[#0b0b0b] py-16 text-cream md:py-24">
          <div className="wrap flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <Kicker light>The Anarkali salon</Kicker>
              <h2 className="display mt-3 text-[2rem] leading-tight sm:text-[2.75rem] lg:text-5xl">The peacock, <em className="text-marigold">in full flare</em></h2>
              <p className="mt-4 max-w-xl leading-relaxed text-cream/75">A woven zari peacock at the yoke, buti across a floor-length flare, and a deep zari hem. Eight colours, sold as unstitched fabric.</p>
            </div>
            <Link href="/collection?category=anarkali" className="btn btn-ghost-light">See all Anarkalis</Link>
          </div>
          <div className="mt-8"><Rail items={anarkalis} light /></div>
        </section>
      )}

      {/* SUIT SETS */}
      {sets.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="wrap flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <Kicker>The suit edit</Kicker>
              <h2 className="display mt-3 text-[2rem] leading-tight sm:text-[2.75rem] lg:text-5xl">The full set, <em className="text-peacock">head to toe</em></h2>
              <p className="mt-4 max-w-xl leading-relaxed text-muted">Kurta fabric, bottom and dupatta, matched for you. Sold unstitched, shown made up on a model.</p>
            </div>
            <Link href="/collection?category=suit_set" className="btn btn-ghost">Shop suit sets</Link>
          </div>
          <div className="mt-8"><Rail items={sets} /></div>
        </section>
      )}


      {/* OCCASIONS */}
      <section className="wrap py-12 md:py-16">
        <div className="text-center">
          <Kicker center>Shop by occasion</Kicker>
          <h2 className="display mt-3 text-[2rem] leading-tight sm:text-[2.75rem] lg:text-5xl">Dressed for <em className="text-peacock">the day that matters</em></h2>
        </div>
        <div className="product-grid mt-8">
          {occasions.map((o) => {
            const p = byPhoto(all, occasionPhoto[o.slug]) ?? all.find((x) => x.occasion.includes(o.slug));
            return (
              <Link key={o.slug} href={`/collection?occasion=${o.slug}`} className="group block">
                <span className="cell block overflow-hidden">{p && <Photo fit m={cardMedia(p)} alt={`${o.label}: model wearing the ${p.name}`} want={480} sizes="(min-width: 1100px) 290px, (min-width: 768px) 31vw, 46vw" />}</span>
                <span className="display mt-4 block text-2xl italic group-hover:text-peacock sm:text-[1.75rem]">{o.label}</span>
                <span className="mt-1 block text-sm text-muted">{o.blurb}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WHATSAPP STYLIST */}
      <section className="on-dark bg-peacock text-cream">
        <div className="wrap grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,540px)_400px] lg:justify-center lg:gap-24">
          <div>
            <Kicker light>Your personal stylist</Kicker>
            <h2 className="display mt-3 text-[2rem] leading-tight sm:text-[2.75rem] lg:text-5xl">Shop the way you <em className="text-marigold">already chat</em></h2>
            <p className="mt-4 max-w-md leading-relaxed text-cream/85">
              Tell us the occasion and your budget, in Hindi or English. We send matching pieces with full photos, hold your favourite, and take payment right inside WhatsApp.
            </p>
            <a href={waLink("Hi! I need help choosing something. The occasion is: ")} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-9">
              <WhatsApp width={17} height={17} /> Chat with a stylist
            </a>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-[1.75rem] lg:max-w-none bg-deep p-4 shadow-2xl sm:p-5" aria-label="Example WhatsApp chat">
            <p className="flex items-center gap-3 border-b border-cream/15 pb-3 text-sm font-medium">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-marigold text-ink"><Loom width={18} height={18} /></span>
              {site.brand} stylist
            </p>
            <ul className="mt-4 space-y-3 text-[0.9rem] leading-snug">
              <li className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-wa px-3.5 py-2.5 text-white">Bhabhi ki shaadi hai next month. Budget 8,000 tak. Pink ya red?</li>
              <li className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-cream px-3.5 py-2.5 text-ink">Congratulations! This one would look lovely for the wedding:</li>
              {heroMain && (
                <li className="flex w-fit max-w-[90%] items-center gap-3 rounded-2xl rounded-bl-sm bg-cream p-2.5 text-ink">
                  <span className="block w-20 shrink-0"><Photo m={heroMain.media[0]} alt="" want={480} sizes="80px" /></span>
                  <span><strong className="block font-medium">{heroMain.name}</strong>{inr(heroMain.price)} · {stockLabel(heroMain.stock)}</span>
                </li>
              )}
              <li className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-wa px-3.5 py-2.5 text-white">UPI se pay kar sakti hoon?</li>
              <li className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-cream px-3.5 py-2.5 text-ink">Yes, UPI or card. I have held it for you.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="wrap py-10 md:py-14">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {[
            [Loom, "Checked piece by piece", "Every weave, border and tassel inspected by hand before it ships."],
            [Eye, "True colour photos", "Shot in daylight and shown in full. Nothing cropped, nothing hidden."],
            [HomeIcon, "Shipping across India", "Free shipping above ₹2,999. Delivered in 3 to 6 days, pay by UPI or card."],
            [Return, "7-day returns", "Changed your mind? We arrange the pickup within 7 days."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Loom;
            return (
              <li key={t as string}>
                <span className="grid h-12 w-12 place-items-center rounded-full border border-marigold text-peacock"><I /></span>
                <h3 className="display mt-4 text-[1.35rem] leading-tight">{t as string}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d as string}</p>
              </li>
            );
          })}
        </ul>
      </section>

    </>
  );
}
