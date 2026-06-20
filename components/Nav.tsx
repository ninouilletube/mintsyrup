'use client';

import { useState, useEffect, useRef } from 'react';
import { useShop } from '@/context/ShopContext';
import { useSelections } from '@/context/SelectionsContext';
import { CATEGORIES } from '@/data/categories';
import type { Category } from '@/data/products';
import styles from './Nav.module.css';
import { getCurrentSeason, type SeasonKey } from '@/lib/season';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const SEASON_LABEL: Record<SeasonKey, string> = {
  summer: 'SUMMER',
  autumn: 'AUTUMN',
  winter: 'WINTER',
  spring: 'SPRING',
};

const SEASON_CLASS: Record<SeasonKey, string> = {
  summer: styles.linkSummer,
  autumn: styles.linkAutumn,
  winter: styles.linkWinter,
  spring: styles.linkSpring,
};

const CATEGORY_CATS: Category[] = ['manteaux', 'hauts', 'bas', 'robes', 'chaussures', 'accessoires'];

export default function Nav() {
  const { activeCategory, setActiveCategory, activeSelection, setActiveSelection } = useShop();
  const { selections } = useSelections();
  const season = getCurrentSeason();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

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
    setActiveSelection(null);
    setMenuOpen(false);
    if (isHome) window.history.replaceState(window.history.state, '', '/');
    else router.push('/');
  };

  const handleCategory = (catId: Category) => {
    setMenuOpen(false);
    setActiveSelection(null);
    if (isHome) {
      const newCat = activeCategory === catId && !activeSelection ? null : catId;
      setActiveCategory(newCat);
      window.history.replaceState(window.history.state, '', newCat ? `/?cat=${newCat}` : '/');
    } else {
      router.push(`/?cat=${catId}`);
    }
  };

  const handleSelection = (selId: string) => {
    setMenuOpen(false);
    setActiveCategory(null);
    if (isHome) {
      const newSel = activeSelection === selId ? null : selId;
      setActiveSelection(newSel);
      window.history.replaceState(window.history.state, '', newSel ? `/?sel=${newSel}` : '/');
    } else {
      setActiveSelection(selId);
      router.push(`/?sel=${selId}`);
    }
  };

  const isDropsActive  = isHome && activeCategory === 'drops' && !activeSelection;
  const isSummerActive = isHome && activeCategory === 'ete'   && !activeSelection;
  const isCatActive    = isHome && CATEGORY_CATS.includes(activeCategory as Category) && !activeSelection;
  const isSelActive    = activeSelection !== null;

  return (
    <nav className={styles.nav} ref={navRef}>

      {/* ── Mobile : burger ── */}
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

      {/* ── Desktop : nav restructurée ── */}
      <div className={styles.links}>

        {/* Derniers drops */}
        <button
          className={`${styles.link} ${isDropsActive ? styles.active : ''}`}
          onClick={() => handleCategory('drops')}
        >
          Derniers drops
        </button>

        {/* Catégories */}
        <div className={styles.dropWrap}>
          <button className={`${styles.link} ${isCatActive ? styles.active : ''}`}>
            Catégories
            <span className={styles.dropCaret}>▾</span>
          </button>
          <div className={styles.drop}>
            {CATEGORY_CATS.map((catId) => {
              const cat = CATEGORIES.find((c) => c.id === catId)!;
              return (
                <button
                  key={catId}
                  className={`${styles.dropItem} ${isHome && activeCategory === catId && !activeSelection ? styles.dropItemActive : ''}`}
                  onClick={() => handleCategory(catId)}
                >
                  {cat.fr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sélections */}
        <div className={styles.dropWrap}>
          <button className={`${styles.link} ${isSelActive || isSummerActive || pathname === '/favoris' ? styles.active : ''}`}>
            Sélections
            <span className={styles.dropCaret}>▾</span>
          </button>
          <div className={styles.drop}>
            {/* Summer en tête */}
            <button
              className={`${styles.dropItem} ${styles.dropItemSummer} ${isSummerActive ? styles.dropItemActive : ''}`}
              onClick={() => handleCategory('ete')}
            >
              {SEASON_LABEL[season]}
            </button>
            {selections.map((sel) => (
              <button
                key={sel.id}
                className={`${styles.dropItem} ${activeSelection === sel.id && pathname !== '/favoris' ? styles.dropItemActive : ''}`}
                onClick={() => handleSelection(sel.id)}
              >
                {sel.name}
              </button>
            ))}
            <Link
              href="/favoris"
              className={`${styles.dropItemLink} ${pathname === '/favoris' ? styles.dropItemActive : ''}`}
              onClick={() => { setActiveCategory(null); setActiveSelection(null); }}
            >
              Coups de cœur
            </Link>
          </div>
        </div>
      </div>

      {/* Le projet — tout à droite */}
      <Link
        href="/projet"
        className={`${styles.link} ${styles.projetDesktopLink} ${pathname === '/projet' ? styles.active : ''}`}
      >
        Le projet
      </Link>

      {/* ── Mobile : menu déroulant ── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {[...CATEGORIES.filter(c => c.id === 'ete'), ...CATEGORIES.filter(c => c.id !== 'ete')].map((cat) => (
            <button
              key={cat.id}
              className={`${styles.link} ${styles.mobileMenuItem} ${cat.id === 'ete' ? `${SEASON_CLASS[season]} ${styles.mobileMenuSeason}` : ''} ${isHome && activeCategory === cat.id && cat.id !== 'ete' && !activeSelection ? styles.active : ''}`}
              onClick={() => handleCategory(cat.id as Category)}
            >
              {cat.id === 'ete' ? SEASON_LABEL[season] : cat.fr}
            </button>
          ))}
          <Link href="/favoris" className={`${styles.link} ${styles.mobileMenuItem} ${styles.mobileFavorisItem} ${pathname === '/favoris' ? styles.active : ''}`} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
            Coups de cœur
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coeur.webp" alt="" className={styles.menuHeart} />
          </Link>
          <Link href="/projet" className={`${styles.link} ${styles.mobileMenuItem} ${styles.mobileMenuProjet}`} onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
            Le projet
          </Link>
        </div>
      )}
    </nav>
  );
}
