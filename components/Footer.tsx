'use client';

import { useLang } from '@/context/LangContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { lang } = useLang();
  return (
    <footer className={styles.footer}>
      <div>
        <p className={styles.logo}>Mint Syrup</p>
        <p className={styles.tagline}>{lang === 'fr' ? 'Mode de seconde main • Pièces uniques' : 'Second-hand fashion • Unique pieces'}</p>
        <div className={styles.links}>
          <a href="https://www.vinted.pt/member/mint-syrup-club" target="_blank" rel="noopener noreferrer" className={styles.link}>
            {lang === 'fr' ? 'Boutique Vinted' : 'Vinted Shop'}
          </a>
          <a href="https://www.youtube.com/@chatcheper" target="_blank" rel="noopener noreferrer" className={styles.link}>
            YouTube @chatcheper
          </a>
          <a href="/projet" className={styles.link}>
            {lang === 'fr' ? 'Le projet' : 'The project'}
          </a>
        </div>
      </div>
      <p className={styles.copy}>© 2026 Mint Syrup <a href="/admin" className={styles.secret}>·</a></p>
    </footer>
  );
}
