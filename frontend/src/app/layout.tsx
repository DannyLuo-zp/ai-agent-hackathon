import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Cat",
  description: "Chat with your AI cat assistant",
  icons: [
    {
      rel: 'icon',
      url: '/cat.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/cat.png',
      type: 'image/png',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/cat.png" type="image/png" />
        <link rel="apple-touch-icon" href="/cat.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
