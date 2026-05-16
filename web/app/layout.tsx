import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://stitchra.com"),
  title: "Stitchra | AI Embroidery Platform",
  description:
    "Design, preview and request custom embroidered T-shirts with transparent pricing.",
  openGraph: {
    title: "Stitchra | AI Embroidery Platform",
    description:
      "Design, preview and request custom embroidered T-shirts with transparent pricing.",
    url: "https://stitchra.com",
    siteName: "Stitchra",
    type: "website",
    images: ["/stitchra-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stitchra | AI Embroidery Platform",
    description:
      "Design, preview and request custom embroidered T-shirts with transparent pricing.",
    images: ["/stitchra-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
