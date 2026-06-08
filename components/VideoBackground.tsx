'use client';

import styles from './VideoBackground.module.css';

export default function VideoBackground() {
  return (
    <div className={styles.wrapper}>
      <video
        className={styles.video}
        src="/mintsyrup.mov"
        poster="/frames/drops.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className={styles.grain} aria-hidden />
    </div>
  );
}
