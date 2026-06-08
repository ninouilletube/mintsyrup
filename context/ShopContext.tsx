'use client';

import { createContext, useContext, useState } from 'react';
import type { Category } from '@/data/products';

type ShopContextType = {
  activeCategory: Category | null;
  setActiveCategory: (c: Category | null) => void;
};

const ShopContext = createContext<ShopContextType>({
  activeCategory: null,
  setActiveCategory: () => {},
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  return (
    <ShopContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
