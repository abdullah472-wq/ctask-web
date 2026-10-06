import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { WhatsAppButton } from "@/components/WhatsAppButton";

import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Ctask - Complete Tasks & Earn",
  description: "Complete simple tasks and earn real money on Ctask.",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" />
          <WhatsAppButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
