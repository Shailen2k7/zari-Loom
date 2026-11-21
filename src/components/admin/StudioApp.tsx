"use client";
import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registers the studio's service worker (share-to-app on Android). Renders nothing. */
export function StudioWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/studio-sw.js", { scope: "/admin" }).catch(() => {});
  }, []);
  return null;
}

/** "Get the app" card for the owner's phone: one tap on Android, two simple steps on iPhone. Hidden once installed. */
export function InstallApp() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try { dismissed = localStorage.getItem("zl-install-dismissed") === "1"; } catch {}
    if (standalone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); setHidden(false); };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (hidden) return null;
  const dismiss = () => { setHidden(true); try { localStorage.setItem("zl-install-dismissed", "1"); } catch {} };

  return (
    <div className="fade-up mb-5 flex items-center gap-3.5 rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/studio/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-semibold leading-snug">Get the Studio app</p>
        <p className="text-xs leading-snug text-muted">
          {ios ? <>Tap <ShareGlyph /> Share, then <b className="font-semibold text-ink">Add to Home Screen</b>.</> : "Add pieces straight from WhatsApp and your camera."}
        </p>
      </div>
      {prompt && (
        <button type="button" className="btn btn-primary !min-h-9 shrink-0 !px-4 !text-[0.8125rem]"
          onClick={async () => { await prompt.prompt(); const r = await prompt.userChoice; if (r.outcome === "accepted") setHidden(true); setPrompt(null); }}>
          Install
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Not now" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-tint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
  );
}

function ShareGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -translate-y-px" aria-hidden>
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7.5h14V12" />
    </svg>
  );
}
