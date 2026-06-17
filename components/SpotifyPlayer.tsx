'use client';

import { useState } from 'react';
import styles from './SpotifyPlayer.module.css';

const PLAYLIST_ID = '00kyLTAqpS0J9HG4pEqI78';

export default function SpotifyPlayer() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.tab}>
        <span className={styles.icon}>♫</span>
      </div>
      <div className={styles.panel}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`}
          width="280"
          height="80"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className={styles.iframe}
          title="Spotify"
        />
      </div>
    </div>
  );
}
