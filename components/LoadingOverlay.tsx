'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function LoadingOverlay() {
  const [initVisible, setInitVisible] = useState(true);
  const [initFading, setInitFading] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const pathname = usePathname();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Chargement initial (attend la vidéo) ──
  useEffect(() => {
    const hide = () => {
      setInitFading(true);
      setTimeout(() => setInitVisible(false), 400);
    };
    window.addEventListener('video-ready', hide, { once: true });
    const fallback = setTimeout(hide, 4000);
    return () => {
      window.removeEventListener('video-ready', hide);
      clearTimeout(fallback);
    };
  }, []);

  // ── Afficher l'overlay dès qu'un lien interne est cliqué ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto') ||
        href.startsWith('tel')
      ) return;
      if (href !== pathname) setNavVisible(true);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  // ── Masquer quand la nouvelle page est prête (pathname change) ──
  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setNavVisible(false), 150);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [pathname]);

  if (!initVisible && !navVisible) return null;

  const isFadingInit = initFading && !navVisible;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'white',
      zIndex: 9999,
      opacity: isFadingInit ? 0 : 1,
      transition: isFadingInit ? 'opacity 0.4s ease' : 'none',
      pointerEvents: isFadingInit ? 'none' : 'all',
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
        <div style={{
          position: 'absolute',
          inset: '-4px',
          borderRadius: '50%',
          background: 'conic-gradient(transparent 60%, #09B1BA 80%, transparent 100%)',
          animation: 'spin-glow 1.2s linear infinite',
          filter: 'blur(2px)',
        }} />
        <div style={{
          position: 'absolute',
          inset: '2px',
          borderRadius: '50%',
          background: 'white',
          zIndex: 1,
        }} />
        <img
          src="/icon.webp"
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
