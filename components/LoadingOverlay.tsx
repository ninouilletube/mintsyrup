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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes spin-glow {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ position: 'relative', width: '96px', height: '96px' }}>
        {/* Anneau tournant */}
        <div style={{
          position: 'absolute',
          inset: '-4px',
          borderRadius: '50%',
          background: 'conic-gradient(transparent 60%, #09B1BA 80%, transparent 100%)',
          animation: 'spin-glow 1.2s linear infinite',
          filter: 'blur(2px)',
        }} />
        {/* Masque blanc pour l'effet anneau */}
        <div style={{
          position: 'absolute',
          inset: '2px',
          borderRadius: '50%',
          background: 'white',
          zIndex: 1,
        }} />
        {/* Logo */}
        <img
          src="/icon.png"
          alt="Mint Syrup"
          style={{
            position: 'absolute',
            inset: '3px',
            width: 'calc(100% - 6px)',
            height: 'calc(100% - 6px)',
            borderRadius: '50%',
            objectFit: 'cover',
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}
