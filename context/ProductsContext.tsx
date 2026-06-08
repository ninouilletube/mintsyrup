'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '@/data/products';
import { getData, setData } from '@/lib/supabase';

const LS_KEY = 'ms_products';

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

  useEffect(() => {
    // 1. Charge depuis Supabase en priorité
    getData('products').then((val) => {
      if (val && Array.isArray(val) && (val as Product[]).length > 0) {
        const prods = val as Product[];
        setProducts(prods);
        // Met à jour localStorage avec la version Supabase
        try { localStorage.setItem(LS_KEY, JSON.stringify(prods)); } catch {}
      } else {
        // 2. Fallback localStorage + re-sync vers Supabase
        try {
          const local = localStorage.getItem(LS_KEY);
          if (local) {
            const parsed = JSON.parse(local) as Product[];
            setProducts(parsed);
            if (parsed.length > 0) setData('products', parsed).catch(() => {});
          }
        } catch {}
      }
      setLoaded(true);
    }).catch(() => {
      try {
        const local = localStorage.getItem(LS_KEY);
        if (local) {
          const parsed = JSON.parse(local) as Product[];
          setProducts(parsed);
          if (parsed.length > 0) setData('products', parsed).catch(() => {});
        }
      } catch {}
      setLoaded(true);
    });
  }, []);

  const save = async (prods: Product[]) => {
    setProducts(prods);
    // localStorage en premier — toujours fiable
    try { localStorage.setItem(LS_KEY, JSON.stringify(prods)); } catch {}
    // Supabase en parallèle — best effort
    setData('products', prods).catch(() => {});
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
