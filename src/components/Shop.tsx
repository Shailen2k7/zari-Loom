"use client";
// Bag and wishlist live in the browser (localStorage) so shopping needs no login.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BagLine } from "@/lib/types";

interface ShopState {
  ready: boolean;
  bag: BagLine[];
  wish: string[];
  addToBag: (line: BagLine, maxQty: number) => void;
  setQty: (index: number, qty: number) => void;
  removeLine: (index: number) => void;
  clearBag: () => void;
  toggleWish: (code: string) => void;
  myOrders: string[];
  rememberOrder: (id: string) => void;
}
const Ctx = createContext<ShopState | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bag, setBag] = useState<BagLine[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [myOrders, setMyOrders] = useState<string[]>([]);

  useEffect(() => {
    setBag(load("store_bag", []));
    setWish(load("store_wish", []));
    setMyOrders(load("store_orders", []));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("store_bag", bag); }, [bag, ready]);
  useEffect(() => { if (ready) save("store_wish", wish); }, [wish, ready]);
  useEffect(() => { if (ready) save("store_orders", myOrders); }, [myOrders, ready]);

  const addToBag = useCallback((line: BagLine, maxQty: number) => {
    setBag((b) => {
      const i = b.findIndex((x) => x.code === line.code);
      const inBag = b.filter((x) => x.code === line.code).reduce((s, x) => s + x.qty, 0);
      if (inBag >= maxQty) return b;
      if (i >= 0) return b.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x));
      return [...b, { ...line, qty: 1 }];
    });
  }, []);
  const setQty = useCallback((index: number, qty: number) => setBag((b) => b.map((x, k) => (k === index ? { ...x, qty: Math.max(1, qty) } : x))), []);
  const removeLine = useCallback((index: number) => setBag((b) => b.filter((_, k) => k !== index)), []);
  const clearBag = useCallback(() => setBag([]), []);
  const toggleWish = useCallback((code: string) => setWish((w) => (w.includes(code) ? w.filter((c) => c !== code) : [...w, code])), []);
  const rememberOrder = useCallback((id: string) => setMyOrders((o) => (o.includes(id) ? o : [id, ...o].slice(0, 30))), []);

  const value = useMemo(
    () => ({ ready, bag, wish, addToBag, setQty, removeLine, clearBag, toggleWish, myOrders, rememberOrder }),
    [ready, bag, wish, addToBag, setQty, removeLine, clearBag, toggleWish, myOrders, rememberOrder],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShop must be used inside ShopProvider");
  return c;
}
