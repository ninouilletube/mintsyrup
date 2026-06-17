'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import type { Category } from '@/data/products';

export default function CategoryInit() {
  const params = useSearchParams();
  const { setActiveCategory } = useShop();

  useEffect(() => {
    const cat = params.get('cat');
    setActiveCategory(cat ? (cat as Category) : null);
  }, [params]);

  return null;
}
