'use client';

import { useState } from 'react';
import styles from './VideoBackground.module.css';

export default function VideoBackground() {
  const [ready, setReady] = useState(false);

  return (
    <div className={styles.wrapper}>
      <video
        className={`${styles.video} ${ready ? styles.videoReady : ''}`}
        src="/mintsyrup.mov"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 4; }}
        onCanPlay={() => setReady(true)}
      />
      <div className={styles.grain} aria-hidden />
    </div>
  );
}
