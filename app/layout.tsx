import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { LangProvider } from '@/context/LangContext';
import { ShopProvider } from '@/context/ShopContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { SubcategoriesProvider } from '@/context/SubcategoriesContext';
import { TagsProvider } from '@/context/TagsContext';
import VisitTracker from '@/components/VisitTracker';
import LoadingOverlay from '@/components/LoadingOverlay';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: 'Mint Syrup',
  description: 'Friperie en ligne — Pièces vintage et de seconde main.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preload" href="/MyUglyHandwriting-Regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      </head>
      <body className={`${dmSans.variable} ${playfair.variable}`}>
        <LangProvider>
          <ShopProvider>
            <ProductsProvider><SubcategoriesProvider><TagsProvider>
              <LoadingOverlay />
              <SpotifyPlayer />
              <VisitTracker />
              {children}
            </TagsProvider></SubcategoriesProvider></ProductsProvider>
          </ShopProvider>
        </LangProvider>
      </body>
    </html>
  );
}
