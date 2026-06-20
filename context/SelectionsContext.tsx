'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Selection } from '@/data/selections';
import { getData, setData } from '@/lib/supabase';

const LS_KEY = 'ms_selections';

type SelectionsContextType = {
  selections: Selection[];
  addSelection: (name: string) => string;
  deleteSelection: (id: string) => void;
  renameSelection: (id: string, name: string) => void;
};

const SelectionsContext = createContext<SelectionsContextType>({
  selections: [],
  addSelection: () => '',
  deleteSelection: () => {},
  renameSelection: () => {},
});

export function SelectionsProvider({ children }: { children: React.ReactNode }) {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getData('selections').then((val) => {
      if (val && Array.isArray(val) && (val as Selection[]).length > 0) {
        const items = val as Selection[];
        setSelections(items);
        try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
      } else {
        try {
          const local = localStorage.getItem(LS_KEY);
          if (local) {
            const parsed = JSON.parse(local) as Selection[];
            setSelections(parsed);
            if (parsed.length > 0) setData('selections', parsed).catch(() => {});
          }
        } catch {}
      }
      setLoaded(true);
    }).catch(() => {
      try {
        const local = localStorage.getItem(LS_KEY);
        if (local) setSelections(JSON.parse(local) as Selection[]);
      } catch {}
      setLoaded(true);
    });
  }, []);

  const save = (items: Selection[]) => {
    setSelections(items);
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
    setData('selections', items).catch(() => {});
  };

  const addSelection = (name: string): string => {
    const id = Date.now().toString();
    save([...selections, { id, name }]);
    return id;
  };

  const deleteSelection = (id: string) => save(selections.filter((s) => s.id !== id));

  const renameSelection = (id: string, name: string) =>
    save(selections.map((s) => (s.id === id ? { ...s, name } : s)));

  if (!loaded) return null;

  return (
    <SelectionsContext.Provider value={{ selections, addSelection, deleteSelection, renameSelection }}>
      {children}
    </SelectionsContext.Provider>
  );
}

export const useSelections = () => useContext(SelectionsContext);
