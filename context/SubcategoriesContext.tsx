'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Subcategory } from '@/data/subcategories';
import { getData, setData } from '@/lib/supabase';

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
      if (val) setSubcategories(val as Subcategory[]);
      setLoaded(true);
    });
  }, []);

  const save = (items: Subcategory[]) => {
    setSubcategories(items);
    setData('subcategories', items);
  };

  const addSubcategory = (s: Omit<Subcategory, 'id'>) => save([...subcategories, { ...s, id: Date.now().toString() }]);
  const deleteSubcategory = (id: string) => save(subcategories.filter((s) => s.id !== id));

  if (!loaded) return null;

  return (
    <SubcategoriesContext.Provider value={{ subcategories, addSubcategory, deleteSubcategory }}>
      {children}
    </SubcategoriesContext.Provider>
  );
}

export const useSubcategories = () => useContext(SubcategoriesContext);
