export type Category = "saree" | "suit_set" | "anarkali" | "suit_fabric" | "dupatta";
export type ProductStatus = "draft" | "live" | "sold_out";

export interface Media {
  /** Base path without size suffix, e.g. /products/p01-a, or a full URL when widths is empty */
  url: string;
  type: "photo" | "video";
  width: number;
  height: number;
  /** Available pre-built widths (webp). Empty means use url as is. */
  widths: number[];
}

export interface Weaver {
  id: string;
  name: string;
  village: string;
  story: string;
  /** true until the owner confirms the real weaver details */
  placeholder: boolean;
}

export interface Product {
  code: string;
  name: string;
  category: Category;
  weave: string;
  colour: string;
  colourHex: string;
  colourFamily: string;
  occasion: string[];
  price: number;
  stock: number;
  silkMark: boolean;
  weaverId: string | null;
  description: string;
  status: ProductStatus;
  drop: number;
  featured: boolean;
  media: Media[];
  /** true when the main photo shows the piece worn by a model */
  onModel?: boolean;
  /** Card image when the first photo is only one panel of a composite (the whole picture, uncut) */
  cover?: Media;
  /** set when the piece was added from the dashboard (not the seed catalogue) */
  createdAt?: string;
}

export interface BagLine {
  code: string;
  qty: number;
}

export type OrderStatus = "pending_payment" | "new" | "packed" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "upi" | "card" | "cod";
export type PaymentStatus = "pending" | "paid" | "cod_due" | "failed";

export interface OrderItem {
  code: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
}

export interface Address {
  line1: string;
  society: string;
  tower: string;
  city: string;
  pincode: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string;
  address: Address;
  slot: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  offerCode: string;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef: string;
  gatewayOrderId: string;
  stockTaken: boolean;
}

export interface Trial {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  society: string;
  tower: string;
  pincode: string;
  slot: string;
  pieces: string;
  status: "booked" | "done" | "cancelled";
}

export interface Contact {
  phone: string;
  name: string;
  society: string;
  optInAt: string | null;
  optInSource: string;
  consentText: string;
  unsubscribedAt: string | null;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail: string;
}
