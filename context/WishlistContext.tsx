'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type WishlistContextType = {
  wishlist: number[]; // product IDs
  isInWishlist: (productId: number) => boolean;
  toggle: (productId: number) => Promise<void>;
  loading: boolean;
};

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  isInWishlist: () => false,
  toggle: async () => {},
  loading: false,
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setWishlist([]); return; }
    setLoading(true);
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setWishlist((data ?? []).map(r => r.product_id as number));
        setLoading(false);
      });
  }, [user]);

  const isInWishlist = useCallback((productId: number) => wishlist.includes(productId), [wishlist]);

  const toggle = useCallback(async (productId: number) => {
    if (!user) return;
    if (wishlist.includes(productId)) {
      setWishlist(prev => prev.filter(id => id !== productId));
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
    } else {
      setWishlist(prev => [...prev, productId]);
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    }
  }, [user, wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, isInWishlist, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
