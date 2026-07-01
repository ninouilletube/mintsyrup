'use client';

import { useLang } from '@/context/LangContext';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const { lang } = useLang();
  return (
    <footer className={styles.footer}>
      <div className={styles.col}>
        <div className={styles.logoRow}>
          <p className={styles.logo}>Mint Syrup</p>
          <Link href="/archives" className={styles.projetTag}>
            Les Archives
          </Link>
        </div>
        <p className={styles.tagline}>{lang === 'fr' ? 'Mode de seconde main • Pièces uniques' : 'Second-hand fashion • Unique pieces'}</p>
        <div className={styles.links}>
          <a href="https://www.vinted.fr/member/288609653" target="_blank" rel="noopener noreferrer" className={`${styles.link} ${styles.linkVinted}`}>
            {lang === 'fr' ? 'Boutique Vinted' : 'Vinted Shop'}
          </a>
          <a href="https://www.youtube.com/@chatcheper" target="_blank" rel="noopener noreferrer" className={`${styles.link} ${styles.linkYoutube}`}>
            YouTube @chatcheper
          </a>
        </div>
      </div>
      <div className={styles.footerRight}>
        <Link href="/projet#contact" className={styles.contactLink}>Contact</Link>
        <p className={styles.copy}>© 2026 Mint Syrup <a href="/admin" target="_blank" rel="noopener noreferrer" className={styles.secret}>·</a></p>
      </div>
    </footer>
  );
}
