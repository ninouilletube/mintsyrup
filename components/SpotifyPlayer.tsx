'use client';

import { useState } from 'react';
import styles from './SpotifyPlayer.module.css';

export default function SpotifyPlayer() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.tab}>
        <span className={styles.icon}>♫</span>
      </div>
      <div className={styles.panel}>
        <button className={styles.close} onClick={() => setHidden(true)} aria-label="Fermer le lecteur">✕</button>
        <iframe
          src="https://open.spotify.com/embed/playlist/00kyLTAqpS0J9HG4pEqI78?utm_source=generator&theme=0"
          width="100%"
          height="80"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ border: 'none', borderRadius: '8px', display: 'block' }}
        />
      </div>
    </div>
  );
}
