'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import type { Category } from '@/data/products';

export default function CategoryInit() {
  const params = useSearchParams();
  const { setActiveCategory, setActiveSelection } = useShop();

  useEffect(() => {
    const cat = params.get('cat');
    const sel = params.get('sel');
    if (cat) { setActiveCategory(cat as Category); setActiveSelection(null); }
    if (sel) { setActiveSelection(sel); setActiveCategory(null); }
  }, []);

  return null;
}
