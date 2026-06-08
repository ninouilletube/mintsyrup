'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Subcategory } from '@/data/subcategories';
import { getData, setData } from '@/lib/supabase';

const LS_KEY = 'ms_subcategories';

type SubcategoriesContextType = {
  subcategories: Subcategory[];
  addSubcategory: (s: Omit<Subcategory, 'id'>) => void;
  deleteSubcategory: (id: string) => void;
};

const SubcategoriesContext = createContext<SubcategoriesContextType>({
  subcategories: [],
  addSubcategory: () => {},
  deleteSubcategory: () => {},
});

export function SubcategoriesProvider({ children }: { children: React.ReactNode }) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getData('subcategories').then((val) => {
      if (val && Array.isArray(val) && (val as Subcategory[]).length > 0) {
        const items = val as Subcategory[];
        setSubcategories(items);
        try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
      } else {
        try {
          const local = localStorage.getItem(LS_KEY);
          if (local) setSubcategories(JSON.parse(local));
        } catch {}
      }
      setLoaded(true);
    }).catch(() => {
      try {
        const local = localStorage.getItem(LS_KEY);
        if (local) setSubcategories(JSON.parse(local));
      } catch {}
      setLoaded(true);
    });
  }, []);

  const save = (items: Subcategory[]) => {
    setSubcategories(items);
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
    setData('subcategories', items).catch(() => {});
  };

  const addSubcategory    = (s: Omit<Subcategory, 'id'>) => save([...subcategories, { ...s, id: Date.now().toString() }]);
  const deleteSubcategory = (id: string)                  => save(subcategories.filter((s) => s.id !== id));

  if (!loaded) return null;

  return (
    <SubcategoriesContext.Provider value={{ subcategories, addSubcategory, deleteSubcategory }}>
      {children}
    </SubcategoriesContext.Provider>
  );
}

export const useSubcategories = () => useContext(SubcategoriesContext);
