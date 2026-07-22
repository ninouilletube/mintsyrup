import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { LangProvider } from '@/context/LangContext';
import { ShopProvider } from '@/context/ShopContext';
import { ProductsProvider } from '@/context/ProductsContext';
import { SubcategoriesProvider } from '@/context/SubcategoriesContext';
import { SelectionsProvider } from '@/context/SelectionsContext';
import { TagsProvider } from '@/context/TagsContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import VisitTracker from '@/components/VisitTracker';
import NavigationTracker from '@/components/NavigationTracker';
import LoadingOverlay from '@/components/LoadingOverlay';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: 'Mint Syrup',
  description: 'Friperie en ligne — Pièces vintage et de seconde main.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preload" href="/MyUglyHandwriting-Regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      </head>
      <body className={`${dmSans.variable} ${playfair.variable}`}>
        <LangProvider>
          <AuthProvider>
            <ShopProvider>
              <ProductsProvider><SubcategoriesProvider><SelectionsProvider><TagsProvider>
                <CartProvider>
                  <WishlistProvider>
                    <LoadingOverlay />
                    <SpotifyPlayer />
                    <VisitTracker />
                    <Suspense fallback={null}><NavigationTracker /></Suspense>
                    {children}
                  </WishlistProvider>
                </CartProvider>
              </TagsProvider></SelectionsProvider></SubcategoriesProvider></ProductsProvider>
            </ShopProvider>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
