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

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide, { once: true });
      return () => window.removeEventListener('load', hide);
    }
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
