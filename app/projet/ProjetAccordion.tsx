'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './projet.module.css';

interface Props {
  title: string | null;
  text: string | null;
  tooltip3: string | null;
}

export default function ProjetAccordion({ title, text, tooltip3 }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      // Scroll pour que le bas du bloc soit à 24px du bas de l'écran
      const targetScrollY = window.scrollY + rect.bottom - window.innerHeight + 24;
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div ref={wrapRef} className={`${styles.accordionWrap} ${open ? styles.accordionOpen : ''}`}>
      <button
        className={styles.accordionHeader}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {title && <h2 className={styles.blockTitle}>{title}</h2>}
        <span className={styles.accordionArrow} aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className={styles.accordionBody}>
          {/* Texte d'abord */}
          {text && text.split('\n').filter(Boolean).map((p, j) => (
            <p key={j}>{p}</p>
          ))}
          {/* (i) en bas à droite */}
          {tooltip3 && (
            <div className={styles.infoWrap}>
              <span className={styles.infoIcon}>i</span>
              <div className={styles.infoTooltip}>
                <div className={styles.infoTooltipInner}>
                  <span>{tooltip3}</span>
                  <a
                    href="https://www.vinted.pt/member/3125590380"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.infoLink}
                  >
                    Voir mon profil Vinted ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
