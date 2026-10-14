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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ctask.net';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ctask - Complete Task & Earn Daily | শীর্ষ মাইক্রোটাস্ক প্ল্যাটফর্ম",
    template: "%s | Ctask",
  },
  description: "Ctask is Bangladesh's premier micro-tasking and freelancing platform. Complete simple digital tasks, test apps, follow channels, and earn real money daily with fast bKash & Nagad withdrawals.",
  keywords: [
    "micro-tasking",
    "earn online Bangladesh",
    "freelancer platform",
    "online income bd",
    "bdt earning site",
    "micro jobs",
    "bKash earning",
    "Nagad income",
    "part time job online",
    "Ctask",
    "অনলাইন ইনকাম",
    "টাস্ক করে ইনকাম",
  ],
  authors: [{ name: "Ctask Team", url: siteUrl }],
  creator: "Ctask",
  publisher: "Ctask",
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bn_BD"],
    url: siteUrl,
    siteName: "Ctask",
    title: "Ctask - Complete Task & Earn Daily",
    description: "Bangladesh's leading micro-task platform. Complete simple tasks and withdraw real earnings instantly to bKash & Nagad.",
    images: [
      {
        url: "/branding.png",
        width: 1200,
        height: 630,
        alt: "Ctask - Complete Tasks & Earn Daily",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ctask - Complete Task & Earn Daily",
    description: "Complete simple tasks and earn real money daily with fast mobile banking withdrawals on Ctask.",
    images: ["/branding.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
