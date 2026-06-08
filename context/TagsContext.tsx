'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Tag } from '@/data/tags';
import { getData, setData } from '@/lib/supabase';

const LS_KEY = 'ms_tags';

type TagsContextType = {
  tags: Tag[];
  addTag: (t: Omit<Tag, 'id'>) => void;
  deleteTag: (id: string) => void;
};

const TagsContext = createContext<TagsContextType>({
  tags: [],
  addTag: () => {},
  deleteTag: () => {},
});

export function TagsProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getData('tags').then((val) => {
      if (val && Array.isArray(val) && (val as Tag[]).length > 0) {
        const items = val as Tag[];
        setTags(items);
        try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
      } else {
        try {
          const local = localStorage.getItem(LS_KEY);
          if (local) setTags(JSON.parse(local));
        } catch {}
      }
      setLoaded(true);
    }).catch(() => {
      try {
        const local = localStorage.getItem(LS_KEY);
        if (local) setTags(JSON.parse(local));
      } catch {}
      setLoaded(true);
    });
  }, []);

  const save = (items: Tag[]) => {
    setTags(items);
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
    setData('tags', items).catch(() => {});
  };

  const addTag    = (t: Omit<Tag, 'id'>) => save([...tags, { ...t, id: Date.now().toString() }]);
  const deleteTag = (id: string)          => save(tags.filter((t) => t.id !== id));

  if (!loaded) return null;

  return <TagsContext.Provider value={{ tags, addTag, deleteTag }}>{children}</TagsContext.Provider>;
}

export const useTags = () => useContext(TagsContext);
