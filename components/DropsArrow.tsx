'use client';

import { useShop } from '@/context/ShopContext';
import PageArrow from './PageArrow';
import pageArrowStyles from './PageArrow.module.css';

export default function DropsArrow() {
  const { activeCategory } = useShop();
  // null géré par VideoHero (flèches dans le hero, scroll-away sur mobile)
  if (activeCategory !== 'drops') return null;
  return (
    <>
      <PageArrow href="/projet" label="Le projet" direction="left" />
      <span className={pageArrowStyles.desktopOnly}>
        <PageArrow href="/favoris" label="Mes favoris" direction="right" />
      </span>
      <span className={pageArrowStyles.mobileOnly}>
        <PageArrow href="/?cat=drops" label="Derniers drops" direction="right" />
      </span>
    </>
  );
}
