import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChatWidget } from "@/components/ChatWidget";

const favicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' rx='6' fill='%23047857'/%3E%3Cpath d='M7 17c-1.5-4 1-9 9-10 .5 5-2 9-9 10Z' fill='%23ffffff'/%3E%3Cpath d='M7 17c1-2 3-4 6-5' stroke='%23047857' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  metadataBase: new URL("https://budseeker.vercel.app"),
  title: {
    default: "Bud Seeker | Cannabis Product & Dispensary Guide",
    template: "%s | Bud Seeker",
  },
  description:
    "Bud Seeker is a private AI product guide and nearby-dispensary finder for cannabis shoppers — compare delivery and pickup options, map licensed retailers, and get matched to the right product. 21+ only.",
  keywords: [
    "cannabis dispensary finder",
    "cannabis delivery near me",
    "dispensary pickup",
    "AI budtender",
    "cannabis product guide",
  ],
  icons: { icon: favicon },
  openGraph: {
    title: "Bud Seeker | Cannabis Product & Dispensary Guide",
    description:
      "A private AI product guide and nearby-dispensary finder — compare delivery and pickup options at licensed retailers near you.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-slate-950 dark:bg-black dark:text-slate-50 font-sans">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
