'use client';

import { useShop } from '@/context/ShopContext';
import styles from './VideoHero.module.css';

export default function VideoHero() {
  const { activeCategory } = useShop();

  return (
    <section className={styles.hero}>
      <video
        className={styles.video}
        src="/mintsyrup.mov"
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => window.dispatchEvent(new Event('video-ready'))}
      />
      <div className={styles.grain} aria-hidden />
      <div className={styles.overlay} aria-hidden />
      <div className={styles.content}>
        <h1 className={`${styles.title} ${activeCategory === 'drops' ? styles.titleHidden : ''}`}>
          Mint Syrup
        </h1>
      </div>
    </section>
  );
}
