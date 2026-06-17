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
      wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
          {text && text.split('\n').filter(Boolean).map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}
