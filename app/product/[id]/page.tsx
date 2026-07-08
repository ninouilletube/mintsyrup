'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/data/products';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { trackArticleView, trackVintedClick } from '@/lib/supabase';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import styles from './Product.module.css';

function RelatedSection({ related, lang }: { related: Product[]; lang: 'fr' | 'en' }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [touchedId, setTouchedId] = useState<number | null>(null);

  const updateBounds = () => {
    const el = gridRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    updateBounds();
    el.addEventListener('scroll', updateBounds, { passive: true });
    return () => el.removeEventListener('scroll', updateBounds);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    gridRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
  };
  return (
    <div className={styles.related}>
      <h2 className={styles.relatedTitle}>{lang === 'fr' ? 'Vous aimerez peut-être…' : 'You might also like…'}</h2>
      <div className={styles.relatedStrip}>
        {related.length > 3 && !atStart && (
          <button className={`${styles.relatedScrollBtn} ${styles.relatedScrollLeft}`} onClick={() => scroll('left')} aria-label="Précédent">‹</button>
        )}
        <div className={styles.relatedGrid} ref={gridRef}>
          {related.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className={styles.relatedCard}
              onTouchStart={() => setTouchedId(p.id)}
              onTouchEnd={() => setTouchedId(null)}
              onTouchCancel={() => setTouchedId(null)}
            >
              <div className={styles.relatedImg}>
                {p.image
                  ? <Image src={p.image} alt={p.title[lang]} fill style={{ objectFit: 'cover' }} sizes="200px" />
                  : <div style={{ background: `linear-gradient(145deg, ${p.placeholder[0]}, ${p.placeholder[1]})`, width: '100%', height: '100%' }} />
                }
                {p.images?.[1] && (
                  <img
                    src={p.images[1]}
                    alt=""
                    className={`${styles.relatedImgHover} ${touchedId === p.id ? styles.relatedImgHoverTouch : ''}`}
                  />
                )}
              </div>
              <div className={styles.relatedInfo}>
                <span className={styles.relatedName}>{p.title[lang]}</span>
                <span className={styles.relatedPrice}>{p.price} €</span>
              </div>
            </Link>
          ))}
        </div>
        {related.length > 3 && !atEnd && (
          <button className={`${styles.relatedScrollBtn} ${styles.relatedScrollRight}`} onClick={() => scroll('right')} aria-label="Suivant">›</button>
        )}
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { products } = useProducts();
  const { lang } = useLang();
  const { addItem, isInCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [lightbox, setLightbox] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [lbArrowsVisible, setLbArrowsVisible] = useState(false);
  const lbArrowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tracked = useRef(false);
  const swipeStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const mainStripRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  const handleLbMouseMove = () => {
    setLbArrowsVisible(true);
    if (lbArrowTimer.current) clearTimeout(lbArrowTimer.current);
    lbArrowTimer.current = setTimeout(() => setLbArrowsVisible(false), 350);
  };

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
    setActiveIndex(0);
    window.scrollTo(0, 0);
  }, [id]);

  // Sync main gallery strip (mobile) to activeIndex (miniature ou flèche cliquée)
  useEffect(() => {
    const strip = mainStripRef.current;
    if (!strip || images.length <= 1 || lightbox) return;
    isProgrammaticScroll.current = true;
    strip.scrollTo({ left: activeIndex * strip.clientWidth, behavior: 'instant' });
  }, [activeIndex, images.length, lightbox]);

  // scrollend listener : met à jour activeIndex uniquement sur swipe utilisateur
  useEffect(() => {
    const strip = mainStripRef.current;
    if (!strip) return;
    const onScrollEnd = () => {
      if (isProgrammaticScroll.current) { isProgrammaticScroll.current = false; return; }
      const idx = Math.round(strip.scrollLeft / strip.clientWidth);
      setActiveIndex(idx);
    };
    strip.addEventListener('scrollend', onScrollEnd);
    return () => strip.removeEventListener('scrollend', onScrollEnd);
  }, []);


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
          <button onClick={() => router.back()} className={styles.back}>← Retour</button>
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
      <button onClick={() => router.back()} className={styles.back}>← Retour</button>
      <div className={styles.cardWrap}>
        {/* Mobile uniquement : titre + marque centrés au-dessus de la carte */}
        <div className={styles.mobileCardHeader}>
          <h1 className={styles.mobileTitleAbove}>{product.title[lang]}</h1>
          {product.brand && <p className={styles.mobileBrandAbove}>{product.brand}</p>}
        </div>

        <div className={styles.card}>
          {/* Taille : position absolue sur desktop, masquée sur mobile */}
          {product.size && <span className={styles.size}>{product.size}</span>}
          <div className={styles.gallery}>
            {/* Mobile : carrousel scroll-snap (remplace imageWrap) */}
            {images.length > 0 && (
              <div
                className={styles.mobileGalleryStrip}
                ref={mainStripRef}
                onClick={() => current && setLightbox(true)}
              >
                {images.map((src, i) => (
                  <div key={i} className={styles.mobileGallerySlide}>
                    <img src={src} alt={product.title[lang]} className={styles.mobileGalleryImg} />
                  </div>
                ))}
              </div>
            )}
            {images.length > 1 && (
              <div className={styles.thumbsCol}>
                {images.map((src, i) => (
                  <button key={i} className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ''}`} onClick={() => setActiveIndex(i)}>
                    <img src={src} alt="" className={styles.thumbImg} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </button>
                )).slice(0, 7)}
              </div>
            )}
            {/* Desktop : image unique avec flèches */}
            <div
              className={`${styles.imageWrap} ${current ? styles.imageWrapClickable : ''}`}
              onClick={() => { if (didSwipe.current) { didSwipe.current = false; return; } current && setLightbox(true); }}
            >
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
          </div>
          {/* Mobile uniquement : taille sous les images, alignée à droite */}
          {product.size && <span className={styles.mobileSizeBelow}>{product.size}</span>}
          <div className={styles.info}>
            <h1 className={styles.title}>{product.title[lang]}</h1>
            {product.brand && <p className={styles.brand}>{product.brand}</p>}
            <div className={styles.descGroup}>
              {product.description[lang] && <p className={styles.desc}>{product.description[lang]}</p>}
            </div>
            <p className={styles.price}>{product.price} €</p>

            {/* Boutons d'action */}
            {!product.sold && (
              <div className={styles.btnGroup}>
                <button
                  className={`${styles.btnCart} ${isInCart(product.id) || cartAdded ? styles.btnCartDone : ''}`}
                  disabled={isInCart(product.id)}
                  onClick={() => {
                    addItem(product);
                    setCartAdded(true);
                    setTimeout(() => setCartAdded(false), 2000);
                  }}
                  title={isInCart(product.id) ? 'Dans le panier' : 'Ajouter au panier'}
                >
                  {isInCart(product.id) || cartAdded ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                  )}
                </button>

                <a
                  href={product.vintedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnVinted}
                  onClick={() => trackVintedClick(product.id)}
                >
                  Voir sur Vinted
                </a>

                <button
                  className={`${styles.btnWishlist} ${isInWishlist(product.id) ? styles.btnWishlistActive : ''}`}
                  onClick={() => {
                    if (!user) { setAuthModalOpen(true); return; }
                    toggleWishlist(product.id);
                  }}
                  title={isInWishlist(product.id) ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={isInWishlist(product.id) ? '/icon-wishlist-active.png' : '/icon-wishlist.png'} alt="" style={{ width: 20, height: 20, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </button>
              </div>
            )}
            {product.sold && <p className={styles.soldMsg}>Cet article a été vendu.</p>}

            {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
          </div>
        </div>
      </div>
      {lightbox && current && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)} onMouseMove={handleLbMouseMove}>
          <div className={styles.lightboxInner} onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - (swipeStartX.current ?? 0);
              if (Math.abs(dx) > 40) {
                if (dx < 0) setActiveIndex((i) => (i + 1) % images.length);
                else setActiveIndex((i) => (i - 1 + images.length) % images.length);
              }
              swipeStartX.current = null;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={activeIndex} src={images[activeIndex]} alt={product.title[lang]} className={styles.lightboxImg} />
          </div>
          {images.length > 1 && (
            <button className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft} ${lbArrowsVisible ? styles.lightboxArrowVisible : ''}`} onClick={(e) => { e.stopPropagation(); setActiveIndex((activeIndex - 1 + images.length) % images.length); }}>←</button>
          )}
          {images.length > 1 && (
            <button className={`${styles.lightboxArrow} ${styles.lightboxArrowRight} ${lbArrowsVisible ? styles.lightboxArrowVisible : ''}`} onClick={(e) => { e.stopPropagation(); setActiveIndex((activeIndex + 1) % images.length); }}>→</button>
          )}
          <button className={styles.lightboxClose} onClick={() => setLightbox(false)}>×</button>
        </div>
      )}
        {(() => {
          const others = products.filter((p) => !p.hidden && p.id !== product.id);
          const seen = new Set<number>();
          const pick = (arr: typeof others) => arr.filter((p) => !seen.has(p.id) && seen.add(p.id) as unknown as boolean);

          const sameColorSameCategory = pick(others.filter((p) =>
            p.tags?.some((t) => product.tags?.includes(t)) &&
            p.categories.some((c) => product.categories.includes(c))
          ));
          const sameSubcategory = pick(others.filter((p) =>
            product.subcategory && p.subcategory === product.subcategory
          ));
          const sameCategory = pick(others.filter((p) =>
            p.categories.some((c) => product.categories.includes(c))
          ));
          const sameColor = pick(others.filter((p) =>
            p.tags?.some((t) => product.tags?.includes(t))
          ));
          const oldest = pick([...others].sort((a, b) => a.id - b.id));

          const related = [...sameColorSameCategory, ...sameSubcategory, ...sameCategory, ...sameColor, ...oldest].slice(0, 20);
          if (!related.length) return null;
          return <RelatedSection related={related} lang={lang} />;
        })()}
      </div>

      <Footer />
    </>
  );
}
