'use client';

import { useState, useRef } from 'react';
import styles from './SpotifyPlayer.module.css';

const PLAYLIST_ID = '0KLtlLeLd6BXTIZjpgGQ0E';

export default function SpotifyPlayer() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleWrapLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };
  const handlePanelEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  if (hidden) return null;

  return (
    <div className={styles.wrap} onMouseLeave={handleWrapLeave}>
      <div className={styles.tab} onMouseEnter={handleTabEnter}>
        <span className={styles.icon}>♫</span>
      </div>
      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`} onMouseEnter={handlePanelEnter}>
        <p className={styles.tip}>Assurez-vous d&apos;être connecté.e au web player Spotify pour profiter de cette playlist &lt;3</p>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`}
          width="320"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className={styles.iframe}
          title="Spotify"
        />
      </div>
    </div>
  );
}
