'use client';

import Image from 'next/image';
import { useShop } from '@/context/ShopContext';
import styles from './VideoHero.module.css';

export default function VideoHero() {
  const { activeCategory } = useShop();
  const isSummer = activeCategory === 'ete';

  return (
    <section className={styles.hero}>
      {isSummer ? (
        <Image
          src="/mer.png"
          alt=""
          fill
          className={styles.video}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
      ) : (
        <video
          className={styles.video}
          src="/mintsyrup.mov"
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className={styles.grain} aria-hidden />
      <div className={styles.overlay} aria-hidden />
      <div className={styles.content}>
        <h1 className={styles.title}>Mint Syrup</h1>
      </div>
    </section>
  );
}
