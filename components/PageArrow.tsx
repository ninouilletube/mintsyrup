'use client';

import Link from 'next/link';
import styles from './PageArrow.module.css';

type Props = {
  href: string;
  label: string;
  direction: 'left' | 'right';
  onClick?: () => void;
};

export default function PageArrow({ href, label, direction, onClick }: Props) {
  const className = `${styles.arrow} ${direction === 'left' ? styles.left : styles.right}`;
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fleche-droite.webp"
        alt={direction === 'left' ? '←' : '→'}
        className={`${styles.arrowImg} ${direction === 'left' ? styles.arrowImgFlip : ''}`}
      />
      <span className={styles.label}>{label}</span>
    </>
  );
  if (onClick) {
    return <button className={className} onClick={onClick}>{inner}</button>;
  }
  return <Link href={href} className={className}>{inner}</Link>;
}
