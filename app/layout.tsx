import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "./providers/AuthProvider";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CCC Esports",
  description:
    "Official website of CCC Esports - Clovis Community College, California - representing our college in competitive gaming",
  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          {children}

          {/* Dark-themed Sonner Toaster */}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className:
                "rounded-xl px-6 py-4 font-bold shadow-2xl shadow-black/40 bg-gray-900 text-white border border-primary/40",
            }}
          />
        </AuthProvider>

        <Analytics />
      </body>
    </html>
  );
}
