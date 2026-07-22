import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vāṇī — Indian language text to speech",
  description:
    "A calm studio for Sarvam Bulbul v3. Write text, pick a voice, hear it spoken.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
