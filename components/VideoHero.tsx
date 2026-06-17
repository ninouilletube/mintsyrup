'use client';

import { useShop } from '@/context/ShopContext';
import PageArrow from './PageArrow';
import styles from './VideoHero.module.css';

export default function VideoHero() {
  const { activeCategory } = useShop();
  const showArrows = activeCategory === 'drops' || activeCategory === null;

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
      {showArrows && (
        <>
          <PageArrow href="/projet" label="Le projet" direction="left" />
          <PageArrow href="/favoris" label="Mes favoris" direction="right" />
        </>
      )}
    </section>
  );
}
