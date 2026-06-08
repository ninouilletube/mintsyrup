'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Tag } from '@/data/tags';

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

const STORAGE_KEY = 'msc_tags';

export function TagsProvider({ children }: { children: React.ReactNode }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTags(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const save = (items: Tag[]) => {
    setTags(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const addTag = (t: Omit<Tag, 'id'>) => save([...tags, { ...t, id: Date.now().toString() }]);
  const deleteTag = (id: string) => save(tags.filter((t) => t.id !== id));

  if (!loaded) return null;

  return <TagsContext.Provider value={{ tags, addTag, deleteTag }}>{children}</TagsContext.Provider>;
}

export const useTags = () => useContext(TagsContext);
