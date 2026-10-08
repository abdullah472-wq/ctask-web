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

import { Noto_Serif_Bengali } from "next/font/google";
const notoSerifBengali = Noto_Serif_Bengali({
  weight: "400",
  subsets: ["bengali"],
  variable: "--font-tiro-bangla", // using the same variable name for compatibility
});

import { WhatsAppButton } from "@/components/WhatsAppButton";

import { cookies } from 'next/headers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Ctask - Complete Tasks & Earn",
  description: "Complete simple tasks and earn real money on Ctask.",
  icons: {
    icon: '/icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const isBangla = locale === 'bn';

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${notoSerifBengali.variable}`} suppressHydrationWarning>
      <body className={`antialiased min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 transition-colors duration-300 ${isBangla ? 'font-bangla-active' : ''}`} suppressHydrationWarning>
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
