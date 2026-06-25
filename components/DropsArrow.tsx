'use client';

import { useShop } from '@/context/ShopContext';
import PageArrow from './PageArrow';
import pageArrowStyles from './PageArrow.module.css';
import styles from './DropsArrow.module.css';

export default function DropsArrow() {
  const { activeCategory, setActiveCategory } = useShop();

  // Accueil (aucune catégorie) : bouton Derniers drops sur mobile uniquement,
  // hors du hero (pas de transform) ; appel direct au contexte pour fiabilité
  if (activeCategory === null) {
    return (
      <span className={pageArrowStyles.mobileOnly}>
        <PageArrow
          href="/?cat=drops"
          label="Derniers drops"
          direction="right"
          onClick={() => {
            setActiveCategory('drops');
            window.history.replaceState(null, '', '/?cat=drops');
          }}
        />
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
