'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { useAuth } from '@/context/AuthContext';
import PageArrow from './PageArrow';
import AuthModal from './AuthModal';
import pageArrowStyles from './PageArrow.module.css';
import styles from './DropsArrow.module.css';

export default function DropsArrow() {
  const { activeCategory, setActiveCategory } = useShop();
  const { user } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  const handleWishlist = () => {
    if (!user) { setAuthOpen(true); } else { router.push('/ma-wishlist'); }
  };

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
      <>
        <div className={styles.wrap}>
          <PageArrow href="/projet" label="Le projet" direction="left" />
          <span className={pageArrowStyles.desktopOnly}>
            <PageArrow href="/ma-wishlist" label="Ma wishlist" direction="right" onClick={handleWishlist} />
          </span>
        </div>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </>
    );
  }

  return null;
}
