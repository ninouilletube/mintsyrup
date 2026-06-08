'use client';

import { useLang } from '@/context/LangContext';
import { useShop } from '@/context/ShopContext';
import { CATEGORIES } from '@/data/categories';
import type { Category } from '@/data/products';
import styles from './Nav.module.css';
import { getCurrentSeason, type SeasonKey } from '@/lib/season';

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

  return (
    <nav className={styles.nav}>
      <div className={styles.logoWrap}>
        <div className={styles.logo} onClick={() => setActiveCategory(null)}>
          <span className={styles.logoText}>Mint Syrup</span>
        </div>
        <div className={styles.logoDropdown}>
          <a href="/projet" className={styles.logoDropdownItem}>Le projet</a>
        </div>
      </div>

      <div className={styles.links}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.link} ${activeCategory === cat.id && cat.id !== 'ete' ? styles.active : ''} ${cat.id === 'ete' ? SEASON_CLASS[season] : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id as Category)}
          >
            {cat.id === 'ete' ? SEASON_LABEL[season][lang] : (lang === 'fr' ? cat.fr : cat.en)}
          </button>
        ))}
      </div>

      <div className={styles.lang}>
        <button className={`${styles.langBtn} ${lang === 'fr' ? styles.active : ''}`} onClick={() => setLang('fr')}>FR</button>
        <span className={styles.langSep}>/</span>
        <button className={`${styles.langBtn} ${lang === 'en' ? styles.active : ''}`} onClick={() => setLang('en')}>EN</button>
      </div>
    </nav>
  );
}
