'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '@/data/products';

type ProductsContextType = {
  products: Product[];
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: number) => void;
};

const ProductsContext = createContext<ProductsContextType>({
  products: [],
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
});

const STORAGE_KEY = 'msc_products';

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProducts(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const save = (prods: Product[]) => {
    setProducts(prods);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prods));
  };

  const addProduct = (p: Omit<Product, 'id'>) => {
    save([...products, { ...p, id: Date.now() }]);
  };

  const updateProduct = (updated: Product) => {
    save(products.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (id: number) => {
    save(products.filter((p) => p.id !== id));
  };

  if (!loaded) return null;

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);
