'use client';

import { useEffect, useState } from 'react';

export default function LoadingOverlay() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const hide = () => {
      setFading(true);
      setTimeout(() => setVisible(false), 400);
    };

    window.addEventListener('video-ready', hide, { once: true });
    // Fallback : si pas de vidéo sur la page, on cache après 4s max
    const fallback = setTimeout(hide, 4000);
    return () => {
      window.removeEventListener('video-ready', hide);
      clearTimeout(fallback);
    };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'white',
      zIndex: 9999,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.4s ease',
      pointerEvents: fading ? 'none' : 'all',
    }} />
  );
}
