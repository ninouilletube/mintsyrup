'use client';

import { createContext, useContext, useState } from 'react';
import type { Category } from '@/data/products';

type ShopContextType = {
  activeCategory: Category | 'all' | null;
  setActiveCategory: (c: Category | 'all' | null) => void;
  activeSelection: string | null;
  setActiveSelection: (id: string | null) => void;
  filterSizes: string[];
  setFilterSizes: (sizes: string[]) => void;
  filterColor: string | null;
  setFilterColor: (color: string | null) => void;
  filterType: string | null;
  setFilterType: (type: string | null) => void;
};

const ShopContext = createContext<ShopContextType>({
  activeCategory: null,
  setActiveCategory: () => {},
  activeSelection: null,
  setActiveSelection: () => {},
  filterSizes: [],
  setFilterSizes: () => {},
  filterColor: null,
  setFilterColor: () => {},
  filterType: null,
  setFilterType: () => {},
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategoryState] = useState<Category | 'all' | null>(null);
  const [activeSelection, setActiveSelectionState] = useState<string | null>(null);
  const [filterSizes, setFilterSizes] = useState<string[]>([]);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const setActiveCategory = (c: Category | 'all' | null) => {
    if (c !== activeCategory) {
      setFilterSizes([]);
      setFilterColor(null);
      setFilterType(null);
    }
    setActiveCategoryState(c);
  };

  const setActiveSelection = (id: string | null) => {
    if (id !== activeSelection) {
      setFilterSizes([]);
      setFilterColor(null);
      setFilterType(null);
    }
    setActiveSelectionState(id);
  };

  return (
    <ShopContext.Provider value={{
      activeCategory, setActiveCategory,
      activeSelection, setActiveSelection,
      filterSizes, setFilterSizes,
      filterColor, setFilterColor,
      filterType, setFilterType,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);
