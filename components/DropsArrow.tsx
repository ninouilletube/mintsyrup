'use client';

import { useShop } from '@/context/ShopContext';
import PageArrow from './PageArrow';

export default function DropsArrow() {
  const { activeCategory } = useShop();
  // null géré par VideoHero (flèches dans le hero, scroll-away sur mobile)
  if (activeCategory !== 'drops') return null;
  return (
    <>
      <PageArrow href="/projet" label="Le projet" direction="left" />
      <PageArrow href="/favoris" label="Mes favoris" direction="right" />
    </>
  );
}
