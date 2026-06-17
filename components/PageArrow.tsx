'use client';

import Link from 'next/link';
import styles from './PageArrow.module.css';

type Props = {
  href: string;
  label: string;
  direction: 'left' | 'right';
};

export default function PageArrow({ href, label, direction }: Props) {
  return (
    <Link href={href} className={`${styles.arrow} ${direction === 'left' ? styles.left : styles.right}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fleche-droite.webp"
        alt={direction === 'left' ? '←' : '→'}
        className={`${styles.arrowImg} ${direction === 'left' ? styles.arrowImgFlip : ''}`}
      />
      <span className={styles.label}>{label}</span>
    </Link>
  );
}
