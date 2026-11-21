"use client";
import { useEffect } from "react";

/** Measures the top bar + header so the hero can fill exactly what is left of the first screen. */
export function ChromeHeight() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-chrome]")];
    const set = () => document.documentElement.style.setProperty("--chrome", `${els.reduce((h, e) => h + e.offsetHeight, 0)}px`);
    set();
    const ro = new ResizeObserver(set);
    els.forEach((e) => ro.observe(e));
    return () => ro.disconnect();
  }, []);
  return null;
}
