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
    "Upload logos, create AI concepts, preview embroidery placements and request clear T-shirt quotes.",
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
      { url: "/icon.svg", type: "image/svg+xml" },
      {
        url: "/icons/stitchra-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/stitchra-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Stitchra | AI Embroidery T-Shirt Platform",
    description:
      "Upload logos, create AI concepts, preview embroidery placements and request clear T-shirt quotes.",
    url: "https://stitchra.com",
    siteName: "Stitchra",
    type: "website",
    images: ["/stitchra-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stitchra | AI Embroidery T-Shirt Platform",
    description:
      "Upload logos, create AI concepts, preview embroidery placements and request clear T-shirt quotes.",
    images: ["/stitchra-og.png"],
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
