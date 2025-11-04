import './css/style.css'

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Theme from './theme-provider'
import AppProvider from './app-provider'
import Footer from '@/components/Footer'
import AnalyticsScript from '@/components/AnalyticsScript'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Ensure the site URL always has a protocol
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olympicship.com';
const siteUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`;
const siteName = 'OlympicShip';
const siteDescription = 'The Olympics of GitHub. Compete to become the top code shipper — no fake stats, just real commit data straight from GitHub.';
const siteKeywords = [
  'GitHub',
  'OlympicShip',
  'Commit Leaderboard',
  'Ship ',
  'Developer Leaderboard'
].join(', ');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - GitHub Contributions Leaderboard`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [{ name: 'Pauline_cx' }],
  creator: 'Pauline_cx',
  publisher: 'Pauline_cx',
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
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - GitHub Contributions Leaderboard`,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/thumbnail.png`,
        width: 1200,
        height: 630,
        alt: `${siteName} - GitHub Contributions Leaderboard`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - GitHub Contributions Leaderboard`,
    description: siteDescription,
    images: [`${siteUrl}/thumbnail.png`],
    creator: '@trustcode',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable}`} data-theme="gh" suppressHydrationWarning>
      <body className="font-inter antialiased bg-gh-primary text-gh-white pb-32 md:pb-0" style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch' }}>
        <AnalyticsScript />
        <Theme>
          <AppProvider>
            {children}
            <Footer />
          </AppProvider>
        </Theme>
      </body>
    </html>
  );
}
