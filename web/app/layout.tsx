import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans,
  Noto_Sans_Arabic,
} from "next/font/google";
import StitchraDesignAgent from "@/components/assistant/StitchraDesignAgent";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stitchra.com"),
  applicationName: "Stitchra",
  title: "Stitchra | AI Embroidery T-Shirt Platform",
  description:
    "AI embroidery T-shirt platform for creating, previewing and requesting clear custom embroidery quotes.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Stitchra",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/exports/icons/favicon.svg", type: "image/svg+xml" },
      {
        url: "/brand/exports/icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/brand/exports/icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/brand/exports/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/brand/exports/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/brand/exports/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Stitchra | AI Embroidery T-Shirt Platform",
    description:
      "AI embroidery T-shirt platform for creating, previewing and requesting clear custom embroidery quotes.",
    url: "https://stitchra.com",
    siteName: "Stitchra",
    type: "website",
    images: [
      {
        url: "/brand/exports/social/stitchra-og.png",
        width: 1200,
        height: 630,
        alt: "Stitchra AI Embroidery T-Shirt Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stitchra | AI Embroidery T-Shirt Platform",
    description:
      "AI embroidery T-shirt platform for creating, previewing and requesting clear custom embroidery quotes.",
    images: ["/brand/exports/social/stitchra-twitter.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07140f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSans.variable} ${notoSansArabic.variable}`}
    >
      <body>
        {children}
        <ServiceWorkerRegister />
        <StitchraDesignAgent />
      </body>
    </html>
  );
}
