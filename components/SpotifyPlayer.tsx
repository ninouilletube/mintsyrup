'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SpotifyPlayer.module.css';

const PLAYLIST_URI = 'spotify:playlist:00kyLTAqpS0J9HG4pEqI78';

type IFrameAPI = {
  createController: (el: HTMLElement, opts: object, cb: (ctrl: EmbedController) => void) => void;
};
type EmbedController = {
  play: () => void;
  pause: () => void;
  setShuffle?: (v: boolean) => void;
  addListener: (event: string, cb: (data: { isPaused?: boolean }) => void) => void;
};

declare global {
  interface Window { onSpotifyIframeApiReady?: (api: IFrameAPI) => void; }
}

// module-level so the API loads once even if component remounts
let _api: IFrameAPI | null = null;
const _waiting: Array<(api: IFrameAPI) => void> = [];

function getApi(cb: (api: IFrameAPI) => void) {
  if (_api) { cb(_api); return; }
  _waiting.push(cb);
  if (!document.getElementById('spotify-iframe-api')) {
    window.onSpotifyIframeApiReady = (api) => {
      _api = api;
      _waiting.splice(0).forEach((fn) => fn(api));
    };
    const s = document.createElement('script');
    s.id = 'spotify-iframe-api';
    s.src = 'https://open.spotify.com/embed/iframe-api/v1';
    s.async = true;
    document.head.appendChild(s);
  }
}

export default function SpotifyPlayer() {
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<EmbedController | null>(null);

  useEffect(() => {
    getApi((api) => {
      if (!embedRef.current) return;
      api.createController(
        embedRef.current,
        { uri: PLAYLIST_URI, width: '100%', height: 80 },
        (ctrl) => {
          ctrlRef.current = ctrl;
          setReady(true);
          ctrl.addListener('playback_update', (d) => {
            setPlaying(!d.isPaused);
          });
        }
      );
    });
  }, []);

  const handlePlay = () => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    ctrl.setShuffle?.(true);
    ctrl.play();
  };

  const handlePause = () => {
    ctrlRef.current?.pause();
  };

  if (hidden) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.tab}>
        <span className={styles.icon}>♫</span>
      </div>
      <div className={styles.panel}>
        <button className={styles.close} onClick={() => setHidden(true)} aria-label="Fermer">✕</button>
        <div className={styles.content}>
          {/* embed Spotify rendu par l'API — barre compacte */}
          <div ref={embedRef} className={styles.embedTarget} />

          <div className={styles.controls}>
            <button
              onClick={handlePlay}
              disabled={!ready}
              className={`${styles.btn} ${playing ? styles.btnActive : ''}`}
              aria-label="Lecture aléatoire"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 4l4 4-4 4V9h-1.6c-1.3 0-2.4.7-3.1 1.8l-3.2 5.4C9.3 17.3 8.2 18 6.9 18H2v-2h4.9c.7 0 1.3-.4 1.7-1l3.2-5.4C12.7 8.4 14.3 7.5 16 7.5H18V4zM2 7h4.9c.7 0 1.3.4 1.7 1l.6 1 1.2-2C9.5 5.9 8.3 5 6.9 5H2v2zm13.2 8.2.7 1.2c.4.6 1 1 1.7 1H18v-3l4 4-4 4v-3h-1.4c-1.7 0-3.3-.9-4.2-2.3l-.7-1.2 1.5-2.7z"/>
              </svg>
              Aléatoire
            </button>
            <button
              onClick={handlePause}
              disabled={!playing}
              className={styles.btnPause}
              aria-label="Pause"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
