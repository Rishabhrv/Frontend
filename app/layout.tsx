import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FooterWithAccordion from "@/components/layout/Footerwithaccordion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AGPH Books Store",
  description:
    "AGPH Store is India's leading self-publishing company in Bhopal, helping authors publish books with expert services since 2022.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* HEADER */}
        <Header />

        {/* MAIN CONTENT */}
        <main className="pb-16 md:pb-0 bg-white text-gray-700">
          {children}
        </main>

        {/* FOOTER — accordion on mobile, full on desktop */}
        <FooterWithAccordion />

        {/* MOBILE BOTTOM NAV */}
        <MobileBottomNav />
      </body>
    </html>
  );
}