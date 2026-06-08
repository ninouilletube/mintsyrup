'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Tag } from '@/data/tags';
import { getData, setData } from '@/lib/supabase';

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
      if (val) setTags(val as Tag[]);
      setLoaded(true);
    });
  }, []);

  const save = (items: Tag[]) => {
    setTags(items);
    setData('tags', items);
  };

  const addTag = (t: Omit<Tag, 'id'>) => save([...tags, { ...t, id: Date.now().toString() }]);
  const deleteTag = (id: string) => save(tags.filter((t) => t.id !== id));

  if (!loaded) return null;

  return <TagsContext.Provider value={{ tags, addTag, deleteTag }}>{children}</TagsContext.Provider>;
}

export const useTags = () => useContext(TagsContext);
