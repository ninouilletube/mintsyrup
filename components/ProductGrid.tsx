'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { getData } from '@/lib/supabase';
import { useLang } from '@/context/LangContext';
import { useShop } from '@/context/ShopContext';
import { useProducts } from '@/context/ProductsContext';
import { useSubcategories } from '@/context/SubcategoriesContext';
import { useSelections } from '@/context/SelectionsContext';
import { getCurrentSeason, SEASON_TO_ID, type SeasonKey } from '@/lib/season';
import { getColor } from '@/data/colors';
import { CATEGORIES } from '@/data/categories';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';


export default function ProductGrid() {
  const { lang } = useLang();
  const { activeCategory, activeSelection } = useShop();
  const { products } = useProducts();
  const { subcategories, colorOrder } = useSubcategories();
  const { selections } = useSelections();

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSizes, setFilterSizes] = useState<string[]>([]);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [specialPostits, setSpecialPostits] = useState<{ summer?: string; coeur?: string }>({});
  const [dropsIndex, setDropsIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const carouselWindowRef = useRef<HTMLDivElement>(null);

  const GAP = 16;
  const MOBILE_GAP = 12;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('ms_special_postits');
      if (cached) setSpecialPostits(JSON.parse(cached) as { summer?: string; coeur?: string });
    } catch {}
    getData('config_special_postits').then((v) => {
      if (v) {
        setSpecialPostits(v as { summer?: string; coeur?: string });
        try { localStorage.setItem('ms_special_postits', JSON.stringify(v)); } catch {}
      }
    });
  }, []);

  useLayoutEffect(() => {
    const el = carouselWindowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cardWidth = isMobile ? el.clientWidth : (el.clientWidth - 3 * GAP) / 4;
      const gap = isMobile ? MOBILE_GAP : GAP;
      el.scrollLeft = dropsIndex * (cardWidth + gap);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [dropsIndex, isMobile]);

  const scrollTo = (index: number) => {
    const el = carouselWindowRef.current;
    if (!el) return;
    const cardWidth = isMobile ? el.clientWidth : (el.clientWidth - 3 * GAP) / 4;
    const gap = isMobile ? MOBILE_GAP : GAP;
    el.scrollTo({ left: index * (cardWidth + gap), behavior: 'smooth' });
    setDropsIndex(index);
  };

  // Précharger les images post-it des sélections dès le montage
  useEffect(() => {
    selections.forEach(sel => {
      if (sel.postitImage) {
        const img = new window.Image();
        img.src = sel.postitImage;
      }
    });
  }, [selections]);

  // Reset filters and scroll on category/selection change
  useEffect(() => {
    setFilterType(null);
    setFilterSizes([]);
    setFilterColor(null);
    setMobileFilterOpen(false);
    if (activeCategory === 'drops') {
      carouselWindowRef.current?.scrollTo({ left: 0 });
    }
    window.scrollTo({ top: 0 });
  }, [activeCategory]);

  useEffect(() => {
    if (activeSelection) window.scrollTo({ top: 0 });
  }, [activeSelection]);

  // Mobile + drops : bloquer le scroll vertical de la page pour éviter
  // que le fond rose (PageBackground) ou la vidéo apparaissent derrière
  useEffect(() => {
    if (activeCategory === 'drops' && isMobile) {
      document.documentElement.style.overflowY = 'hidden';
      document.body.style.overflowY = 'hidden';
    } else {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    }
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    };
  }, [activeCategory, isMobile]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCategory === 'drops') setDropsIndex(0);
  }, [activeCategory]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const DROPS_VISIBLE = 4;
  const DROPS_MAX = 15;

  if (activeCategory === null && !activeSelection) return null;

  const isDrops = activeCategory === 'drops' && !activeSelection;

  const SOLD_DELAY = 24 * 60 * 60 * 1000;
  const isRecentlySold = (p: (typeof products)[0]) =>
    !!p.sold && !!p.soldAt && Date.now() - p.soldAt < SOLD_DELAY;

  const visible = products.filter((p) => (!p.hidden && !p.sold) || isRecentlySold(p));

  const byCategory = activeSelection
    ? [...visible.filter((p) => p.selections?.includes(activeSelection))].sort((a, b) => b.id - a.id)
    : isDrops
      ? [...visible].sort((a, b) => b.id - a.id)
      : activeCategory === 'ete'
        ? [...visible.filter((p) => p.seasons?.includes(SEASON_TO_ID[getCurrentSeason()]))].sort((a, b) => b.id - a.id)
        : [...visible.filter((p) => activeCategory ? p.categories.includes(activeCategory) : false)].sort((a, b) => b.id - a.id);

  const SIZE_ORDER = ['TU','XXXS / 30 / 2','XXS / 32 / 4','XS / 34 / 6','S / 36 / 8','M / 38 / 10','L / 40 / 12','XL / 42 / 14','2XL / 44 / 16','3XL / 46 / 18','4XL / 48 / 20'];

  // Faceted filtering: each group is computed from products filtered by the OTHER active filters
  const forTypes = byCategory.filter((p) => {
    if (filterSizes.length > 0 && !filterSizes.includes(p.size)) return false;
    if (filterColor && !p.tags?.includes(filterColor)) return false;
    return true;
  });
  const availableTypeIds = ([...new Set(forTypes.map((p) => p.subcategory).filter(Boolean))] as string[])
    .sort((a, b) => {
      const subA = subcategories.find((s) => s.id === a);
      const subB = subcategories.find((s) => s.id === b);
      if (!subA || !subB) return 0;
      const catA = CATEGORIES.findIndex((c) => c.id === subA.parentCategory);
      const catB = CATEGORIES.findIndex((c) => c.id === subB.parentCategory);
      if (catA !== catB) return catA - catB;
      return subcategories.indexOf(subA) - subcategories.indexOf(subB);
    });

  const forSizes = byCategory.filter((p) => {
    if (filterType && p.subcategory !== filterType) return false;
    if (filterColor && !p.tags?.includes(filterColor)) return false;
    return true;
  });
  const availableSizes = [...new Set(forSizes.map((p) => p.size).filter(Boolean))].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a), bi = SIZE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return parseFloat(a) - parseFloat(b);
  });

  const forColors = byCategory.filter((p) => {
    if (filterType && p.subcategory !== filterType) return false;
    if (filterSizes.length > 0 && !filterSizes.includes(p.size)) return false;
    return true;
  });
  const availableColorIds = [...new Set(forColors.flatMap((p) => p.tags ?? []))]
    .filter(id => getColor(id))
    .sort((a, b) => colorOrder.indexOf(a) - colorOrder.indexOf(b));

  // Apply filters
  const filtered = byCategory.filter((p) => {
    if (filterType && p.subcategory !== filterType) return false;
    if (filterSizes.length > 0 && !filterSizes.includes(p.size)) return false;
    if (filterColor && !p.tags?.includes(filterColor)) return false;
    return true;
  });

  const hasFilters = !isDrops && !activeSelection && activeCategory !== 'ete' && (availableTypeIds.length > 0 || availableColorIds.length > 0);
  const hasSizeFilter = !isDrops && availableSizes.length > 0;

  const season = activeCategory === 'ete' ? getCurrentSeason() : null;

  const dropsPool = isDrops ? filtered.filter((p) => !p.sold).slice(0, DROPS_MAX) : [];
  const canPrev = dropsIndex > 0;
  const canNext = isMobile
    ? dropsIndex + 1 < dropsPool.length
    : dropsIndex + DROPS_VISIBLE < dropsPool.length;

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);
  const activeSelObj = activeSelection ? (selections.find(s => s.id === activeSelection) ?? null) : null;
  const selectionName = activeSelObj?.name ?? null;
  const catLabel = selectionName ?? (activeCat ? (lang === 'fr' ? activeCat.fr : activeCat.en) : '');
  const activeFilterCount = [filterType, ...filterSizes, filterColor].filter(Boolean).length;
  const hasSelPostit = !!activeSelObj?.postitImage;

  return (
    <div className={styles.overlay}>
      <div className={`${isDrops ? styles.panelOpen : styles.panel}${activeCategory === 'ete' ? ` ${styles.panelSummer}` : ''}${hasSelPostit ? ` ${styles.panelWithPostit}` : ''}`} ref={panelRef}>

        {/* Desktop : note été post-it */}
        {activeCategory === 'ete' && (
          <div className={styles.eteLead}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={specialPostits.summer ?? '/postit-summer.png'} alt="SUMMER" className={styles.eteLeadImg} />
          </div>
        )}

        {/* Post-it pour sélection avec image liée */}
        {activeSelObj?.postitImage && (
          <div className={styles.selectionPostit}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeSelObj.postitImage} alt={activeSelObj.name} className={styles.selectionPostitImg} />
          </div>
        )}

        {/* Desktop : badge catégorie flottant sur la vidéo */}
        {!hasSelPostit && activeCategory !== 'ete' && catLabel && (
          <div className={styles.categoryBadgeFloat}>
            <span className={styles.mobileCategoryBadge}>{catLabel}</span>
          </div>
        )}

        {/* Texte de présentation d'une sélection */}
        {activeSelObj?.description && (
          <p className={styles.selectionIntro}>{activeSelObj.description}</p>
        )}

        {/* Mobile uniquement : titre de catégorie encadré */}
        <div className={styles.mobileCategoryHeader}>
          <span className={`${styles.mobileCategoryBadge} ${activeCategory === 'ete' ? styles.mobileCategoryBadgeSummer : ''}`}>
            {catLabel}
          </span>
        </div>

        {/* Desktop uniquement : filtre taille flottant */}
        {hasSizeFilter && (
          <div className={styles.filterSizesFloat}>
            {availableSizes.map((size) => (
              <button
                key={size}
                className={`${styles.filterSizeTag} ${filterSizes.includes(size) ? styles.filterSizeTagActive : ''}`}
                onClick={() => setFilterSizes(filterSizes.includes(size) ? filterSizes.filter(s => s !== size) : [...filterSizes, size])}
              >{size}</button>
            ))}
          </div>
        )}

        {/* Desktop uniquement : barre filtres type + couleur */}
        {hasFilters && (
          <div className={styles.filterBar}>
            <div className={styles.filterLeft}>
              {availableTypeIds.map((id, i) => {
                const sub = subcategories.find((s) => s.id === id);
                if (!sub) return null;
                return (
                  <span key={id} className={styles.filterRow}>
                    {i > 0 && <span className={styles.filterSep}>—</span>}
                    <button
                      className={`${styles.filterItem} ${filterType === id ? styles.filterItemActive : ''}`}
                      onClick={() => setFilterType(filterType === id ? null : id)}
                    >{sub.label}</button>
                  </span>
                );
              })}
            </div>
            {availableColorIds.length > 0 && (
              <div className={styles.filterColors}>
                {availableColorIds.map((id) => {
                  const color = getColor(id);
                  if (!color) return null;
                  return (
                    <button
                      key={id}
                      title={color.label}
                      className={`${styles.filterColorDot} ${filterColor === id ? styles.filterColorDotActive : ''}`}
                      style={{ background: color.bg }}
                      onClick={() => setFilterColor(filterColor === id ? null : id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mobile uniquement : bouton Filtrer + panneau déroulant */}
        {(hasFilters || hasSizeFilter) && (
          <div className={styles.mobileFilterWrap}>
            <button
              className={`${styles.mobileFilterBtn} ${activeFilterCount > 0 ? styles.mobileFilterBtnActive : ''} ${mobileFilterOpen ? styles.mobileFilterBtnOpen : ''}`}
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            >
              <span>Filtrer</span>
              {activeFilterCount > 0 && (
                <span className={styles.mobileFilterCount}>{activeFilterCount}</span>
              )}
              <span className={styles.mobileFilterChevron}>{mobileFilterOpen ? '▲' : '▼'}</span>
            </button>

            {mobileFilterOpen && (
              <div className={styles.mobileFilterPanel}>

                {/* Sous-catégorie */}
                {availableTypeIds.length > 0 && (
                  <div className={styles.mobileFilterSection}>
                    <p className={styles.mobileFilterLabel}>Sous-catégorie</p>
                    <div className={styles.mobileFilterPills}>
                      {availableTypeIds.map((id) => {
                        const sub = subcategories.find((s) => s.id === id);
                        if (!sub) return null;
                        return (
                          <button
                            key={id}
                            className={`${styles.mobileFilterPill} ${filterType === id ? styles.mobileFilterPillActive : ''}`}
                            onClick={() => setFilterType(filterType === id ? null : id)}
                          >{sub.label}</button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Taille */}
                {availableSizes.length > 0 && (
                  <div className={styles.mobileFilterSection}>
                    <p className={styles.mobileFilterLabel}>Taille</p>
                    <div className={styles.mobileFilterPills}>
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          className={`${styles.mobileFilterPill} ${filterSizes.includes(size) ? styles.mobileFilterPillActive : ''}`}
                          onClick={() => setFilterSizes(filterSizes.includes(size) ? filterSizes.filter(s => s !== size) : [...filterSizes, size])}
                        >{size}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Couleur */}
                {availableColorIds.length > 0 && (
                  <div className={styles.mobileFilterSection}>
                    <p className={styles.mobileFilterLabel}>Couleur</p>
                    <div className={styles.mobileFilterColors}>
                      {availableColorIds.map((id) => {
                        const color = getColor(id);
                        if (!color) return null;
                        return (
                          <button
                            key={id}
                            title={color.label}
                            className={`${styles.filterColorDot} ${filterColor === id ? styles.filterColorDotActive : ''}`}
                            style={{ background: color.bg }}
                            onClick={() => setFilterColor(filterColor === id ? null : id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Réinitialiser */}
                {activeFilterCount > 0 && (
                  <button
                    className={styles.mobileFilterReset}
                    onClick={() => { setFilterType(null); setFilterSizes([]); setFilterColor(null); }}
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {lang === 'fr' ? "Il n'y a pas encore de pièces dans cette catégorie — Reviens plus tard <3" : 'No pieces in this category yet... Check back soon <3'}
          </p>
        ) : isDrops ? (
          <div className={styles.carousel}>
            <button className={styles.carouselArrow} style={{ visibility: canPrev ? 'visible' : 'hidden' }} onClick={() => scrollTo(Math.max(0, dropsIndex - 1))}>‹</button>
            <div className={styles.carouselClip}>
            <div className={styles.carouselWindow} ref={carouselWindowRef}>
              <div className={styles.carouselTrack}>
                {dropsPool.map((product) => (
                  <div key={product.id} className={styles.carouselItem}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
            </div>
            <button className={styles.carouselArrow} style={{ visibility: canNext ? 'visible' : 'hidden' }} onClick={() => scrollTo(Math.min(dropsPool.length - (isMobile ? 1 : DROPS_VISIBLE), dropsIndex + 1))}>›</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {showScrollTop && !isDrops && (
          <button className={styles.scrollTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
        )}
      </div>
    </div>
  );
}
