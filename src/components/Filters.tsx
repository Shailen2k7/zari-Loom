"use client";
import { useRef } from "react";
import { categories, occasions, priceBands } from "@/config/site";
import { colourFamilies } from "@/config/site";

export interface FilterValues { category: string; weave: string; price: string; colour: string; occasion: string; silk: string; sort: string; q: string }

export function Filters({ values, weaves, count }: { values: FilterValues; weaves: string[]; count: number }) {
  const form = useRef<HTMLFormElement>(null);
  const go = () => form.current?.requestSubmit();
  return (
    <form ref={form} method="get" action="/collection" className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_3px_rgb(0_0_0/0.04)] sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <label className="field-label" htmlFor="f-q">Search</label>
          <input id="f-q" name="q" type="search" defaultValue={values.q} placeholder="Name, colour or code" className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="f-cat">Category</label>
          <select id="f-cat" name="category" defaultValue={values.category} data-on={Boolean(values.category)} onChange={go} className="field">
            <option value="">All</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="f-weave">Weave</label>
          <select id="f-weave" name="weave" defaultValue={values.weave} data-on={Boolean(values.weave)} onChange={go} className="field">
            <option value="">All</option>
            {weaves.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="f-price">Price</label>
          <select id="f-price" name="price" defaultValue={values.price} data-on={Boolean(values.price)} onChange={go} className="field">
            <option value="">Any</option>
            {priceBands.map((b) => <option key={b.slug} value={b.slug}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="f-occ">Occasion</label>
          <select id="f-occ" name="occasion" defaultValue={values.occasion} data-on={Boolean(values.occasion)} onChange={go} className="field">
            <option value="">Any</option>
            {occasions.map((o) => <option key={o.slug} value={o.slug}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="f-sort">Sort</label>
          <select id="f-sort" name="sort" defaultValue={values.sort} data-on={Boolean(values.sort)} onChange={go} className="field">
            <option value="">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="field-label float-left mr-3 !mb-0 pt-2.5">Colour</legend>
          <label className="cursor-pointer">
            <input type="radio" name="colour" value="" defaultChecked={!values.colour} onChange={go} className="peer sr-only" />
            <span className="flex min-h-10 items-center rounded-full border border-line px-4 text-sm font-medium peer-checked:border-peacock peer-checked:bg-peacock peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2">Any</span>
          </label>
          {colourFamilies.map((c) => (
            <label key={c.slug} className="cursor-pointer" title={c.label}>
              <input type="radio" name="colour" value={c.slug} defaultChecked={values.colour === c.slug} onChange={go} className="peer sr-only" />
              <span className="block h-10 w-10 rounded-full border border-line p-1 peer-checked:border-2 peer-checked:border-peacock peer-focus-visible:outline peer-focus-visible:outline-2">
                <span className="block h-full w-full rounded-full border border-black/10" style={{ background: c.hex }} />
              </span>
              <span className="sr-only">{c.label}</span>
            </label>
          ))}
        </fieldset>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" name="silk" value="1" defaultChecked={values.silk === "1"} onChange={go} className="h-5 w-5 accent-[#0f4443]" />
          Silk Mark only
        </label>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted" aria-live="polite">{count} {count === 1 ? "piece" : "pieces"}</span>
          <a href="/collection" className="inline-flex min-h-11 items-center text-sm font-semibold text-peacock underline underline-offset-4">Clear</a>
          <button type="submit" className="btn btn-primary !min-h-11">Apply</button>
        </div>
      </div>
    </form>
  );
}
