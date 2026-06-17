'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SpotifyPlayer.module.css';

const PLAYLIST_ID = '00kyLTAqpS0J9HG4pEqI78';
const EMBED_SRC = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`;

export default function SpotifyPlayer() {
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${PLAYLIST_ID}`)
      .then((r) => r.json())
      .then((d) => setCover(d.thumbnail_url))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://open.spotify.com') return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.type === 'ready') setReady(true);
        if (data?.type === 'playback_update') {
          setPlaying(!data.payload?.isPaused);
        }
      } catch {}
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const send = (cmd: string) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ command: cmd }), '*');
  };

  const handlePlay = () => {
    if (!ready) {
      setReady(true);
    }
    send('toggle_shuffle');
    send('play');
    setPlaying(true);
  };

  const handlePause = () => {
    send('pause');
    setPlaying(false);
  };

  if (hidden) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.tab} aria-label="Musique">
        <span className={styles.icon}>♫</span>
      </div>
      <div className={styles.panel}>
        {/* iframe audio caché */}
        <iframe
          ref={iframeRef}
          src={EMBED_SRC}
          className={styles.hiddenIframe}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title="Spotify"
        />

        <button className={styles.close} onClick={() => setHidden(true)} aria-label="Fermer">✕</button>

        <div className={styles.content}>
          <div className={styles.coverWrap}>
            {cover
              ? <img src={cover} alt="Playlist" className={styles.cover} />
              : <div className={styles.coverFallback}>♫</div>
            }
          </div>

          <div className={styles.controls}>
            <button
              className={`${styles.btn} ${playing ? styles.btnActive : ''}`}
              onClick={handlePlay}
              aria-label="Lecture aléatoire"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 4l4 4-4 4V9h-1.6c-1.3 0-2.4.7-3.1 1.8l-3.2 5.4C9.3 17.3 8.2 18 6.9 18H2v-2h4.9c.7 0 1.3-.4 1.7-1l3.2-5.4C12.7 8.4 14.3 7.5 16 7.5H18V4zM2 7h4.9c.7 0 1.3.4 1.7 1l.6 1 1.2-2c-.9-1.1-2.1-2-3.5-2H2v2zm13.2 8.2l.7 1.2c.4.6 1 1 1.7 1H18v-3l4 4-4 4v-3h-1.4c-1.7 0-3.3-.9-4.2-2.3l-.7-1.2 1.5-2.7z"/>
              </svg>
              Aléatoire
            </button>

            <button
              className={styles.btnPause}
              onClick={handlePause}
              aria-label="Pause"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
