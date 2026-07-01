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
  const [infoOpen, setInfoOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipInnerRef = useRef<HTMLDivElement>(null);

  // Scroll pour révéler le bas du bloc au déploiement
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const targetScrollY = window.scrollY + rect.bottom - window.innerHeight + 24;
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [open]);

  // Scroll pour révéler le tooltip (i) quand il s'ouvre
  useEffect(() => {
    if (!infoOpen) return;
    const timer = setTimeout(() => {
      if (!tooltipInnerRef.current) return;
      const rect = tooltipInnerRef.current.getBoundingClientRect();
      const targetScrollY = window.scrollY + rect.bottom - window.innerHeight + 24;
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(timer);
  }, [infoOpen]);

  return (
    <div ref={wrapRef} className={`${styles.accordionWrap} ${open ? styles.accordionOpen : ''}`}>
      <div className={styles.accordionHeader}>
        <button
          className={styles.accordionToggle}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {title && <h2 className={styles.blockTitle}>{title}</h2>}
          <span className={styles.accordionArrow} aria-hidden="true">
            {open ? '▲' : '▼'}
          </span>
        </button>

        {tooltip3 && (
          <div className={`${styles.infoWrap} ${infoOpen ? styles.infoActive : ''}`}>
            <span
              className={styles.infoIcon}
              onClick={() => setInfoOpen(!infoOpen)}
            >i</span>
            <div className={styles.infoTooltip}>
              <div ref={tooltipInnerRef} className={styles.infoTooltipInner}>
                <span>{tooltip3}</span>
                <a
                  href="https://www.vinted.fr/member/3125590380"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.infoLink}
                >
                  Voir mon profil Vinted
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className={styles.accordionBody}>
          {text && text.split('\n').filter(Boolean).map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}
