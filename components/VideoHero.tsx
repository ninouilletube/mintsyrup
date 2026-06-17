'use client';

import { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import PageArrow from './PageArrow';
import styles from './VideoHero.module.css';

export default function VideoHero() {
  const { activeCategory } = useShop();
  const showArrows = activeCategory === 'drops' || activeCategory === null;
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVideoReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={styles.hero}>
      <video
        className={styles.video}
        src="/mintsyrup.mov"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={() => {
          window.dispatchEvent(new Event('video-ready'));
          setVideoReady(true);
        }}
      />
      <div className={styles.grain} aria-hidden />
      <div className={styles.overlay} aria-hidden />
      {/* Écran de chargement mobile uniquement */}
      <div
        className={`${styles.loadingOverlay} ${videoReady ? styles.loadingDone : ''}`}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.webp" alt="" className={styles.loadingLogo} />
        <span className={styles.loadingText}>chargement…</span>
      </div>
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
