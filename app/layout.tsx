import './css/style.css'

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Theme from './theme-provider'
import AppProvider from './app-provider'
import Footer from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "TrustCode - GitHub Contributions Leaderboard",
  description: "Leaderboard of GitHub contributions showing who commits the most",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} data-theme="gh" suppressHydrationWarning>
      <body className="font-inter antialiased bg-gh-primary text-gh-white flex flex-col min-h-screen">
        <Theme>
          <AppProvider>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </AppProvider>
        </Theme>
      </body>
    </html>
  );
}
