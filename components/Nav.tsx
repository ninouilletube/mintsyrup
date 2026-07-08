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
import CartIcon from './CartIcon';
import AuthModal from './AuthModal';
import { useAuth } from '@/context/AuthContext';

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
  const { user, profile, signOut } = useAuth();
  const season = getCurrentSeason();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState<'categories' | 'selections' | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) { setMobileOpenSection(null); return; }
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
    // Navigation complète pour éviter que le router cache du App Router
    // restaure l'ancienne catégorie via CategoryInit non relancé
    else window.location.assign('/');
  };

  const handleCategory = (catId: Category | 'all') => {
    setMenuOpen(false);
    setActiveSelection(null);
    if (isHome) {
      const newCat = activeCategory === catId && !activeSelection ? null : catId;
      setActiveCategory(newCat);
      window.history.replaceState(window.history.state, '', newCat ? `/?cat=${newCat}` : '/');
    } else {
      setActiveCategory(catId);
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
  const isCatActive    = isHome && (CATEGORY_CATS.includes(activeCategory as Category) || activeCategory === 'all') && !activeSelection;
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

      {/* ── Logo + Le projet ── */}
      <div className={styles.logoGroup}>
        <div className={styles.logoWrap}>
          <div className={styles.logo} onClick={handleLogo}>
            <span className={styles.logoText}>Mint Syrup</span>
          </div>
        </div>
        <Link
          href="/projet"
          className={`${styles.link} ${styles.projetDesktopLink} ${pathname === '/projet' ? styles.active : ''}`}
        >
          Le projet
        </Link>
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
            <button
              className={`${styles.dropItem} ${isHome && activeCategory === 'all' && !activeSelection ? styles.dropItemActive : ''}`}
              onClick={() => handleCategory('all')}
            >
              Tout voir
            </button>
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

      {/* Icônes — tout à droite */}
      <div className={styles.rightSection}>
        <div className={styles.navIcons}>
          {user ? (
            <div className={styles.accountWrap}>
              <Link href="/profil" className={styles.accountBtn} title="Mon profil">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className={styles.accountAvatar} />
                  : <img src="/icon-profil.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                }
              </Link>
              <div className={styles.accountDrop}>
                <span className={styles.accountDropUsername}>{profile?.username}</span>
                <Link href="/profil" className={styles.accountDropItem}>Mon profil</Link>
                <Link href="/ma-wishlist" className={styles.accountDropItem}>Ma wishlist</Link>
                <Link href="/paiement-confirme" className={styles.accountDropItem}>Mes commandes</Link>
                <button className={styles.accountDropItem} onClick={() => signOut()}>Déconnexion</button>
              </div>
            </div>
          ) : (
            <button className={styles.accountBtn} onClick={() => setAuthOpen(true)} title="Se connecter">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-profil.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </button>
          )}
          <CartIcon />
        </div>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* ── Mobile : menu déroulant ── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>

          {/* Derniers drops */}
          <button
            className={`${styles.mobileMenuItem} ${isDropsActive ? styles.active : ''}`}
            onClick={() => handleCategory('drops')}
          >
            Derniers drops
          </button>

          {/* Catégories — accordéon */}
          <button
            className={`${styles.mobileMenuItem} ${styles.mobileMenuExpandable} ${isCatActive ? styles.active : ''}`}
            onClick={() => setMobileOpenSection(mobileOpenSection === 'categories' ? null : 'categories')}
          >
            Catégories
            <span className={`${styles.mobileMenuCaret} ${mobileOpenSection === 'categories' ? styles.mobileMenuCaretOpen : ''}`}>▾</span>
          </button>
          {mobileOpenSection === 'categories' && (
            <div className={styles.mobileMenuSub}>
              <button
                className={`${styles.mobileMenuSubItem} ${isHome && activeCategory === 'all' && !activeSelection ? styles.mobileMenuSubItemActive : ''}`}
                onClick={() => handleCategory('all')}
              >
                Tout voir
              </button>
              {CATEGORY_CATS.map((catId) => {
                const cat = CATEGORIES.find((c) => c.id === catId)!;
                return (
                  <button
                    key={catId}
                    className={`${styles.mobileMenuSubItem} ${isHome && activeCategory === catId && !activeSelection ? styles.mobileMenuSubItemActive : ''}`}
                    onClick={() => handleCategory(catId)}
                  >
                    {cat.fr}
                  </button>
                );
              })}
            </div>
          )}

          {/* Sélections — accordéon */}
          <button
            className={`${styles.mobileMenuItem} ${styles.mobileMenuExpandable} ${isSelActive || isSummerActive ? styles.active : ''}`}
            onClick={() => setMobileOpenSection(mobileOpenSection === 'selections' ? null : 'selections')}
          >
            Sélections
            <span className={`${styles.mobileMenuCaret} ${mobileOpenSection === 'selections' ? styles.mobileMenuCaretOpen : ''}`}>▾</span>
          </button>
          {mobileOpenSection === 'selections' && (
            <div className={styles.mobileMenuSub}>
              <button
                className={`${styles.mobileMenuSubItem} ${styles.mobileMenuSubSummer} ${isSummerActive ? styles.mobileMenuSubItemActive : ''}`}
                onClick={() => handleCategory('ete')}
              >
                {SEASON_LABEL[season]}
              </button>
              {selections.map((sel) => (
                <button
                  key={sel.id}
                  className={`${styles.mobileMenuSubItem} ${activeSelection === sel.id ? styles.mobileMenuSubItemActive : ''}`}
                  onClick={() => handleSelection(sel.id)}
                >
                  {sel.name}
                </button>
              ))}
              <Link
                href="/favoris"
                className={`${styles.mobileMenuSubItem} ${pathname === '/favoris' ? styles.mobileMenuSubItemActive : ''}`}
                onClick={() => { setActiveCategory(null); setActiveSelection(null); setMenuOpen(false); }}
              >
                Coups de cœur
              </Link>
            </div>
          )}

          <Link
            href="/favoris"
            className={`${styles.mobileMenuItem} ${styles.menuHeart} ${pathname === '/favoris' ? styles.active : ''}`}
            onClick={() => { setActiveCategory(null); setActiveSelection(null); setMenuOpen(false); }}
          >
            ♥ Coups de cœur
          </Link>

          <Link
            href="/projet"
            className={`${styles.mobileMenuItem} ${styles.mobileMenuProjet} ${pathname === '/projet' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Le projet
          </Link>
        </div>
      )}
    </nav>
  );
}
