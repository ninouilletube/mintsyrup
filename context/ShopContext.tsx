'use client';

import { createContext, useContext, useState } from 'react';
import type { Category } from '@/data/products';

type ShopContextType = {
  activeCategory: Category | null;
  setActiveCategory: (c: Category | null) => void;
  activeSelection: string | null;
  setActiveSelection: (id: string | null) => void;
};

const ShopContext = createContext<ShopContextType>({
  activeCategory: null,
  setActiveCategory: () => {},
  activeSelection: null,
  setActiveSelection: () => {},
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSelection, setActiveSelection] = useState<string | null>(null);
  return (
    <ShopContext.Provider value={{ activeCategory, setActiveCategory, activeSelection, setActiveSelection }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
