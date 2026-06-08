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
      {direction === 'left' && <span className={styles.chevron}>‹</span>}
      <span className={styles.label}>{label}</span>
      {direction === 'right' && <span className={styles.chevron}>›</span>}
    </Link>
  );
}
