'use client';

import { useState } from 'react';
import { useLang } from '@/context/LangContext';
import { useShop } from '@/context/ShopContext';
import { CATEGORIES } from '@/data/categories';
import type { Category } from '@/data/products';
import styles from './Nav.module.css';
import { getCurrentSeason, type SeasonKey } from '@/lib/season';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const SEASON_LABEL: Record<SeasonKey, { fr: string; en: string }> = {
  summer: { fr: 'SUMMER', en: 'SUMMER' },
  autumn: { fr: 'AUTUMN', en: 'AUTUMN' },
  winter: { fr: 'WINTER', en: 'WINTER' },
  spring: { fr: 'SPRING', en: 'SPRING' },
};

const SEASON_CLASS: Record<SeasonKey, string> = {
  summer: styles.linkSummer,
  autumn: styles.linkAutumn,
  winter: styles.linkWinter,
  spring: styles.linkSpring,
};

export default function Nav() {
  const { lang, setLang } = useLang();
  const { activeCategory, setActiveCategory } = useShop();
  const season = getCurrentSeason();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogo = () => {
    setActiveCategory(null);
    setMenuOpen(false);
    if (!isHome) router.push('/');
  };

  const handleCategory = (catId: Category) => {
    setMenuOpen(false);
    if (isHome) {
      setActiveCategory(activeCategory === catId ? null : catId);
    } else {
      router.push(`/?cat=${catId}`);
    }
  };

  return (
    <nav className={styles.nav}>

      {/* ── Mobile : burger seul à gauche ── */}
      <button
        className={styles.burger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <span className={styles.burgerBar} />
        <span className={styles.burgerBar} />
        <span className={styles.burgerBar} />
      </button>

      {/* ── Logo ── */}
      <div className={styles.logoWrap}>
        <div className={styles.logo} onClick={handleLogo}>
          <span className={styles.logoText}>Mint Syrup</span>
        </div>
      </div>

      {/* ── Desktop : liens catégories ── */}
      <div className={styles.links}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.link} ${activeCategory === cat.id && cat.id !== 'ete' ? styles.active : ''} ${cat.id === 'ete' ? SEASON_CLASS[season] : ''}`}
            onClick={() => handleCategory(cat.id as Category)}
          >
            {cat.id === 'ete' ? SEASON_LABEL[season][lang] : (lang === 'fr' ? cat.fr : cat.en)}
          </button>
        ))}
        <Link href="/favoris" className={styles.heartLink}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coeur.png" alt="Favoris" className={styles.heartNav} />
        </Link>
      </div>

      {/* ── Desktop : langue ── */}
      <div className={styles.lang}>
        <button className={`${styles.langBtn} ${lang === 'fr' ? styles.active : ''}`} onClick={() => setLang('fr')}>FR</button>
        <span className={styles.langSep}>/</span>
        <button className={`${styles.langBtn} ${lang === 'en' ? styles.active : ''}`} onClick={() => setLang('en')}>EN</button>
      </div>

      {/* ── Mobile : menu déroulant (toutes catégories + favoris) ── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {/* Saison */}
          <button
            className={`${styles.link} ${styles.mobileMenuItem} ${SEASON_CLASS[season]}`}
            onClick={() => handleCategory('ete' as Category)}
          >
            {SEASON_LABEL[season][lang]}
          </button>
          {/* Autres catégories */}
          {CATEGORIES.filter((cat) => cat.id !== 'ete').map((cat) => (
            <button
              key={cat.id}
              className={`${styles.link} ${styles.mobileMenuItem} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => handleCategory(cat.id as Category)}
            >
              {lang === 'fr' ? cat.fr : cat.en}
            </button>
          ))}
          {/* Favoris */}
          <Link href="/favoris" className={`${styles.link} ${styles.mobileMenuItem} ${styles.mobileFavorisItem}`} onClick={() => setMenuOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coeur.png" alt="" className={styles.menuHeart} />
            Mes favoris
          </Link>
        </div>
      )}
    </nav>
  );
}
