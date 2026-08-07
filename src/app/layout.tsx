import type { Metadata } from "next";
import "./globals.css";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "Bud Seeker | Cannabis Product & Dispensary Guide",
    template: "%s | Bud Seeker",
  },
  description:
    "An AI product guide and nearby-dispensary finder for cannabis retailers. 21+ only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-950 font-sans">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
