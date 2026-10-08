import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only public routes and worker routes
  // Exclude API, internal Next.js paths, static files, and admin/auth routes
  matcher: [
    '/((?!api|_next|_vercel|admin|auth|.*\\..*).*)'
  ]
};
