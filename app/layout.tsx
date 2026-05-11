import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomTabBar } from "@/components/feed/bottom-tab-bar";
import { PageTransition } from "@/components/page-transition";
import { DEFAULT_TWEAKS } from "@/lib/mock-data";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Foody — лента",
  description: "Соцсеть про еду · Liquid Glass + Flat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <PageTransition>{children}</PageTransition>
        <BottomTabBar brand={DEFAULT_TWEAKS.brand} />
      </body>
    </html>
  );
}
