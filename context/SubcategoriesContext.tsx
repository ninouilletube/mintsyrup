'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Subcategory } from '@/data/subcategories';
import { COLORS } from '@/data/colors';
import { getData, setData } from '@/lib/supabase';

const LS_KEY = 'ms_subcategories';
const LS_COLOR_KEY = 'ms_color_order';
const LS_COLOR_LABELS_KEY = 'ms_color_labels';
const DEFAULT_COLOR_ORDER = COLORS.map((c) => c.id);

type SubcategoriesContextType = {
  subcategories: Subcategory[];
  addSubcategory: (s: Omit<Subcategory, 'id'>) => string;
  deleteSubcategory: (id: string) => void;
  reorderSubcategories: (newOrder: Subcategory[]) => void;
  colorOrder: string[];
  setColorOrder: (order: string[]) => void;
  colorLabels: Record<string, string>;
  setColorLabel: (id: string, label: string) => void;
};

const SubcategoriesContext = createContext<SubcategoriesContextType>({
  subcategories: [],
  addSubcategory: () => '',
  deleteSubcategory: () => {},
  reorderSubcategories: () => {},
  colorOrder: DEFAULT_COLOR_ORDER,
  setColorOrder: () => {},
  colorLabels: {},
  setColorLabel: () => {},
});

export function SubcategoriesProvider({ children }: { children: React.ReactNode }) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [colorOrder, setColorOrderState] = useState<string[]>(DEFAULT_COLOR_ORDER);
  const [colorLabels, setColorLabelsState] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      getData('subcategories'),
      getData('color_order'),
      getData('color_labels'),
    ]).then(([subVal, colorVal, labelsVal]) => {
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

      if (labelsVal && typeof labelsVal === 'object' && !Array.isArray(labelsVal)) {
        const labels = labelsVal as Record<string, string>;
        setColorLabelsState(labels);
        try { localStorage.setItem(LS_COLOR_LABELS_KEY, JSON.stringify(labels)); } catch {}
      } else {
        try {
          const local = localStorage.getItem(LS_COLOR_LABELS_KEY);
          if (local) setColorLabelsState(JSON.parse(local) as Record<string, string>);
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

  // Migration one-shot : supprimer rose-poudre de l'ordre et des libellés
  useEffect(() => {
    if (!loaded) return;
    if (colorOrder.includes('rose-poudre')) {
      setColorOrder(colorOrder.filter(c => c !== 'rose-poudre'));
    }
    if ('rose-poudre' in colorLabels) {
      const { 'rose-poudre': _removed, ...rest } = colorLabels;
      const next = rest as Record<string, string>;
      setColorLabelsState(next);
      try { localStorage.setItem(LS_COLOR_LABELS_KEY, JSON.stringify(next)); } catch {}
      setData('color_labels', next).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const setColorLabel = (id: string, label: string) => {
    const next = { ...colorLabels, [id]: label };
    setColorLabelsState(next);
    try { localStorage.setItem(LS_COLOR_LABELS_KEY, JSON.stringify(next)); } catch {}
    setData('color_labels', next).catch(() => {});
  };

  if (!loaded) return null;

  return (
    <SubcategoriesContext.Provider value={{ subcategories, addSubcategory, deleteSubcategory, reorderSubcategories, colorOrder, setColorOrder, colorLabels, setColorLabel }}>
      {children}
    </SubcategoriesContext.Provider>
  );
}

export const useSubcategories = () => useContext(SubcategoriesContext);
