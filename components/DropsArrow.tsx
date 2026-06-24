'use client';

import { useShop } from '@/context/ShopContext';
import PageArrow from './PageArrow';
import pageArrowStyles from './PageArrow.module.css';
import styles from './DropsArrow.module.css';

export default function DropsArrow() {
  const { activeCategory } = useShop();

  // Accueil (aucune catégorie) : flèche Derniers drops sur mobile uniquement,
  // hors du hero pour éviter le containing block créé par ses transforms
  if (activeCategory === null) {
    return (
      <span className={pageArrowStyles.mobileOnly}>
        <PageArrow href="/?cat=drops" label="Derniers drops" direction="right" />
      </span>
    );
  }

  // Drops actif : flèches desktop uniquement (cachées sur mobile)
  if (activeCategory === 'drops') {
    return (
      <div className={styles.wrap}>
        <PageArrow href="/projet" label="Le projet" direction="left" />
        <span className={pageArrowStyles.desktopOnly}>
          <PageArrow href="/favoris" label="Mes favoris" direction="right" />
        </span>
      </div>
    );
  }

  return null;
}
