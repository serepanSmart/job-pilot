import { Inter, Sora } from 'next/font/google';

/**
 * Self-hosted via next/font: the files are downloaded at build time and served
 * from our own origin, so there is no request to Google at runtime.
 */
export const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-sora',
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
});
