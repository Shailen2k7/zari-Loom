import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement>;
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const Heart = (p: P) => (<svg {...base} {...p}><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" /></svg>);
export const Bag = (p: P) => (<svg {...base} {...p}><path d="M5 8h14l-1 12.5H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>);
export const Search = (p: P) => (<svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>);
export const User = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="8.5" r="3.7" /><path d="M4.5 20.5c1-4 4-5.5 7.5-5.5s6.5 1.5 7.5 5.5" /></svg>);
export const Check = (p: P) => (<svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const Arrow = (p: P) => (<svg {...base} {...p}><path d="M4.5 12h15M13.5 6l6 6-6 6" /></svg>);
export const Truck = (p: P) => (<svg {...base} {...p}><path d="M3 6.5h11v10H3zM14 10h4l3 3v3.5h-7" /><circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>);
export const Eye = (p: P) => (<svg {...base} {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>);
export const Home = (p: P) => (<svg {...base} {...p}><path d="M4 11.5 12 4.5l8 7V20H4v-8.5Z" /><path d="M10 20v-5.5h4V20" /></svg>);
export const Return = (p: P) => (<svg {...base} {...p}><path d="M8 5 4 9l4 4" /><path d="M4 9h10a5.5 5.5 0 0 1 0 11h-3" /></svg>);
export const Loom = (p: P) => (<svg {...base} {...p}><path d="M4 4v16M20 4v16M4 7h16M4 17h16M8 7v10M12 7v10M16 7v10" /></svg>);
export const WhatsApp = (p: P) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.5 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5Zm0 1.7a7.7 7.7 0 1 1-3.9 14.3l-.300-.200-2.9.800.8-2.8-.200-.300A7.7 7.7 0 0 1 12 4.2Zm-3.3 3.9c-.200 0-.400 0-.600.3-.200.2-.800.8-.800 1.9s.800 2.2.900 2.4c.100.1 1.6 2.5 4 3.5 2 .800 2.4.600 2.8.600.4 0 1.4-.600 1.6-1.1.200-.600.2-1 .100-1.1l-.400-.300-1.4-.700c-.200-.100-.400-.100-.500.1l-.700.8c-.100.2-.200.2-.500.1a6.3 6.3 0 0 1-3.1-2.7c-.200-.400.2-.400.6-1.2.100-.100 0-.300 0-.400l-.700-1.6c-.200-.400-.300-.400-.500-.400l-.800-.200Z" />
  </svg>
);
