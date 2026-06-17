'use client';

import { useState, useEffect, useRef } from 'react';
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
  const navRef = useRef<HTMLElement>(null);

  // Fermer le menu burger au scroll ou au touch en dehors
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onTouch = (e: TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener('scroll', close, { passive: true });
    document.addEventListener('touchstart', onTouch, { passive: true });
    return () => {
      window.removeEventListener('scroll', close);
      document.removeEventListener('touchstart', onTouch);
    };
  }, [menuOpen]);

  const handleLogo = () => {
    setActiveCategory(null);
    setMenuOpen(false);
    if (isHome) {
      window.history.replaceState(window.history.state, '', '/');
    } else {
      router.push('/');
    }
  };

  const handleCategory = (catId: Category) => {
    setMenuOpen(false);
    if (isHome) {
      const newCat = activeCategory === catId ? null : catId;
      setActiveCategory(newCat);
      // Met à jour l'URL via l'API native (sans déclencher un event Next.js)
      // pour que le bouton "retour" restaure la bonne catégorie
      const url = newCat ? `/?cat=${newCat}` : '/';
      window.history.replaceState(window.history.state, '', url);
    } else {
      router.push(`/?cat=${catId}`);
    }
  };

  return (
    <nav className={styles.nav} ref={navRef}>

      {/* ── Mobile : burger seul à gauche ── */}
      <button
        className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
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
          <img src="/coeur.webp" alt="Favoris" className={styles.heartNav} />
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
          {/* SUMMER en premier, puis les autres catégories */}
          {[...CATEGORIES.filter(c => c.id === 'ete'), ...CATEGORIES.filter(c => c.id !== 'ete')].map((cat) => (
            <button
              key={cat.id}
              className={`${styles.link} ${styles.mobileMenuItem} ${cat.id === 'ete' ? `${SEASON_CLASS[season]} ${styles.mobileMenuSeason}` : ''} ${isHome && activeCategory === cat.id && cat.id !== 'ete' ? styles.active : ''}`}
              onClick={() => handleCategory(cat.id as Category)}
            >
              {cat.id === 'ete' ? SEASON_LABEL[season][lang] : (lang === 'fr' ? cat.fr : cat.en)}
            </button>
          ))}
          {/* Coups de cœur */}
          <Link href="/favoris" className={`${styles.link} ${styles.mobileMenuItem} ${styles.mobileFavorisItem} ${pathname === '/favoris' ? styles.active : ''}`} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
            Coups de cœur
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coeur.webp" alt="" className={styles.menuHeart} />
          </Link>
          {/* Le projet */}
          <Link href="/projet" className={`${styles.link} ${styles.mobileMenuItem} ${styles.mobileMenuProjet}`} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
            Le projet
          </Link>
        </div>
      )}
    </nav>
  );
}
