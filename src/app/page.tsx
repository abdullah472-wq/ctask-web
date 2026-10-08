import { redirect } from 'next/navigation';

export default function RootPage() {
  // This page is a fallback to prevent Turbopack panics in Next.js 15+.
  // The middleware should normally intercept the root '/' and redirect/rewrite to a locale (e.g., '/en').
  redirect('/en');
}
