'use client';

import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/context/LangContext';
import { useShop } from '@/context/ShopContext';
import { useSelections } from '@/context/SelectionsContext';
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

const CATEGORY_CATS: Category[] = ['manteaux', 'hauts', 'bas', 'robes', 'chaussures', 'accessoires'];

export default function Nav() {
  const { lang, setLang } = useLang();
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
          {lang === 'fr' ? 'Derniers drops' : 'Latest drops'}
        </button>

        {/* Summer */}
        <button
          className={`${styles.link} ${SEASON_CLASS[season]} ${isSummerActive ? styles.active : ''}`}
          onClick={() => handleCategory('ete')}
        >
          {SEASON_LABEL[season][lang]}
        </button>

        {/* Catégories */}
        <div className={styles.dropWrap}>
          <button className={`${styles.link} ${isCatActive ? styles.active : ''}`}>
            {lang === 'fr' ? 'Catégories' : 'Categories'}
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
                  {lang === 'fr' ? cat.fr : cat.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sélections */}
        <div className={styles.dropWrap}>
          <button className={`${styles.link} ${isSelActive ? styles.active : ''}`}>
            {lang === 'fr' ? 'Sélections' : 'Selections'}
            <span className={styles.dropCaret}>▾</span>
          </button>
          <div className={styles.drop}>
            {selections.length === 0 ? (
              <span className={styles.dropEmpty}>
                {lang === 'fr' ? 'Aucune sélection' : 'No selections yet'}
              </span>
            ) : (
              selections.map((sel) => (
                <button
                  key={sel.id}
                  className={`${styles.dropItem} ${activeSelection === sel.id ? styles.dropItemActive : ''}`}
                  onClick={() => handleSelection(sel.id)}
                >
                  {sel.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Coups de cœur */}
        <Link
          href="/favoris"
          className={`${styles.link} ${styles.heartLinkDesktop} ${pathname === '/favoris' ? styles.active : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/coeur.webp" alt="" className={styles.heartNav} />
          <span>Coups de cœur</span>
        </Link>

        {/* Le projet */}
        <Link
          href="/projet"
          className={`${styles.link} ${styles.projetDesktopLink} ${pathname === '/projet' ? styles.active : ''}`}
        >
          Le projet
        </Link>
      </div>

      {/* ── Desktop : langue ── */}
      <div className={styles.lang}>
        <button className={`${styles.langBtn} ${lang === 'fr' ? styles.active : ''}`} onClick={() => setLang('fr')}>FR</button>
        <span className={styles.langSep}>/</span>
        <button className={`${styles.langBtn} ${lang === 'en' ? styles.active : ''}`} onClick={() => setLang('en')}>EN</button>
      </div>

      {/* ── Mobile : menu déroulant ── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {[...CATEGORIES.filter(c => c.id === 'ete'), ...CATEGORIES.filter(c => c.id !== 'ete')].map((cat) => (
            <button
              key={cat.id}
              className={`${styles.link} ${styles.mobileMenuItem} ${cat.id === 'ete' ? `${SEASON_CLASS[season]} ${styles.mobileMenuSeason}` : ''} ${isHome && activeCategory === cat.id && cat.id !== 'ete' && !activeSelection ? styles.active : ''}`}
              onClick={() => handleCategory(cat.id as Category)}
            >
              {cat.id === 'ete' ? SEASON_LABEL[season][lang] : (lang === 'fr' ? cat.fr : cat.en)}
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
