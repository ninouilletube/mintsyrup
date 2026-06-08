'use client';

import { useShop } from '@/context/ShopContext';
import PageArrow from './PageArrow';

export default function DropsArrow() {
  const { activeCategory } = useShop();
  if (activeCategory !== 'drops' && activeCategory !== null) return null;
  return (
    <>
      <PageArrow href="/favoris" label="Mes favoris" direction="left" />
      <PageArrow href="/projet" label="Le projet" direction="right" />
    </>
  );
}
