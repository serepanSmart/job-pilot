import { Inter, Sora } from 'next/font/google';

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
