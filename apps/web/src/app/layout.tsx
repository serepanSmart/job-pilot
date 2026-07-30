import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { inter, sora } from '@/theme/fonts';
import { AppThemeProvider } from '@/theme/theme-provider';

export const metadata: Metadata = {
  title: 'JobPilot',
  description: 'Autonomous job discovery and application tracking.',
};

export const viewport: Viewport = {
  themeColor: '#0B0910',
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable}`}
    >
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="dark" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <AppThemeProvider>{children}</AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
