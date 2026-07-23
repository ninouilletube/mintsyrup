'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type WishlistContextType = {
  wishlist: number[]; // product IDs
  wishlistCounts: Record<number, number>; // productId → global favorite count
  isInWishlist: (productId: number) => boolean;
  toggle: (productId: number) => Promise<void>;
  loading: boolean;
};

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  wishlistCounts: {},
  isInWishlist: () => false,
  toggle: async () => {},
  loading: false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [wishlistCounts, setWishlistCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.rpc('get_wishlist_counts').then(({ data, error }) => {
      if (error) {
        // Fallback : lecture directe si RPC indisponible (RLS permissive ou anon autorisé)
        console.warn('[wishlist counts] RPC failed, trying direct query:', error.message);
        supabase.from('wishlists').select('product_id').then(({ data: rows, error: err2 }) => {
          if (err2 || !rows) { console.warn('[wishlist counts] direct query also failed:', err2?.message); return; }
          const counts: Record<number, number> = {};
          for (const row of rows) counts[row.product_id] = (counts[row.product_id] ?? 0) + 1;
          setWishlistCounts(counts);
        });
        return;
      }
      if (!data) return;
      const counts: Record<number, number> = {};
      for (const row of data as { product_id: number; count: number }[]) {
        counts[row.product_id] = Number(row.count);
      }
      setWishlistCounts(counts);
    });
  }, []);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setWishlist([]);
      loadedForRef.current = null;
      return;
    }
    // Skip refetch if we already have data for this user (e.g. token refresh)
    if (loadedForRef.current === userId) return;
    loadedForRef.current = userId;
    setLoading(true);
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        setWishlist((data ?? []).map(r => r.product_id as number));
        setLoading(false);
      });
  }, [userId]);

  const isInWishlist = useCallback((productId: number) => wishlist.includes(productId), [wishlist]);

  const toggle = useCallback(async (productId: number) => {
    if (!user) return;
    if (wishlist.includes(productId)) {
      setWishlist(prev => prev.filter(id => id !== productId));
      setWishlistCounts(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] ?? 0) - 1) }));
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
    } else {
      setWishlist(prev => [...prev, productId]);
      setWishlistCounts(prev => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    }
  }, [user, wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistCounts, isInWishlist, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
