import type { Metadata, Viewport } from "next";
import "./globals.css";

const favicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C9A961' stroke-width='1.8' stroke-linecap='round'%3E%3Cpath d='M5 18C6 10 11 5 18 4c.2 6.7-3.9 11.4-13 14Z'/%3E%3Cpath d='M6 17c3-4 6-7 10-10M13 10c2 .2 3.6 1.4 4.5 3.3'/%3E%3Ccircle cx='17.8' cy='15.5' r='3.2'/%3E%3Cpath d='m20.2 17.8 2 2'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  metadataBase: new URL("https://budseeker-mn.vercel.app"),
  title: { default: "Bud Seeker | Cannabis Product & Dispensary Guide", template: "%s | Bud Seeker" },
  description: "Search cannabis products, compare prices, and find nearby dispensaries — free, instant, and built for adults 21+.",
  icons: { icon: favicon },
};
export const viewport: Viewport = { themeColor: "#12190F", colorScheme: "dark" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
