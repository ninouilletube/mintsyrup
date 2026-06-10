'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Subcategory } from '@/data/subcategories';
import { COLORS } from '@/data/colors';
import { getData, setData } from '@/lib/supabase';

const LS_KEY = 'ms_subcategories';
const LS_COLOR_KEY = 'ms_color_order';
const DEFAULT_COLOR_ORDER = COLORS.map((c) => c.id);

type SubcategoriesContextType = {
  subcategories: Subcategory[];
  addSubcategory: (s: Omit<Subcategory, 'id'>) => string;
  deleteSubcategory: (id: string) => void;
  reorderSubcategories: (newOrder: Subcategory[]) => void;
  colorOrder: string[];
  setColorOrder: (order: string[]) => void;
};

const SubcategoriesContext = createContext<SubcategoriesContextType>({
  subcategories: [],
  addSubcategory: () => '',
  deleteSubcategory: () => {},
  reorderSubcategories: () => {},
  colorOrder: DEFAULT_COLOR_ORDER,
  setColorOrder: () => {},
});

export function SubcategoriesProvider({ children }: { children: React.ReactNode }) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [colorOrder, setColorOrderState] = useState<string[]>(DEFAULT_COLOR_ORDER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      getData('subcategories'),
      getData('color_order'),
    ]).then(([subVal, colorVal]) => {
      if (subVal && Array.isArray(subVal) && (subVal as Subcategory[]).length > 0) {
        const items = subVal as Subcategory[];
        setSubcategories(items);
        try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
      } else {
        try {
          const local = localStorage.getItem(LS_KEY);
          if (local) {
            const parsed = JSON.parse(local) as Subcategory[];
            setSubcategories(parsed);
            if (parsed.length > 0) setData('subcategories', parsed).catch(() => {});
          }
        } catch {}
      }

      if (colorVal && Array.isArray(colorVal) && (colorVal as string[]).length > 0) {
        setColorOrderState(colorVal as string[]);
        try { localStorage.setItem(LS_COLOR_KEY, JSON.stringify(colorVal)); } catch {}
      } else {
        try {
          const local = localStorage.getItem(LS_COLOR_KEY);
          if (local) {
            const parsed = JSON.parse(local) as string[];
            if (parsed.length > 0) setColorOrderState(parsed);
          }
        } catch {}
      }

      setLoaded(true);
    }).catch(() => {
      try {
        const local = localStorage.getItem(LS_KEY);
        if (local) {
          const parsed = JSON.parse(local) as Subcategory[];
          setSubcategories(parsed);
          if (parsed.length > 0) setData('subcategories', parsed).catch(() => {});
        }
      } catch {}
      setLoaded(true);
    });
  }, []);

  const save = (items: Subcategory[]) => {
    setSubcategories(items);
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
    setData('subcategories', items).catch(() => {});
  };

  const addSubcategory = (s: Omit<Subcategory, 'id'>): string => {
    const id = Date.now().toString();
    save([...subcategories, { ...s, id }]);
    return id;
  };
  const deleteSubcategory = (id: string) => save(subcategories.filter((s) => s.id !== id));
  const reorderSubcategories = (newOrder: Subcategory[]) => save(newOrder);

  const setColorOrder = (order: string[]) => {
    setColorOrderState(order);
    try { localStorage.setItem(LS_COLOR_KEY, JSON.stringify(order)); } catch {}
    setData('color_order', order).catch(() => {});
  };

  if (!loaded) return null;

  return (
    <SubcategoriesContext.Provider value={{ subcategories, addSubcategory, deleteSubcategory, reorderSubcategories, colorOrder, setColorOrder }}>
      {children}
    </SubcategoriesContext.Provider>
  );
}

export const useSubcategories = () => useContext(SubcategoriesContext);
