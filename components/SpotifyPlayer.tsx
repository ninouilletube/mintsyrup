'use client';

import { useEffect, useState } from 'react';
import styles from './SpotifyPlayer.module.css';

const PLAYLIST_ID = '00kyLTAqpS0J9HG4pEqI78';

export default function SpotifyPlayer() {
  const [hidden, setHidden] = useState(false);
  const [cover, setCover] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${PLAYLIST_ID}`)
      .then((r) => r.json())
      .then((d) => setCover(d.thumbnail_url))
      .catch(() => {});
  }, []);

  if (hidden) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.tab}>
        <span className={styles.icon}>♫</span>
      </div>
      <div className={styles.panel}>
        <button className={styles.close} onClick={() => setHidden(true)} aria-label="Fermer">✕</button>
        <div className={styles.content}>
          {cover && (
            <div className={styles.coverWrap}>
              <img src={cover} alt="Playlist" className={styles.cover} />
            </div>
          )}
          <iframe
            src={`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className={styles.iframe}
            title="Spotify"
          />
        </div>
      </div>
    </div>
  );
}
