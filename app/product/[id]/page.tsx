'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import { trackArticleView, trackVintedClick } from '@/lib/supabase';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import styles from './Product.module.css';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { products } = useProducts();
  const { lang } = useLang();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [lightbox, setLightbox] = useState(false);
  const tracked = useRef(false);

  const product = products.find((p) => String(p.id) === id);

  const images = product
    ? (product.images?.filter(Boolean).length ? product.images.filter(Boolean) : product.image ? [product.image] : []) as string[]
    : [];

  useEffect(() => {
    if (!lightbox) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { setDirection('right'); setActiveIndex((i) => (i + 1) % images.length); }
      if (e.key === 'ArrowLeft')  { setDirection('left');  setActiveIndex((i) => (i - 1 + images.length) % images.length); }
      if (e.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightbox, images.length]);

  useEffect(() => {
    if (!product || tracked.current) return;
    tracked.current = true;
    trackArticleView(product.id);
  }, [product]);

  if (!product) {
    return (
      <>
        <Nav />
        <div className={styles.notFound}>
          <p>Article introuvable.</p>
          <Link href="/" className={styles.back}>← Retour</Link>
        </div>
        <Footer />
      </>
    );
  }

  const current = images[activeIndex] ?? null;

  return (
    <>
      <Nav />
      <div className={styles.page}>
      <Link href="/" className={styles.back}>← Retour</Link>
      <div className={styles.card}>
        {product.size && <span className={styles.size}>{product.size}</span>}
        <div className={styles.gallery}>
          <div className={`${styles.imageWrap} ${current ? styles.imageWrapClickable : ''}`} onClick={() => current && setLightbox(true)}>
            {current ? (
              <img key={activeIndex} src={current} alt={product.title[lang]} className={`${styles.image} ${direction === 'right' ? styles.slideInRight : styles.slideInLeft}`} />
            ) : (
              <div className={styles.placeholder} style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})` }} />
            )}
            {images.length > 1 && (
              <>
                <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={(e) => { e.stopPropagation(); setDirection('left'); setActiveIndex((activeIndex - 1 + images.length) % images.length); }}>←</button>
                <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={(e) => { e.stopPropagation(); setDirection('right'); setActiveIndex((activeIndex + 1) % images.length); }}>→</button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((src, i) => (
                <button key={i} className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ''}`} onClick={() => setActiveIndex(i)}>
                  <img src={src} alt="" className={styles.thumbImg} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.info}>
          <h1 className={styles.title}>{product.title[lang]}</h1>
          {product.brand && <p className={styles.brand}>{product.brand}</p>}
          {product.description[lang] && <p className={styles.desc}>{product.description[lang]}</p>}
          <a
            href={product.vintedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btn}
            onClick={() => trackVintedClick(product.id)}
          >
            <span className={styles.btnPrice}>{product.price} €</span>
            {lang === 'fr' ? 'Acheter sur Vinted ↗' : 'Buy on Vinted ↗'}
          </a>
        </div>
      </div>
      {lightbox && current && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)}>
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}>
            {images.length > 1 && (
              <button className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`} onClick={(e) => { e.stopPropagation(); setDirection('left'); setActiveIndex((activeIndex - 1 + images.length) % images.length); }}>←</button>
            )}
            <img src={current} alt={product.title[lang]} className={styles.lightboxImg} />
            {images.length > 1 && (
              <button className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`} onClick={(e) => { e.stopPropagation(); setDirection('right'); setActiveIndex((activeIndex + 1) % images.length); }}>→</button>
            )}
          </div>
          <button className={styles.lightboxClose} onClick={() => setLightbox(false)}>×</button>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}
