'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './projet.module.css';

interface Props {
  title: string | null;
  text: string | null;
  tooltip3: string | null;
}

export default function ProjetAccordion({ title, text, tooltip3 }: Props) {
  const [infoOpen, setInfoOpen] = useState(false);
  const tooltipInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const timer = setTimeout(() => {
      if (!tooltipInnerRef.current) return;
      const rect = tooltipInnerRef.current.getBoundingClientRect();
      const targetScrollY = window.scrollY + rect.bottom - window.innerHeight + 24;
      if (window.matchMedia('(max-width: 768px)').matches) {
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [infoOpen]);

  return (
    <div className={styles.accordionWrap}>
      <div className={styles.accordionHeader}>
        <div className={styles.accordionTitleRow}>
          {title && <h2 className={styles.blockTitle}>{title}</h2>}
        </div>

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

      <div className={styles.accordionBody}>
        {text && text.split('\n').filter(Boolean).map((p, j) => (
          <p key={j}>{p}</p>
        ))}
      </div>
    </div>
  );
}
