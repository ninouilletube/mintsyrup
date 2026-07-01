'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Product } from '@/data/products';
import { getData, setData, supabase } from '@/lib/supabase';

const LS_KEY = 'ms_products';

type SavedData = { products: Product[]; savedAt: number };

function toSavedData(val: unknown): SavedData | null {
  if (!val) return null;
  if (Array.isArray(val)) return { products: val as Product[], savedAt: 0 };
  const d = val as Partial<SavedData>;
  if (Array.isArray(d?.products)) return { products: d.products!, savedAt: d.savedAt ?? 0 };
  return null;
}

type ProductsContextType = {
  products: Product[];
  addProduct: (p: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
};

const ProductsContext = createContext<ProductsContextType>({
  products: [],
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
});

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const savedAtRef = useRef<number>(0);

  useEffect(() => {
    let localData: SavedData | null = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) localData = toSavedData(JSON.parse(raw));
    } catch {}

    getData('products').then((val) => {
      const supaData = toSavedData(val);
      const supabaseIsNewer = supaData && supaData.products.length > 0 &&
        (!localData || supaData.savedAt >= localData.savedAt);

      if (supabaseIsNewer && supaData) {
        setProducts(supaData.products);
        savedAtRef.current = supaData.savedAt;
        try { localStorage.setItem(LS_KEY, JSON.stringify(supaData)); } catch {}
      } else if (localData && localData.products.length > 0) {
        setProducts(localData.products);
        savedAtRef.current = localData.savedAt;
        setData('products', localData).catch(() => {});
      }
      setLoaded(true);
    }).catch(() => {
      if (localData && localData.products.length > 0) {
        setProducts(localData.products);
        savedAtRef.current = localData.savedAt;
        setData('products', localData).catch(() => {});
      }
      setLoaded(true);
    });
  }, []);

  // Realtime : mise à jour instantanée quand un autre onglet/appareil modifie les produits
  useEffect(() => {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mint_data', filter: 'key=eq.products' },
        (payload) => {
          const incoming = toSavedData((payload.new as { value: unknown }).value);
          if (!incoming) return;
          // Ignorer si c'est une mise à jour qu'on vient nous-même d'écrire
          if (incoming.savedAt <= savedAtRef.current) return;
          savedAtRef.current = incoming.savedAt;
          setProducts(incoming.products);
          try { localStorage.setItem(LS_KEY, JSON.stringify(incoming)); } catch {}
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Migration one-shot : rose-poudre → rose
  useEffect(() => {
    if (!loaded) return;
    if (!products.some(p => p.tags?.includes('rose-poudre'))) return;
    const migrated = products.map(p => {
      if (!p.tags?.includes('rose-poudre')) return p;
      return { ...p, tags: [...new Set(p.tags.filter(t => t !== 'rose-poudre').concat(['rose']))] };
    });
    save(migrated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const save = async (prods: Product[]) => {
    const payload: SavedData = { products: prods, savedAt: Date.now() };
    savedAtRef.current = payload.savedAt;
    setProducts(prods);
    try { localStorage.setItem(LS_KEY, JSON.stringify(payload)); } catch {}
    setData('products', payload).catch(() => {});
  };

  const addProduct    = async (p: Omit<Product, 'id'>) => save([...products, { ...p, id: Date.now() }]);
  const updateProduct = async (updated: Product)       => save(products.map((p) => (p.id === updated.id ? updated : p)));
  const deleteProduct = async (id: number)             => save(products.filter((p) => p.id !== id));

  if (!loaded) return null;

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);
