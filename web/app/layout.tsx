import type { Metadata, Viewport } from "next";
import StitchraDesignAgent from "@/components/assistant/StitchraDesignAgent";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

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
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
        <StitchraDesignAgent />
      </body>
    </html>
  );
}
