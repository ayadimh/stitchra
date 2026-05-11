import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stitchra | AI Embroidery Studio",
  description:
    "Design, preview, and price custom embroidered T-shirts with AI.",
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
