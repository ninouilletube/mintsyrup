'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProducts } from '@/context/ProductsContext';
import { useSubcategories } from '@/context/SubcategoriesContext';
import { CATEGORIES } from '@/data/categories';
import { COLORS, getColor } from '@/data/colors';
import type { Category, Season, Product } from '@/data/products';
import { getCurrentSeason } from '@/lib/season';
import { getData, setData, uploadPostitImage, uploadSpecialPostit } from '@/lib/supabase';
import { useSelections } from '@/context/SelectionsContext';
import styles from './Admin.module.css';
import MobileAdmin from './MobileAdmin';

type View = 'dashboard' | 'articles' | 'add-article' | 'edit-article' | 'article-detail' | 'bio' | 'finances' | 'catalog';

const SIZES = [
  'TU',
  'XXXS / 30 / 2', 'XXS / 32 / 4',
  'XS / 34 / 6',   'S / 36 / 8',
  'M / 38 / 10',   'L / 40 / 12',
  'XL / 42 / 14',  '2XL / 44 / 16',
  '3XL / 46 / 18','4XL / 48 / 20',
];
const SHOE_SIZES = ['35', '35.5', '36', '36.5', '37', '37.5', '38', '38.5', '39', '39.5', '40', '40.5', '41', '41.5', '42', '42.5', '43', '44', '45', '46'];
type Analytics = { total: number; days: Record<string, number> };
type ArticleStats = Record<string, { views: number; vinted: number }>;
type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sun';

const SEASONS_FORM: { id: Season; label: string }[] = [
  { id: 'printemps', label: 'Printemps' },
  { id: 'ete',       label: 'Été' },
  { id: 'automne',   label: 'Automne' },
  { id: 'hiver',     label: 'Hiver' },
];

const SEASON_LABELS: Record<SeasonKey, string> = {
  spring: 'SPRING',
  summer: 'SUMMER',
  autumn: 'AUTUMN',
  winter: 'WINTER',
};

const SEASON_COLORS: Record<SeasonKey, string> = {
  spring: '#C83A20',
  summer: '#F0A020',
  autumn: '#E8621A',
  winter: '#C87870',
};

const NEXT_SEASON: Record<SeasonKey, SeasonKey> = {
  spring: 'summer',
  summer: 'autumn',
  autumn: 'winter',
  winter: 'spring',
};

const SEASON_TRANSITIONS: { season: SeasonKey; month: number; day: number }[] = [
  { season: 'spring', month: 3,  day: 1 },
  { season: 'summer', month: 6,  day: 1 },
  { season: 'autumn', month: 9,  day: 1 },
  { season: 'winter', month: 12, day: 1 },
];

function getNextSeasonChange(): { nextSeason: SeasonKey; daysLeft: number } {
  const now = new Date();
  for (const t of SEASON_TRANSITIONS) {
    const target = new Date(now.getFullYear(), t.month - 1, t.day);
    if (target > now) {
      return {
        nextSeason: t.season,
        daysLeft: Math.ceil((target.getTime() - now.getTime()) / 86400000),
      };
    }
  }
  const next = new Date(now.getFullYear() + 1, 2, 1);
  return { nextSeason: 'spring', daysLeft: Math.ceil((next.getTime() - now.getTime()) / 86400000) };
}

const PLACEHOLDERS: [string, string][] = [
  ['#B82818', '#E8621A'],   /* crimson → orange */
  ['#E05530', '#F0A020'],   /* coral → amber */
  ['#D87060', '#F8E2C8'],   /* saumon → crème */
  ['#781515', '#D87060'],   /* bordeaux → saumon */
  ['#C87870', '#E8621A'],   /* rose poudré → orange */
  ['#F0A020', '#C04050'],   /* amber → rose profond */
  ['#C83A20', '#F0A020'],   /* rouge → amber */
];

const emptyForm = {
  brand: '',
  title: '',
  size: '',
  price: '',
  description: '',
  vintedUrl: '',
  imageUrls: [''],
  categories: [] as Category[],
  subcategory: '',
  seasons: [] as Season[],
  tags: [] as string[],
  favorite: false,
  favoriteText: '',
  purchasePrice: '',
  provenance: '',
  selections: [] as string[],
};

export default function AdminPage() {
  // Auth
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Navigation
  const [view, setView] = useState<View>('dashboard');

  // Analytics
  const [analytics, setAnalytics] = useState<Analytics>({ total: 0, days: {} });
  const [articleStats, setArticleStats] = useState<ArticleStats>({});
  const [seasonOverride, setSeasonOverride] = useState<SeasonKey | null>(null);
  const [seasonSaving, setSeasonSaving] = useState(false);

  // Favoris
  const [favorites, setFavorites] = useState<number[]>([]);

  // Bio
  const [bio1, setBio1] = useState('');
  const [bio2, setBio2] = useState('');
  const [bio3, setBio3] = useState('');
  const [bioTitle1, setBioTitle1] = useState('');
  const [bioTitle2, setBioTitle2] = useState('');
  const [bioTitle3, setBioTitle3] = useState('');
  const [bio3Tooltip, setBio3Tooltip] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);

  // Articles multi-select
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Modal vendu
  const [soldModal, setSoldModal] = useState<{ product: Product } | null>(null);
  const [soldPriceInput, setSoldPriceInput] = useState('');

  // Edit-article form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOrigin, setDetailOrigin] = useState<'dashboard' | 'articles'>('dashboard');
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editAddingSubFor, setEditAddingSubFor] = useState<Category | null>(null);
  const [editNewSubLabel, setEditNewSubLabel] = useState('');
  const [editAddingSel, setEditAddingSel] = useState(false);
  const [editNewSelLabel, setEditNewSelLabel] = useState('');
  const [editNewSelDesc, setEditNewSelDesc] = useState('');
  const [renamingSelId, setRenamingSelId] = useState<string | null>(null);
  const [renameSelValue, setRenameSelValue] = useState('');
  const [renameSelDesc, setRenameSelDesc] = useState('');

  // Add-article step form
  const [form, setForm] = useState(emptyForm);
  const [success, setSuccess] = useState(false);
  const [addingSubFor, setAddingSubFor] = useState<Category | null>(null);
  const [newSubLabel, setNewSubLabel] = useState('');
  const [addingSel, setAddingSel] = useState(false);
  const [newSelLabel, setNewSelLabel] = useState('');
  const [newSelDesc, setNewSelDesc] = useState('');
  const [step, setStep] = useState(0);
  const TOTAL_STEPS = 11;

  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { subcategories, addSubcategory, deleteSubcategory, reorderSubcategories, colorOrder, setColorOrder, colorLabels, setColorLabel } = useSubcategories();
  const { selections, addSelection, deleteSelection, renameSelection, updateSelection, setPostitImage, reorderSelections } = useSelections();

  const [postitUploading, setPostitUploading] = useState<string | null>(null);
  const [specialPostits, setSpecialPostits] = useState<{ summer?: string; coeur?: string }>({});
  const [specialPostitUploading, setSpecialPostitUploading] = useState<'summer' | 'coeur' | null>(null);

  // Gestion sélections dans le catalogue
  const [catalogSelEditId, setCatalogSelEditId] = useState<string | null>(null);
  const [catalogSelName, setCatalogSelName] = useState('');
  const [catalogSelDesc, setCatalogSelDesc] = useState('');
  const [catalogAddingSel, setCatalogAddingSel] = useState(false);
  const [catalogNewSelName, setCatalogNewSelName] = useState('');
  const [catalogNewSelDesc, setCatalogNewSelDesc] = useState('');

  const confirmRenameSel = () => {
    if (renamingSelId && renameSelValue.trim()) updateSelection(renamingSelId, renameSelValue.trim(), renameSelDesc.trim() || undefined);
    setRenamingSelId(null);
    setRenameSelValue('');
    setRenameSelDesc('');
  };

  // Catalog drag-and-drop state
  const [dragSub, setDragSub] = useState<string | null>(null);
  const [dragOverSub, setDragOverSub] = useState<string | null>(null);
  const [dragColor, setDragColor] = useState<string | null>(null);
  const [dragOverColor, setDragOverColor] = useState<string | null>(null);
  const [editingColorLabel, setEditingColorLabel] = useState<string | null>(null);
  const [editingColorLabelVal, setEditingColorLabelVal] = useState('');
  const [dragSel, setDragSel] = useState<string | null>(null);
  const [dragOverSel, setDragOverSel] = useState<string | null>(null);

  useEffect(() => {
    setAuth(sessionStorage.getItem('msc_auth') === '1');
  }, []);

  useEffect(() => {
    if (!auth) return;
    getData('analytics').then((v) => v && setAnalytics(v as Analytics));
    getData('article_stats').then((v) => v && setArticleStats(v as ArticleStats));
    getData('season_override').then((v) => v && setSeasonOverride(v as SeasonKey));
    getData('favorites').then((v) => v && setFavorites(v as number[]));
    getData('bio1').then((v) => v && setBio1(v as string));
    getData('bio2').then((v) => v && setBio2(v as string));
    getData('bio3').then((v) => v && setBio3(v as string));
    getData('bioTitle1').then((v) => v && setBioTitle1(v as string));
    getData('bioTitle2').then((v) => v && setBioTitle2(v as string));
    getData('bioTitle3').then((v) => v && setBioTitle3(v as string));
    getData('bio3Tooltip').then((v) => v && setBio3Tooltip(v as string));
    getData('config_special_postits').then((v) => v && setSpecialPostits(v as { summer?: string; coeur?: string }));
  }, [auth]);

  const login = () => {
    if (pwd === PASSWORD) { setAuth(true); sessionStorage.setItem('msc_auth', '1'); setPwdError(false); }
    else setPwdError(true);
  };

  // Season
  const currentSeason = getCurrentSeason();
  const { nextSeason } = getNextSeasonChange();
  const displaySeason = seasonOverride || currentSeason;

  // Countdown temps réel
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const year = now.getFullYear();
      const targets = [
        new Date(year, 2, 1), new Date(year, 5, 1),
        new Date(year, 8, 1), new Date(year, 11, 1),
        new Date(year + 1, 2, 1),
      ];
      const next = targets.find(t => t > now)!;
      const diff = next.getTime() - now.getTime();
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const forceSeason = async (s: SeasonKey) => {
    setSeasonSaving(true);
    await setData('season_override', s);
    setSeasonOverride(s);
    setSeasonSaving(false);
  };

  const clearSeasonOverride = async () => {
    setSeasonSaving(true);
    await setData('season_override', null);
    setSeasonOverride(null);
    setSeasonSaving(false);
  };

  // Computed
  const last30Days = (() => {
    const now = new Date();
    let sum = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      sum += analytics.days[d.toISOString().split('T')[0]] || 0;
    }
    return sum;
  })();

  const totalViews  = Object.values(articleStats).reduce((s, v) => s + (v.views  || 0), 0);
  const totalVinted = Object.values(articleStats).reduce((s, v) => s + (v.vinted || 0), 0);

  // Multi-select
  const toggleSelect = (id: number) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () =>
    setSelected(selected.size === products.length ? new Set() : new Set(products.map((p) => p.id)));

  const deleteSelected = () => {
    if (!selected.size || !confirm(`Supprimer ${selected.size} article(s) ?`)) return;
    selected.forEach((id) => deleteProduct(id));
    setSelected(new Set());
  };

  const confirmSold = () => {
    if (!soldModal) return;
    const p = soldModal.product;
    const sp = soldPriceInput ? parseFloat(soldPriceInput) : p.price;
    updateProduct({ ...p, sold: true, soldAt: Date.now(), soldPrice: sp, hidden: true });
    setDetailProduct(null);
    setSoldModal(null);
    setSoldPriceInput('');
    setView(detailOrigin);
  };

  const toggleHideSelected = () => {
    const allHidden = [...selected].every((id) => products.find((p) => p.id === id)?.hidden);
    selected.forEach((id) => {
      const p = products.find((p) => p.id === id);
      if (p) updateProduct({ ...p, hidden: !allHidden });
    });
    setSelected(new Set());
  };

  // Edit full form
  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      brand: p.brand || '',
      title: p.title.fr,
      size: p.size,
      price: String(p.price),
      description: p.description.fr,
      vintedUrl: p.vintedUrl,
      imageUrls: p.images?.length ? p.images : (p.image ? [p.image] : ['']),
      categories: p.categories,
      subcategory: p.subcategory || '',
      seasons: p.seasons || [],
      tags: p.tags || [],
      favorite: p.favorite || false,
      favoriteText: p.favoriteText || '',
      purchasePrice: String(p.purchasePrice ?? ''),
      provenance: p.provenance || '',
      selections: p.selections || [],
    });
    setView('edit-article');
  };

  const saveEdit = () => {
    if (!editingProduct || !editForm.title || !editForm.vintedUrl || !editForm.price) return;
    const wasAlreadyFav = editingProduct.favorite;
    const isNowFav = !!editForm.favorite;
    const favOrder = isNowFav ? (wasAlreadyFav ? editingProduct.favoriteOrder : Date.now()) : undefined;

    updateProduct({
      ...editingProduct,
      brand: editForm.brand || null,
      title: { fr: editForm.title, en: editForm.title },
      size: editForm.size,
      price: parseFloat(editForm.price),
      description: { fr: editForm.description, en: editForm.description },
      vintedUrl: editForm.vintedUrl,
      image: editForm.imageUrls.find(Boolean) || null,
      images: editForm.imageUrls.filter(Boolean),
      categories: editForm.categories.length > 0 ? editForm.categories : ['drops'],
      subcategory: editForm.subcategory || undefined,
      seasons: editForm.seasons.length > 0 ? editForm.seasons : undefined,
      tags: editForm.tags.length > 0 ? editForm.tags : undefined,
      favorite: isNowFav || undefined,
      favoriteText: editForm.favoriteText || undefined,
      favoriteOrder: favOrder,
      purchasePrice: editForm.purchasePrice ? parseFloat(editForm.purchasePrice) : undefined,
      provenance: editForm.provenance || undefined,
      selections: editForm.selections.length > 0 ? editForm.selections : undefined,
    });
    setView('articles');
    setEditingProduct(null);
  };

  const toggleEditCat = (id: Category) =>
    setEditForm((f) => ({
      ...f,
      categories: f.categories[0] === id ? [] : [id],
      subcategory: '',
    }));

  const toggleEditSeason = (id: Season) =>
    setEditForm((f) => ({ ...f, seasons: f.seasons.includes(id) ? f.seasons.filter((s) => s !== id) : [...f.seasons, id] }));

  // Add step form
  const toggleSeason = (id: Season) =>
    setForm((f) => ({ ...f, seasons: f.seasons.includes(id) ? f.seasons.filter((s) => s !== id) : [...f.seasons, id] }));

  const toggleCategory = (id: Category) =>
    setForm((f) => ({
      ...f,
      categories: f.categories[0] === id ? [] : [id],
      subcategory: '',
      size: f.categories[0] !== id ? '' : f.size,
    }));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.vintedUrl || !form.price) return;
    await addProduct({
      brand: form.brand || null,
      title: { fr: form.title, en: form.title },
      size: form.size,
      price: parseFloat(form.price),
      description: { fr: form.description, en: form.description },
      vintedUrl: form.vintedUrl,
      image: form.imageUrls.find(Boolean) || null,
      images: form.imageUrls.filter(Boolean),
      placeholder: PLACEHOLDERS[products.length % PLACEHOLDERS.length],
      categories: form.categories.length > 0 ? form.categories : ['drops'],
      subcategory: form.subcategory || undefined,
      seasons: form.seasons.length > 0 ? form.seasons : undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      favorite: form.favorite || undefined,
      favoriteText: form.favoriteText || undefined,
      favoriteOrder: form.favorite ? Date.now() : undefined,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
      provenance: form.provenance || undefined,
      selections: form.selections.length > 0 ? form.selections : undefined,
    });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setForm(emptyForm); setStep(0); setView('dashboard'); }, 1800);
  };

  const fmt = (n: number | string) => String(n).replace(/0/g, 'O');

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  useEffect(() => {
    if (view !== 'add-article') return;
    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [view, step]);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (!auth) {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginBox}>
          <h1 className={styles.loginTitle}>Mint Syrup</h1>
          <p className={styles.loginSub}>Admin</p>
          <input
            type="password" placeholder="Mot de passe" value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className={`${styles.input} ${pwdError ? styles.inputError : ''}`}
          />
          {pwdError && <p className={styles.error}>Mot de passe incorrect</p>}
          <button className={styles.btnPrimary} onClick={login}>Entrer</button>
        </div>
      </div>
    );
  }

  // ── MOBILE ADMIN ──────────────────────────────────────────────────────────
  if (auth && isMobile) {
    return <MobileAdmin />;
  }

  // ── SHELL ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {view !== 'dashboard' && (
            <button
              className={styles.navBack}
              onClick={() => {
                if (view === 'edit-article') setView('articles');
                else if (view === 'article-detail') setView(detailOrigin);
                else setView('dashboard');
                // Reset drag state when leaving catalog
                setDragSub(null); setDragOverSub(null); setDragColor(null); setDragOverColor(null); setDragSel(null); setDragOverSel(null);
              }}
            >
              ←
            </button>
          )}
          <h1 className={styles.title} style={{ cursor: view === 'dashboard' ? 'pointer' : 'default' }} onClick={() => view === 'dashboard' && setView('bio')}>
            {view === 'dashboard'      && 'Mint Syrup'}
            {view === 'articles'       && 'Articles'}
            {view === 'add-article'    && 'Nouvel article'}
            {view === 'edit-article'   && 'Modifier'}
            {view === 'article-detail' && (detailProduct?.title.fr ?? '')}
            {view === 'bio'            && 'Le projet'}
            {view === 'finances'       && '€€€'}
            {view === 'catalog'        && 'Catalogue'}
          </h1>
        </div>
        {view === 'dashboard' && <a href="/" className={styles.backLink}>← Site</a>}
      </header>

      {/* ── DASHBOARD ───────────────────────────────────────────────────────── */}
      {view === 'dashboard' && (
        <>
          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{fmt(products.filter(p => !p.hidden).length)}</span>
              <span className={styles.statLabel}>Articles visibles</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{fmt(analytics.total.toLocaleString('fr-FR'))}</span>
              <span className={styles.statLabel}>Visites totales</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{fmt(last30Days)}</span>
              <span className={styles.statLabel}>Visites (30 j)</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{fmt(totalViews)}</span>
              <span className={styles.statLabel}>Vues articles</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{fmt(totalVinted)}</span>
              <span className={styles.statLabel}>Clics Vinted</span>
            </div>
          </div>

          {/* Two-col grid */}
          <div className={styles.dashGrid}>
            {/* Quick actions */}
            <div className={styles.actionsWidget}>
              <div className={styles.quickActions}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => { setForm(emptyForm); setStep(0); setView('add-article'); }}
                >
                  <span className={styles.btnPlusIcon}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/></svg>
                  </span>
                  <span className={styles.btnPlusText}>Nouvel<br/>article</span>
                </button>
                <button className={styles.btnSecondary} onClick={() => setView('articles')}>
                  Gérer les articles
                </button>
                <button className={styles.btnFinances} onClick={() => setView('finances')}>
                  €€€
                </button>
                <button className={styles.btnSecondary} onClick={() => setView('catalog')}>
                  Catalogue
                </button>
                <a href="/calculateur.html" target="_blank" rel="noopener noreferrer" className={styles.btnCalculateur}>
                  Calculateur
                </a>
              </div>
              {products.filter(p => p.hidden).length > 0 && (
                <p className={styles.hiddenNote}>
                  {products.filter(p => p.hidden).length} article(s) masqué(s)
                </p>
              )}
            </div>

            {/* Season widget */}
            <div
              className={styles.seasonWidget}
              style={{ borderColor: SEASON_COLORS[displaySeason] }}
            >
              <div className={styles.seasonWidgetInner}>
                {seasonOverride && <span className={styles.overrideBadge}>Override</span>}
                <div className={styles.seasonNameBlock}>
                  <span className={styles.seasonName} style={{ color: SEASON_COLORS[displaySeason] }}>
                    {SEASON_LABELS[displaySeason]}
                  </span>
                </div>
                <div className={styles.seasonCountdownWrap}>
                  <div className={styles.countdown}>
                    <div className={styles.countdownUnit}>
                      <span className={styles.countdownNum}>{fmt(String(countdown.d).padStart(2, 'O'))}</span>
                      <span className={styles.countdownLabel}>j</span>
                    </div>
                    <span className={styles.countdownSep}>:</span>
                    <div className={styles.countdownUnit}>
                      <span className={styles.countdownNum}>{fmt(String(countdown.h).padStart(2, 'O'))}</span>
                      <span className={styles.countdownLabel}>h</span>
                    </div>
                    <span className={styles.countdownSep}>:</span>
                    <div className={styles.countdownUnit}>
                      <span className={styles.countdownNum}>{fmt(String(countdown.m).padStart(2, 'O'))}</span>
                      <span className={styles.countdownLabel}>m</span>
                    </div>
                    <span className={styles.countdownSep}>:</span>
                    <div className={styles.countdownUnit}>
                      <span className={styles.countdownNum}>{fmt(String(countdown.s).padStart(2, 'O'))}</span>
                      <span className={styles.countdownLabel}>s</span>
                    </div>
                  </div>
                </div>
                {!seasonOverride ? (
                  <button
                    className={styles.btnSeasonForce}
                    disabled={seasonSaving}
                    onClick={() => forceSeason(NEXT_SEASON[currentSeason])}
                  >
                    NEXT SEASON
                  </button>
                ) : (
                  <button className={styles.btnSeasonReset} disabled={seasonSaving} onClick={clearSeasonOverride}>
                    RESET
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recent articles */}
          <div className={styles.sectionFlat}>
{products.length === 0 ? (
              <p className={styles.empty}>Aucun article pour l&apos;instant.</p>
            ) : (
              <div className={styles.articlesGrid}>
                {[...products].reverse().slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    className={`${styles.articleGridCard} ${p.hidden ? styles.productRowHidden : ''}`}
                    onClick={() => { setDetailProduct(p); setDetailImageIndex(0); setDetailOrigin('dashboard'); setView('article-detail'); }}
                  >
                    <div
                      className={styles.articleGridThumb}
                      style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }}
                    >
                      {p.image && <Image src={p.image} alt={p.title.fr} fill style={{ objectFit: 'cover' }} />}
                      {p.hidden && <span className={styles.hiddenBadge}>masqué</span>}
                    </div>
                    <div className={styles.articleGridStats}>
                      <span className={styles.statPill}>
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="10" cy="10" rx="9" ry="6"/><circle cx="10" cy="10" r="2.5" fill="currentColor" stroke="none"/></svg>
                        {articleStats[String(p.id)]?.views || 0}
                      </span>
                      <span className={styles.statPillVinted}>
                        <span className={styles.statPillVintedLetter}>V</span>
                        {articleStats[String(p.id)]?.vinted || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ARTICLES ────────────────────────────────────────────────────────── */}
      {view === 'articles' && (
        <div className={styles.section}>
          <div className={styles.articlesHeader}>
            <span className={styles.selectionCount}>{products.length} article(s)</span>
            <button
              className={styles.btnPrimary}
              onClick={() => { setForm(emptyForm); setStep(0); setView('add-article'); }}
            >
              + Ajouter
            </button>
          </div>

          {products.length === 0 ? (
            <p className={styles.empty}>Aucun article.</p>
          ) : (
            <div className={styles.articlesGrid}>
              {[...products].reverse().map((p) => (
                <button
                  key={p.id}
                  className={`${styles.articleGridCard} ${p.hidden ? styles.productRowHidden : ''}`}
                  onClick={() => { setDetailProduct(p); setDetailImageIndex(0); setDetailOrigin('articles'); setView('article-detail'); }}
                >
                  <div
                    className={styles.articleGridThumb}
                    style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }}
                  >
                    {p.image && <Image src={p.image} alt={p.title.fr} fill style={{ objectFit: 'cover' }} />}
                    {p.hidden && <span className={styles.hiddenBadge}>masqué</span>}
                  </div>
                  <div className={styles.articleGridStats}>
                    <span className={styles.statPill}>
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="10" cy="10" rx="9" ry="6"/><circle cx="10" cy="10" r="2.5" fill="currentColor" stroke="none"/></svg>
                      {articleStats[String(p.id)]?.views || 0}
                    </span>
                    <span className={styles.statPillVinted}>
                      <span className={styles.statPillVintedLetter}>V</span>
                      {articleStats[String(p.id)]?.vinted || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EDIT ARTICLE (full form) ─────────────────────────────────────────── */}
      {view === 'edit-article' && editingProduct && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{editForm.title || 'Modifier'}</h2>
          <div className={styles.editForm}>
            <div className={styles.editRow}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Titre <span className={styles.stepRequired}>*</span></label>
                <input className={styles.editInput} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Marque</label>
                <input className={styles.editInput} value={editForm.brand} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} />
              </div>
            </div>
            <div className={styles.editRow}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>{editForm.categories.includes('chaussures') ? 'Pointure' : 'Taille'}</label>
                <div className={styles.sizeGrid}>
                  {(editForm.categories.includes('chaussures') ? SHOE_SIZES : SIZES).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.sizeBtn} ${editForm.size === s ? styles.sizeBtnActive : ''}`}
                      onClick={() => setEditForm({ ...editForm, size: editForm.size === s ? '' : s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Prix de vente (€) <span className={styles.stepRequired}>*</span></label>
                <input className={styles.editInput} type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Prix d&apos;achat (€) <span className={styles.editLabelAdmin}>admin</span></label>
                <input className={styles.editInput} type="number" step="0.01" value={editForm.purchasePrice} placeholder="Ce que tu as payé" onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })} />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Provenance</label>
                <select className={styles.editInput} value={editForm.provenance} onChange={(e) => setEditForm({ ...editForm, provenance: e.target.value })}>
                  <option value="">— Non renseignée</option>
                  <option value="Friperie">Friperie</option>
                  <option value="Brocante">Brocante</option>
                  <option value="Don">Don</option>
                  <option value="B2B">B2B</option>
                  <option value="Vinted">Vinted</option>
                </select>
              </div>
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Description</label>
              <textarea className={styles.editTextarea} value={editForm.description} rows={3} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Lien Vinted <span className={styles.stepRequired}>*</span></label>
              <input className={styles.editInput} type="url" value={editForm.vintedUrl} onChange={(e) => setEditForm({ ...editForm, vintedUrl: e.target.value })} />
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Photos</label>
              {editForm.imageUrls.map((url, i) => (
                <div key={i} className={styles.imageUrlRow}>
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className={styles.imageUrlThumb} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  {editForm.imageUrls.length > 1 && (
                    <div className={styles.imgOrderBtns}>
                      <button type="button" disabled={i === 0} onClick={() => {
                        const urls = [...editForm.imageUrls];
                        [urls[i - 1], urls[i]] = [urls[i], urls[i - 1]];
                        setEditForm({ ...editForm, imageUrls: urls });
                      }}>↑</button>
                      <button type="button" disabled={i === editForm.imageUrls.length - 1} onClick={() => {
                        const urls = [...editForm.imageUrls];
                        [urls[i + 1], urls[i]] = [urls[i], urls[i + 1]];
                        setEditForm({ ...editForm, imageUrls: urls });
                      }}>↓</button>
                    </div>
                  )}
                  <input
                    className={styles.editInput}
                    type="url"
                    value={url}
                    placeholder={i === 0 ? 'Photo principale' : 'Photo supplémentaire'}
                    onChange={(e) => {
                      const urls = [...editForm.imageUrls];
                      urls[i] = e.target.value;
                      setEditForm({ ...editForm, imageUrls: urls });
                    }}
                  />
                  {editForm.imageUrls.length > 1 && (
                    <button type="button" className={styles.inlineCancel} onClick={() => setEditForm({ ...editForm, imageUrls: editForm.imageUrls.filter((_, j) => j !== i) })}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.inlineAddBtn} onClick={() => setEditForm({ ...editForm, imageUrls: [...editForm.imageUrls, ''] })}>+</button>
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Catégorie</label>
              <div className={styles.catPicker}>
                <div className={styles.catPills}>
                  {CATEGORIES.filter((c) => c.id !== 'drops' && c.id !== 'ete').filter((c) => !editForm.categories[0] || editForm.categories[0] === c.id).map((cat) => (
                    <button key={cat.id} type="button"
                      className={`${styles.catPill} ${editForm.categories[0] === cat.id ? styles.catPillActive : ''}`}
                      onClick={() => toggleEditCat(cat.id)}
                    >{cat.fr}</button>
                  ))}
                </div>
                {editForm.categories[0] && (() => {
                  const catId = editForm.categories[0];
                  const subs = subcategories.filter((s) => s.parentCategory === catId);
                  return (
                    <div className={styles.subRow}>
                      <div className={styles.subRowPills}>
                        {subs.map((s) => (
                          <button key={s.id} type="button"
                            className={`${styles.subPill} ${editForm.subcategory === s.id ? styles.subPillActive : ''}`}
                            onClick={() => setEditForm({ ...editForm, subcategory: editForm.subcategory === s.id ? '' : s.id })}
                          >{s.label}</button>
                        ))}
                        {editAddingSubFor === catId ? (
                          <div className={styles.inlineSubInput}>
                            <input autoFocus className={styles.inlineInput} value={editNewSubLabel} onChange={(e) => setEditNewSubLabel(e.target.value)} placeholder="Nom..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (editNewSubLabel.trim()) { const id = addSubcategory({ label: editNewSubLabel.trim(), parentCategory: catId }); setEditForm(f => ({ ...f, subcategory: id })); } setEditNewSubLabel(''); setEditAddingSubFor(null); } if (e.key === 'Escape') { setEditNewSubLabel(''); setEditAddingSubFor(null); } }} />
                            <button type="button" className={styles.inlineConfirm} onClick={() => { if (editNewSubLabel.trim()) { const id = addSubcategory({ label: editNewSubLabel.trim(), parentCategory: catId }); setEditForm(f => ({ ...f, subcategory: id })); } setEditNewSubLabel(''); setEditAddingSubFor(null); }}>✓</button>
                            <button type="button" className={styles.inlineCancel} onClick={() => { setEditNewSubLabel(''); setEditAddingSubFor(null); }}>×</button>
                          </div>
                        ) : (
                          <button type="button" className={styles.inlineAddBtn} onClick={() => { setEditAddingSubFor(catId); setEditNewSubLabel(''); }}>+</button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Saisons</label>
              <div className={styles.checkboxGrid}>
                {SEASONS_FORM.map((s) => (
                  <label key={s.id} className={`${styles.checkLabel} ${editForm.seasons.includes(s.id) ? styles.checkActive : ''}`}>
                    <input type="checkbox" className={styles.checkbox} checked={editForm.seasons.includes(s.id)} onChange={() => toggleEditSeason(s.id)} />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Couleurs</label>
              <div className={styles.colorSwatchGrid}>
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    className={`${styles.colorSwatch} ${editForm.tags.includes(c.id) ? styles.colorSwatchActive : ''}`}
                    style={{ background: c.bg }}
                    onClick={() => setEditForm({ ...editForm, tags: editForm.tags.includes(c.id) ? editForm.tags.filter((id) => id !== c.id) : [...editForm.tags, c.id] })}
                  />
                ))}
              </div>
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Sélections</label>
              <div className={styles.subRowPills}>
                {selections.map((sel) => renamingSelId === sel.id ? (
                  <div key={sel.id} className={styles.selEditBlock}>
                    <div className={styles.inlineSubInput}>
                      <input autoFocus className={styles.inlineInput} value={renameSelValue} placeholder="Nom..."
                        onChange={(e) => setRenameSelValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Escape') { setRenamingSelId(null); setRenameSelValue(''); setRenameSelDesc(''); } }}
                      />
                      <button type="button" className={styles.inlineConfirm} onMouseDown={(e) => { e.preventDefault(); confirmRenameSel(); }}>✓</button>
                      <button type="button" className={styles.inlineCancel} onMouseDown={(e) => { e.preventDefault(); setRenamingSelId(null); setRenameSelValue(''); setRenameSelDesc(''); }}>×</button>
                    </div>
                    <textarea className={styles.selDescInput} value={renameSelDesc} placeholder="Texte de présentation (optionnel)..."
                      onChange={(e) => setRenameSelDesc(e.target.value)} rows={2}
                    />
                  </div>
                ) : (
                  <button key={sel.id} type="button"
                    className={`${styles.subPill} ${editForm.selections.includes(sel.id) ? styles.subPillActive : ''}`}
                    onClick={() => setEditForm({ ...editForm, selections: editForm.selections.includes(sel.id) ? editForm.selections.filter(id => id !== sel.id) : [...editForm.selections, sel.id] })}
                    onDoubleClick={() => { setRenamingSelId(sel.id); setRenameSelValue(sel.name); setRenameSelDesc(sel.description ?? ''); }}
                    title="Double-clic pour renommer"
                  >{sel.name}</button>
                ))}
                {editAddingSel ? (
                  <div className={styles.selEditBlock}>
                    <div className={styles.inlineSubInput}>
                      <input autoFocus className={styles.inlineInput} value={editNewSelLabel} placeholder="Nom de la sélection..."
                        onChange={(e) => setEditNewSelLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Escape') { setEditNewSelLabel(''); setEditNewSelDesc(''); setEditAddingSel(false); } }}
                      />
                      <button type="button" className={styles.inlineConfirm} onClick={() => { if (editNewSelLabel.trim()) { const id = addSelection(editNewSelLabel.trim(), editNewSelDesc.trim() || undefined); setEditForm(f => ({ ...f, selections: [...f.selections, id] })); } setEditNewSelLabel(''); setEditNewSelDesc(''); setEditAddingSel(false); }}>✓</button>
                      <button type="button" className={styles.inlineCancel} onClick={() => { setEditNewSelLabel(''); setEditNewSelDesc(''); setEditAddingSel(false); }}>×</button>
                    </div>
                    <textarea className={styles.selDescInput} value={editNewSelDesc} placeholder="Texte de présentation (optionnel)..."
                      onChange={(e) => setEditNewSelDesc(e.target.value)} rows={2}
                    />
                  </div>
                ) : (
                  <button type="button" className={styles.inlineAddBtn} onClick={() => { setEditAddingSel(true); setEditNewSelLabel(''); setEditNewSelDesc(''); }}>+</button>
                )}
              </div>
            </div>
            <div className={styles.editField}>
              <label className={`${styles.checkLabel} ${editForm.favorite ? styles.checkActive : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" className={styles.checkbox} checked={!!editForm.favorite} onChange={(e) => setEditForm({ ...editForm, favorite: e.target.checked, favoriteText: e.target.checked ? editForm.favoriteText : '' })} />
                ♥ Ajouter aux favoris
              </label>
              {editForm.favorite && (
                <>
                  <textarea
                    className={styles.editTextarea}
                    value={editForm.favoriteText}
                    rows={3}
                    maxLength={250}
                    placeholder="Ce que j'aime dans cette pièce..."
                    onChange={(e) => setEditForm({ ...editForm, favoriteText: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: editForm.favoriteText.length >= 230 ? '#C83A20' : 'rgba(58,24,8,0.4)' }}>
                    {editForm.favoriteText.length}/250
                  </span>
                </>
              )}
            </div>
            <div className={styles.editActions}>
              <button type="button" className={styles.stepSkip} onClick={() => setView('articles')}>Annuler</button>
              <button
                type="button"
                className={styles.stepSubmit}
                disabled={!editForm.title || !editForm.vintedUrl || !editForm.price}
                onClick={saveEdit}
              >
                Enregistrer les modifications ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ARTICLE (step-by-step) ───────────────────────────────────────── */}
      {/* ── ARTICLE DETAIL ──────────────────────────────────────────────────── */}
      {view === 'article-detail' && detailProduct && (() => {
        const p = detailProduct;
        const images = (p.images?.filter(Boolean).length ? p.images.filter(Boolean) : p.image ? [p.image] : []) as string[];
        const current = images[detailImageIndex] ?? null;
        return (
          <div className={styles.detailWrap}>
            <div className={styles.detailCard}>
              {p.size && <span className={styles.detailSize}>{p.size}</span>}
              {/* Galerie */}
              <div className={styles.detailGallery}>
                <div className={styles.detailImageWrap} style={{ background: `linear-gradient(145deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }}>
                  {current
                    ? <img src={current} alt={p.title.fr} className={styles.detailImage} />
                    : <div className={styles.detailPlaceholder} />
                  }
                  {images.length > 1 && <>
                    <button className={`${styles.detailArrow} ${styles.detailArrowLeft}`} onClick={() => setDetailImageIndex((detailImageIndex - 1 + images.length) % images.length)}>←</button>
                    <button className={`${styles.detailArrow} ${styles.detailArrowRight}`} onClick={() => setDetailImageIndex((detailImageIndex + 1) % images.length)}>→</button>
                  </>}
                </div>
                {images.length > 1 && (
                  <div className={styles.detailThumbs}>
                    {images.map((src, i) => (
                      <button key={i} className={`${styles.detailThumb} ${i === detailImageIndex ? styles.detailThumbActive : ''}`} onClick={() => setDetailImageIndex(i)}>
                        <img src={src} alt="" className={styles.detailThumbImg} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className={styles.detailInfo}>
                {p.brand && <p className={styles.detailBrand}>{p.brand}</p>}
                <h2 className={styles.detailTitle}>{p.title.fr}</h2>
                {p.description.fr && <p className={styles.detailDesc}>{p.description.fr}</p>}
                <p className={styles.detailPrice}>{p.price} €</p>

                {p.hidden && <span className={styles.hiddenBadge} style={{ position: 'static', fontSize: '0.7rem', display: 'inline-block', marginBottom: '0.5rem' }}>masqué</span>}

                {/* Boutons admin */}
                <div className={styles.detailActions}>
                  <button className={styles.btnPrimary} onClick={() => startEdit(p)}>
                    Modifier
                  </button>
                  {!p.sold && (
                    <button className={styles.btnSold} onClick={() => { setSoldModal({ product: p }); setSoldPriceInput(String(p.price)); }}>
                      Vendu ✓
                    </button>
                  )}
                  {p.sold && <span className={styles.soldBadge}>Vendu {p.soldPrice ? `— ${p.soldPrice} €` : ''}</span>}
                  <div className={styles.detailActionsRow}>
                    <button
                      className={styles.btnSecondary}
                      onClick={() => { updateProduct({ ...p, hidden: !p.hidden }); setDetailProduct({ ...p, hidden: !p.hidden }); }}
                    >
                      {p.hidden ? 'Afficher' : 'Masquer'}
                    </button>
                    <button
                      className={styles.btnTrash}
                      title="Supprimer"
                      onClick={() => { if (confirm('Supprimer cet article ?')) { deleteProduct(p.id); setView('dashboard'); } }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={styles.trashIcon}>
                        {/* Corps */}
                        <rect x="3" y="8" width="14" height="11" rx="1.5"/>
                        {/* Lignes internes */}
                        <line x1="7" y1="10.5" x2="7" y2="16.5"/>
                        <line x1="10" y1="10.5" x2="10" y2="16.5"/>
                        <line x1="13" y1="10.5" x2="13" y2="16.5"/>
                        {/* Couvercle + poignée (animés) */}
                        <g className={styles.trashLid}>
                          <rect x="7" y="3" width="6" height="2.5" rx="1.2"/>
                          <rect x="1.5" y="5.5" width="17" height="2.5" rx="1.2"/>
                        </g>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {view === 'finances' && (() => {
        const soldProducts = products.filter(p => p.sold && p.soldAt);
        const allProducts = products;

        // Totaux globaux
        const totalInvested = allProducts.reduce((s, p) => s + (p.purchasePrice ?? 0), 0);
        const totalSold = soldProducts.reduce((s, p) => s + (p.soldPrice ?? p.price), 0);
        const totalPurchasedSold = soldProducts.reduce((s, p) => s + (p.purchasePrice ?? 0), 0);
        const profit = totalSold - totalPurchasedSold;

        // Grouper par mois/année
        type PeriodData = { invested: number; sold: number; purchase: number; count: number };
        const byMonth: Record<string, PeriodData> = {};
        const byYear: Record<string, PeriodData> = {};
        soldProducts.forEach(p => {
          const d = new Date(p.soldAt!);
          const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const yKey = String(d.getFullYear());
          const sp = p.soldPrice ?? p.price;
          const pp = p.purchasePrice ?? 0;
          if (!byMonth[mKey]) byMonth[mKey] = { invested: 0, sold: 0, purchase: 0, count: 0 };
          byMonth[mKey].sold += sp; byMonth[mKey].purchase += pp; byMonth[mKey].count++;
          if (!byYear[yKey]) byYear[yKey] = { invested: 0, sold: 0, purchase: 0, count: 0 };
          byYear[yKey].sold += sp; byYear[yKey].purchase += pp; byYear[yKey].count++;
        });

        // Stats par sous-catégorie : quantité et marge
        type CatStat = { count: number; margin: number; marginPct: number };
        const byCat: Record<string, CatStat> = {};
        soldProducts.forEach(p => {
          const key = p.subcategory || p.categories[0] || 'autre';
          const sp = p.soldPrice ?? p.price;
          const pp = p.purchasePrice ?? 0;
          if (!byCat[key]) byCat[key] = { count: 0, margin: 0, marginPct: 0 };
          byCat[key].count++;
          byCat[key].margin += sp - pp;
        });
        Object.keys(byCat).forEach(k => {
          const sold = soldProducts.filter(p => (p.subcategory || p.categories[0] || 'autre') === k);
          const totalSoldC = sold.reduce((s, p) => s + (p.soldPrice ?? p.price), 0);
          byCat[k].marginPct = totalSoldC > 0 ? (byCat[k].margin / totalSoldC) * 100 : 0;
        });
        const byQty = Object.entries(byCat).sort((a, b) => b[1].count - a[1].count);
        const byMargin = Object.entries(byCat).sort((a, b) => b[1].margin - a[1].margin);

        const fmt2 = (n: number) => n.toFixed(2);
        const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));
        const years = Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));

        return (
          <div className={styles.section}>
            {/* Totaux */}
            <div className={styles.financeCards}>
              <div className={styles.financeCard}>
                <span className={styles.financeCardLabel}>Investi</span>
                <span className={styles.financeCardValue}>{fmt2(totalInvested)} €</span>
                <span className={styles.financeCardSub}>{allProducts.filter(p => p.purchasePrice).length} articles renseignés</span>
              </div>
              <div className={styles.financeCard}>
                <span className={styles.financeCardLabel}>Encaissé</span>
                <span className={styles.financeCardValue} style={{ color: '#1a9e6e' }}>{fmt2(totalSold)} €</span>
                <span className={styles.financeCardSub}>{soldProducts.length} ventes</span>
              </div>
              <div className={`${styles.financeCard} ${profit >= 0 ? styles.financeCardProfit : styles.financeCardLoss}`}>
                <span className={styles.financeCardLabel}>Bénéfice</span>
                <span className={styles.financeCardValue}>{profit >= 0 ? '+' : ''}{fmt2(profit)} €</span>
                <span className={styles.financeCardSub}>sur les articles vendus</span>
              </div>
            </div>

            {/* Par année */}
            {years.length > 0 && (
              <div className={styles.financeBlock}>
                <h3 className={styles.financeBlockTitle}>Par année</h3>
                <div className={styles.financeTable}>
                  <div className={styles.financeTableHead}>
                    <span>Année</span><span>Ventes</span><span>Encaissé</span><span>Bénéfice</span>
                  </div>
                  {years.map(([k, v]) => (
                    <div key={k} className={styles.financeTableRow}>
                      <span>{k}</span>
                      <span>{v.count}</span>
                      <span>{fmt2(v.sold)} €</span>
                      <span style={{ color: v.sold - v.purchase >= 0 ? '#1a9e6e' : '#C83A20' }}>{v.sold - v.purchase >= 0 ? '+' : ''}{fmt2(v.sold - v.purchase)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Par mois */}
            {months.length > 0 && (
              <div className={styles.financeBlock}>
                <h3 className={styles.financeBlockTitle}>Par mois</h3>
                <div className={styles.financeTable}>
                  <div className={styles.financeTableHead}>
                    <span>Mois</span><span>Ventes</span><span>Encaissé</span><span>Bénéfice</span>
                  </div>
                  {months.map(([k, v]) => {
                    const [y, m] = k.split('-');
                    const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    return (
                      <div key={k} className={styles.financeTableRow}>
                        <span style={{ textTransform: 'capitalize' }}>{label}</span>
                        <span>{v.count}</span>
                        <span>{fmt2(v.sold)} €</span>
                        <span style={{ color: v.sold - v.purchase >= 0 ? '#1a9e6e' : '#C83A20' }}>{v.sold - v.purchase >= 0 ? '+' : ''}{fmt2(v.sold - v.purchase)} €</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats catégories */}
            {byQty.length > 0 && (
              <div className={styles.financeStatsGrid}>
                <div className={styles.financeBlock}>
                  <h3 className={styles.financeBlockTitle}>Top ventes — quantité</h3>
                  {byQty.map(([k, v]) => (
                    <div key={k} className={styles.financeStatRow}>
                      <span className={styles.financeStatLabel}>{k}</span>
                      <span className={styles.financeStatBar}><span style={{ width: `${(v.count / byQty[0][1].count) * 100}%` }} /></span>
                      <span className={styles.financeStatVal}>{v.count}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.financeBlock}>
                  <h3 className={styles.financeBlockTitle}>Top ventes — marge €</h3>
                  {byMargin.map(([k, v]) => (
                    <div key={k} className={styles.financeStatRow}>
                      <span className={styles.financeStatLabel}>{k}</span>
                      <span className={styles.financeStatBar}><span style={{ width: `${Math.max(0, (v.margin / byMargin[0][1].margin) * 100)}%`, background: '#1a9e6e' }} /></span>
                      <span className={styles.financeStatVal} style={{ color: v.margin >= 0 ? '#1a9e6e' : '#C83A20' }}>{v.margin >= 0 ? '+' : ''}{fmt2(v.margin)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {soldProducts.length === 0 && (
              <p className={styles.empty}>Aucune vente enregistrée pour l&apos;instant.</p>
            )}
          </div>
        );
      })()}

      {/* ── CATALOGUE ───────────────────────────────────────────────────────── */}
      {view === 'catalog' && (
        <div className={styles.section}>
          <p style={{ fontSize: '0.78rem', color: 'rgba(58,24,8,0.5)', marginBottom: '1.5rem' }}>
            Glisser-déposer pour réordonner. Les changements sont sauvegardés automatiquement.
          </p>

          {/* Sous-catégories par catégorie */}
          <h3 className={styles.sectionTitle}>Sous-catégories</h3>
          {CATEGORIES.filter((c) => c.id !== 'drops' && c.id !== 'ete').map((cat) => {
            const subs = subcategories.filter((s) => s.parentCategory === cat.id);
            if (subs.length === 0) return null;
            return (
              <div key={cat.id} className={styles.catalogSection}>
                <p className={styles.catalogSectionTitle}>{cat.fr}</p>
                <div className={styles.catalogList}>
                  {subs.map((sub) => (
                    <div
                      key={sub.id}
                      className={`${styles.catalogItem} ${dragOverSub === sub.id && dragSub !== sub.id ? styles.catalogItemOver : ''}`}
                      draggable
                      onDragStart={() => setDragSub(sub.id)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverSub(sub.id); }}
                      onDrop={() => {
                        if (!dragSub || dragSub === sub.id) { setDragSub(null); setDragOverSub(null); return; }
                        const catSubs = subcategories.filter((s) => s.parentCategory === cat.id);
                        const otherSubs = subcategories.filter((s) => s.parentCategory !== cat.id);
                        const fromIdx = catSubs.findIndex((s) => s.id === dragSub);
                        const toIdx = catSubs.findIndex((s) => s.id === sub.id);
                        if (fromIdx === -1) { setDragSub(null); setDragOverSub(null); return; }
                        const newCatSubs = [...catSubs];
                        const [moved] = newCatSubs.splice(fromIdx, 1);
                        newCatSubs.splice(toIdx, 0, moved);
                        reorderSubcategories([...otherSubs, ...newCatSubs]);
                        setDragSub(null); setDragOverSub(null);
                      }}
                      onDragEnd={() => { setDragSub(null); setDragOverSub(null); }}
                    >
                      <span className={styles.catalogDragHandle}>⠿</span>
                      <span className={styles.catalogItemLabel}>{sub.label}</span>
                      <button
                        className={styles.catalogItemDelete}
                        title="Supprimer"
                        onClick={() => { if (confirm(`Supprimer "${sub.label}" ?`)) deleteSubcategory(sub.id); }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Sélections */}
          <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Sélections</h3>
          <div className={styles.catalogList}>
            {selections.map((sel) => catalogSelEditId === sel.id ? (
              <div key={sel.id} className={styles.catalogSelEditBlock}>
                <input
                  autoFocus
                  className={styles.inlineInput}
                  value={catalogSelName}
                  placeholder="Nom..."
                  onChange={(e) => setCatalogSelName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setCatalogSelEditId(null); }}
                  style={{ width: '100%', marginBottom: '0.4rem' }}
                />
                <textarea
                  className={styles.selDescInput}
                  value={catalogSelDesc}
                  placeholder="Texte de présentation (optionnel)..."
                  rows={2}
                  onChange={(e) => setCatalogSelDesc(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <button className={styles.inlineConfirm} style={{ width: 'auto', padding: '0 0.75rem', borderRadius: '6px' }} onClick={() => {
                    if (catalogSelName.trim()) updateSelection(sel.id, catalogSelName.trim(), catalogSelDesc.trim() || undefined);
                    setCatalogSelEditId(null);
                  }}>✓ Enregistrer</button>
                  <button className={styles.inlineCancel} style={{ width: 'auto', padding: '0 0.75rem', borderRadius: '6px' }} onClick={() => setCatalogSelEditId(null)}>Annuler</button>
                </div>
              </div>
            ) : (
              <div
                key={sel.id}
                className={`${styles.catalogItem} ${dragOverSel === sel.id && dragSel !== sel.id ? styles.catalogItemOver : ''}`}
                draggable
                onDragStart={() => setDragSel(sel.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverSel(sel.id); }}
                onDrop={() => {
                  if (!dragSel || dragSel === sel.id) { setDragSel(null); setDragOverSel(null); return; }
                  const fromIdx = selections.findIndex(s => s.id === dragSel);
                  const toIdx = selections.findIndex(s => s.id === sel.id);
                  if (fromIdx === -1) { setDragSel(null); setDragOverSel(null); return; }
                  const newOrder = [...selections];
                  const [moved] = newOrder.splice(fromIdx, 1);
                  newOrder.splice(toIdx, 0, moved);
                  reorderSelections(newOrder);
                  setDragSel(null); setDragOverSel(null);
                }}
                onDragEnd={() => { setDragSel(null); setDragOverSel(null); }}
              >
                <span className={styles.catalogDragHandle}>⠿</span>
                <span className={styles.catalogItemLabel}>
                  <strong>{sel.name}</strong>
                  {sel.description && <em style={{ marginLeft: '0.5rem', fontWeight: 400, opacity: 0.7, fontSize: '0.8rem' }}>{sel.description}</em>}
                  {sel.postitImage && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#1a9e6e' }}>post-it ✓</span>}
                </span>
                <label
                  title={sel.postitImage ? "Image post-it liée — cliquer pour changer" : "Lier une image post-it"}
                  style={{ background: 'none', color: sel.postitImage ? '#1a9e6e' : 'rgba(58,24,8,0.35)', fontSize: '0.8rem', padding: '0 0.4rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', border: 'none' }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={postitUploading === sel.id}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPostitUploading(sel.id);
                      const url = await uploadPostitImage(file, sel.id);
                      if (url) setPostitImage(sel.id, url);
                      setPostitUploading(null);
                      e.target.value = '';
                    }}
                  />
                  {postitUploading === sel.id ? '…' : '⬆'}
                </label>
                <button className={styles.catalogItemDelete} title="Modifier" style={{ background: 'none', color: 'var(--orange)', fontSize: '0.8rem', width: 'auto', padding: '0 0.4rem' }}
                  onClick={() => { setCatalogSelEditId(sel.id); setCatalogSelName(sel.name); setCatalogSelDesc(sel.description ?? ''); }}
                >✎</button>
                <button className={styles.catalogItemDelete} title="Supprimer"
                  onClick={() => { if (confirm(`Supprimer la sélection "${sel.name}" ?`)) deleteSelection(sel.id); }}
                >×</button>
              </div>
            ))}
            {catalogAddingSel ? (
              <div className={styles.catalogSelEditBlock}>
                <input
                  autoFocus
                  className={styles.inlineInput}
                  value={catalogNewSelName}
                  placeholder="Nom de la sélection..."
                  onChange={(e) => setCatalogNewSelName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setCatalogAddingSel(false); } }}
                  style={{ width: '100%', marginBottom: '0.4rem' }}
                />
                <textarea
                  className={styles.selDescInput}
                  value={catalogNewSelDesc}
                  placeholder="Texte de présentation (optionnel)..."
                  rows={2}
                  onChange={(e) => setCatalogNewSelDesc(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <button className={styles.inlineConfirm} style={{ width: 'auto', padding: '0 0.75rem', borderRadius: '6px' }} onClick={() => {
                    if (catalogNewSelName.trim()) addSelection(catalogNewSelName.trim(), catalogNewSelDesc.trim() || undefined);
                    setCatalogAddingSel(false); setCatalogNewSelName(''); setCatalogNewSelDesc('');
                  }}>✓ Créer</button>
                  <button className={styles.inlineCancel} style={{ width: 'auto', padding: '0 0.75rem', borderRadius: '6px' }} onClick={() => { setCatalogAddingSel(false); setCatalogNewSelName(''); setCatalogNewSelDesc(''); }}>Annuler</button>
                </div>
              </div>
            ) : (
              <button className={styles.inlineAddBtn} onClick={() => { setCatalogAddingSel(true); setCatalogNewSelName(''); setCatalogNewSelDesc(''); }}>
                + Nouvelle sélection
              </button>
            )}
          </div>

          {/* Couleurs */}
          <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Couleurs</h3>
          <p className={styles.catalogSectionTitle}>Ordre d&apos;apparition dans les filtres</p>
          <div className={styles.catalogColorGrid}>
            {colorOrder.map((colorId) => {
              const color = getColor(colorId);
              if (!color) return null;
              return (
                <div
                  key={colorId}
                  className={`${styles.catalogColorItem} ${dragOverColor === colorId && dragColor !== colorId ? styles.catalogColorItemOver : ''}`}
                  draggable
                  onDragStart={() => setDragColor(colorId)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverColor(colorId); }}
                  onDrop={() => {
                    if (!dragColor || dragColor === colorId) { setDragColor(null); setDragOverColor(null); return; }
                    const fromIdx = colorOrder.indexOf(dragColor);
                    const toIdx = colorOrder.indexOf(colorId);
                    const newOrder = [...colorOrder];
                    const [moved] = newOrder.splice(fromIdx, 1);
                    newOrder.splice(toIdx, 0, moved);
                    setColorOrder(newOrder);
                    setDragColor(null); setDragOverColor(null);
                  }}
                  onDragEnd={() => { setDragColor(null); setDragOverColor(null); }}
                >
                  <div
                    className={styles.catalogColorSwatch}
                    style={{ background: color.bg }}
                  />
                  {editingColorLabel === colorId ? (
                    <input
                      autoFocus
                      className={styles.colorLabelInput}
                      value={editingColorLabelVal}
                      onChange={(e) => setEditingColorLabelVal(e.target.value)}
                      onBlur={() => {
                        if (editingColorLabelVal.trim()) setColorLabel(colorId, editingColorLabelVal.trim());
                        setEditingColorLabel(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { if (editingColorLabelVal.trim()) setColorLabel(colorId, editingColorLabelVal.trim()); setEditingColorLabel(null); }
                        if (e.key === 'Escape') setEditingColorLabel(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      title="Double-cliquer pour renommer"
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        setEditingColorLabel(colorId);
                        setEditingColorLabelVal(colorLabels[colorId] ?? color.label);
                      }}
                    >{colorLabels[colorId] ?? color.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Post-its spéciaux */}
          <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Post-its spéciaux</h3>
          <div className={styles.catalogList}>
            {(['summer', 'coeur'] as const).map((key) => {
              const label = key === 'summer' ? 'SUMMER' : 'Coups de cœur';
              const url = specialPostits[key];
              return (
                <div key={key} className={styles.catalogItem} style={{ alignItems: 'center' }}>
                  {url && <img src={url} alt={label} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 4, marginRight: '0.5rem', background: '#f5f0eb' }} />}
                  <span className={styles.catalogItemLabel}><strong>{label}</strong></span>
                  <label style={{ background: 'none', color: url ? '#1a9e6e' : 'rgba(58,24,8,0.35)', fontSize: '0.8rem', padding: '0 0.4rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', border: 'none' }}
                    title={url ? 'Image liée — cliquer pour changer' : 'Lier une image post-it'}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={specialPostitUploading === key}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSpecialPostitUploading(key);
                        const newUrl = await uploadSpecialPostit(file, key);
                        if (newUrl) {
                          const next = { ...specialPostits, [key]: newUrl };
                          setSpecialPostits(next);
                          setData('config_special_postits', next);
                        }
                        setSpecialPostitUploading(null);
                        e.target.value = '';
                      }} />
                    {specialPostitUploading === key ? '…' : '⬆'}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {soldModal && (
        <div className={styles.modalOverlay} onClick={() => setSoldModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirmer la vente</h3>
            <p className={styles.modalSub}>{soldModal.product.title.fr}</p>
            <label className={styles.modalLabel}>Prix de vente réel (€)</label>
            <input
              className={styles.modalInput}
              type="number"
              step="0.01"
              value={soldPriceInput}
              onChange={(e) => setSoldPriceInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') confirmSold(); }}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setSoldModal(null)}>Annuler</button>
              <button className={styles.btnSold} onClick={confirmSold}>Confirmer ✓</button>
            </div>
          </div>
        </div>
      )}

      {view === 'add-article' && (
        <>
        <section className={styles.section}>
          <div className={styles.stepProgress}>
            {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
              <div key={i} className={`${styles.stepDot} ${i === step ? styles.stepDotActive : i < step ? styles.stepDotDone : ''}`} onClick={() => setStep(i)} />
            ))}
          </div>

          <div className={styles.stepCard}>
            {step === 0 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Quel est le nom de la pièce ? <span className={styles.stepRequired}>*</span></p>
                <input autoFocus className={styles.stepInput} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Blouse vintage à fleurs" onKeyDown={(e) => { if (e.key === 'Enter' && form.title.trim()) next(); }} />
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} disabled={!form.title.trim()} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>La marque ?</p>
                <input autoFocus className={styles.stepInput} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Zara, H&M, Vintage..." onKeyDown={(e) => { if (e.key === 'Enter') next(); }} />
                {(() => {
                  const freq: Record<string, number> = {};
                  products.forEach(p => { if (p.brand) freq[p.brand] = (freq[p.brand] || 0) + 1; });
                  const all = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([b]) => b);
                  const filtered = form.brand ? all.filter(b => b.toLowerCase().includes(form.brand.toLowerCase()) && b.toLowerCase() !== form.brand.toLowerCase()) : all;
                  return filtered.length > 0 ? (
                    <div className={styles.brandSuggestions}>
                      {filtered.map(brand => (
                        <button key={brand} type="button" className={styles.brandSuggestion} onClick={() => { setForm({ ...form, brand }); next(); }}>
                          {brand}
                        </button>
                      ))}
                    </div>
                  ) : null;
                })()}
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>La taille ?</p>
                <div className={styles.sizeGrid}>
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.sizeBtn} ${form.size === s ? styles.sizeBtnActive : ''}`}
                      onClick={() => { setForm({ ...form, size: s }); setTimeout(next, 200); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Le prix de vente en € ? <span className={styles.stepRequired}>*</span></p>
                <input autoFocus className={styles.stepInput} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Ex: 25" onKeyDown={(e) => { if (e.key === 'Enter' && form.price) next(); }} />
                <p className={styles.stepQ} style={{ marginTop: '1.25rem', fontSize: '0.9rem', opacity: 0.75 }}>Prix d&apos;achat en € ? <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>admin uniquement</span></p>
                <input className={styles.stepInput} type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="Ex: 8" onKeyDown={(e) => { if (e.key === 'Enter' && form.price) next(); }} />
                <p className={styles.stepQ} style={{ marginTop: '1.25rem', fontSize: '0.9rem', opacity: 0.75 }}>Provenance ?</p>
                <select className={styles.stepInput} value={form.provenance} onChange={(e) => setForm({ ...form, provenance: e.target.value })}>
                  <option value="">— Non renseignée</option>
                  <option value="Friperie">Friperie</option>
                  <option value="Brocante">Brocante</option>
                  <option value="Don">Don</option>
                  <option value="B2B">B2B</option>
                  <option value="Vinted">Vinted</option>
                </select>
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} disabled={!form.price} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Une description ?</p>
                <textarea autoFocus className={styles.stepTextarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Matière, coupe, état, conseils de style..." />
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 5 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Le lien Vinted ? <span className={styles.stepRequired}>*</span></p>
                <input autoFocus className={styles.stepInput} type="url" value={form.vintedUrl} onChange={(e) => setForm({ ...form, vintedUrl: e.target.value })} placeholder="https://www.vinted.fr/items/..." onKeyDown={(e) => { if (e.key === 'Enter' && form.vintedUrl) next(); }} />
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} disabled={!form.vintedUrl} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 6 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Les photos ?</p>
                {form.imageUrls.map((url, i) => (
                  <div key={i} className={styles.imageUrlRow}>
                    <input className={`${styles.stepInput} ${styles.stepInputSm}`} type="url" value={url} onChange={(e) => { const urls = [...form.imageUrls]; urls[i] = e.target.value; setForm({ ...form, imageUrls: urls }); }} placeholder={i === 0 ? 'https://... (photo principale)' : 'https://...'} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (i === form.imageUrls.length - 1) setForm({ ...form, imageUrls: [...form.imageUrls, ''] }); } }} />
                    {form.imageUrls.length > 1 && <button type="button" className={styles.inlineCancel} onClick={() => setForm({ ...form, imageUrls: form.imageUrls.filter((_, j) => j !== i) })}>×</button>}
                  </div>
                ))}
                <button type="button" className={styles.inlineAddBtn} onClick={() => setForm({ ...form, imageUrls: [...form.imageUrls, ''] })}>+</button>
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 7 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Dans quelle catégorie ?</p>
                <div className={styles.catPicker}>
                  <div className={styles.catPills}>
                    {CATEGORIES.filter((cat) => cat.id !== 'drops' && cat.id !== 'ete').filter((c) => !form.categories[0] || form.categories[0] === c.id).map((cat) => (
                      <button key={cat.id} type="button"
                        className={`${styles.catPill} ${form.categories[0] === cat.id ? styles.catPillActive : ''}`}
                        onClick={() => toggleCategory(cat.id)}
                      >{cat.fr}</button>
                    ))}
                  </div>
                  {form.categories[0] && (() => {
                    const catId = form.categories[0];
                    const subs = subcategories.filter((s) => s.parentCategory === catId);
                    return (
                      <div className={styles.subRow}>
                        <div className={styles.subRowPills}>
                          {subs.map((s) => (
                            <button key={s.id} type="button"
                              className={`${styles.subPill} ${form.subcategory === s.id ? styles.subPillActive : ''}`}
                              onClick={() => setForm({ ...form, subcategory: form.subcategory === s.id ? '' : s.id })}
                            >{s.label}</button>
                          ))}
                          {addingSubFor === catId ? (
                            <div className={styles.inlineSubInput}>
                              <input autoFocus className={styles.inlineInput} value={newSubLabel} onChange={(e) => setNewSubLabel(e.target.value)} placeholder="Nom..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSubLabel.trim()) { const id = addSubcategory({ label: newSubLabel.trim(), parentCategory: catId }); setForm(f => ({ ...f, subcategory: id })); } setNewSubLabel(''); setAddingSubFor(null); } if (e.key === 'Escape') { setNewSubLabel(''); setAddingSubFor(null); } }} />
                              <button type="button" className={styles.inlineConfirm} onClick={() => { if (newSubLabel.trim()) { const id = addSubcategory({ label: newSubLabel.trim(), parentCategory: catId }); setForm(f => ({ ...f, subcategory: id })); } setNewSubLabel(''); setAddingSubFor(null); }}>✓</button>
                              <button type="button" className={styles.inlineCancel} onClick={() => { setNewSubLabel(''); setAddingSubFor(null); }}>×</button>
                            </div>
                          ) : (
                            <button type="button" className={styles.inlineAddBtn} onClick={() => { setAddingSubFor(catId); setNewSubLabel(''); }}>+</button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {form.categories[0] === 'chaussures' && (
                    <div className={styles.subRow} style={{ marginTop: '1rem' }}>
                      <p className={styles.stepQSm}>La pointure ?</p>
                      <div className={styles.sizeGrid}>
                        {SHOE_SIZES.map((s) => (
                          <button key={s} type="button"
                            className={`${styles.sizeBtn} ${form.size === s ? styles.sizeBtnActive : ''}`}
                            onClick={() => setForm({ ...form, size: s })}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 8 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Quelle(s) saison(s) ?</p>
                <div className={styles.checkboxGrid}>
                  {SEASONS_FORM.map((s) => (
                    <label key={s.id} className={`${styles.checkLabel} ${form.seasons.includes(s.id) ? styles.checkActive : ''}`}>
                      <input type="checkbox" checked={form.seasons.includes(s.id)} onChange={() => toggleSeason(s.id)} className={styles.checkbox} />
                      {s.label}
                    </label>
                  ))}
                </div>
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 9 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>La couleur ?</p>
                <div className={styles.colorSwatchGrid}>
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      className={`${styles.colorSwatch} ${form.tags.includes(c.id) ? styles.colorSwatchActive : ''}`}
                      style={{ background: c.bg }}
                      onClick={() => setForm({ ...form, tags: form.tags.includes(c.id) ? form.tags.filter((id) => id !== c.id) : [...form.tags, c.id] })}
                    />
                  ))}
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                  <label className={`${styles.checkLabel} ${form.favorite ? styles.checkActive : ''}`} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" className={styles.checkbox} checked={!!form.favorite} onChange={(e) => setForm({ ...form, favorite: e.target.checked, favoriteText: e.target.checked ? form.favoriteText : '' })} />
                    ♥ Ajouter aux favoris
                  </label>
                  {form.favorite && (
                    <>
                      <textarea
                        className={styles.stepTextarea}
                        value={form.favoriteText}
                        rows={3}
                        maxLength={250}
                        placeholder="Ce que j'aime dans cette pièce..."
                        onChange={(e) => setForm({ ...form, favoriteText: e.target.value })}
                        style={{ marginTop: '0.75rem' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: form.favoriteText.length >= 230 ? '#C83A20' : 'rgba(58,24,8,0.4)' }}>
                        {form.favoriteText.length}/250
                      </span>
                    </>
                  )}
                </div>
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 10 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Dans quelle(s) sélection(s) ?</p>
                <div className={styles.subRowPills}>
                  {selections.map((sel) => renamingSelId === sel.id ? (
                    <div key={sel.id} className={styles.inlineSubInput}>
                      <input autoFocus className={styles.inlineInput} value={renameSelValue}
                        onChange={(e) => setRenameSelValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmRenameSel(); } if (e.key === 'Escape') { setRenamingSelId(null); setRenameSelValue(''); } }}
                        onBlur={confirmRenameSel}
                      />
                      <button type="button" className={styles.inlineConfirm} onMouseDown={(e) => { e.preventDefault(); confirmRenameSel(); }}>✓</button>
                      <button type="button" className={styles.inlineCancel} onMouseDown={(e) => { e.preventDefault(); setRenamingSelId(null); setRenameSelValue(''); }}>×</button>
                    </div>
                  ) : (
                    <button key={sel.id} type="button"
                      className={`${styles.subPill} ${form.selections.includes(sel.id) ? styles.subPillActive : ''}`}
                      onClick={() => setForm({ ...form, selections: form.selections.includes(sel.id) ? form.selections.filter(id => id !== sel.id) : [...form.selections, sel.id] })}
                      onDoubleClick={() => { setRenamingSelId(sel.id); setRenameSelValue(sel.name); }}
                    >{sel.name}</button>
                  ))}
                  {addingSel ? (
                    <div className={styles.selEditBlock}>
                      <div className={styles.inlineSubInput}>
                        <input autoFocus className={styles.inlineInput} value={newSelLabel} placeholder="Nom de la sélection..."
                          onChange={(e) => setNewSelLabel(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Escape') { setNewSelLabel(''); setNewSelDesc(''); setAddingSel(false); } }}
                        />
                        <button type="button" className={styles.inlineConfirm} onClick={() => { if (newSelLabel.trim()) { const id = addSelection(newSelLabel.trim(), newSelDesc.trim() || undefined); setForm(f => ({ ...f, selections: [...f.selections, id] })); } setNewSelLabel(''); setNewSelDesc(''); setAddingSel(false); }}>✓</button>
                        <button type="button" className={styles.inlineCancel} onClick={() => { setNewSelLabel(''); setNewSelDesc(''); setAddingSel(false); }}>×</button>
                      </div>
                      <textarea className={styles.selDescInput} value={newSelDesc} placeholder="Texte de présentation (optionnel)..." rows={2} onChange={(e) => setNewSelDesc(e.target.value)} />
                    </div>
                  ) : (
                    <button type="button" className={styles.inlineAddBtn} onClick={() => { setAddingSel(true); setNewSelLabel(''); setNewSelDesc(''); }}>+</button>
                  )}
                </div>
                <div className={styles.stepActions}>
                  <button className={styles.stepNext} onClick={next}>Continuer →</button>
                </div>
              </div>
            )}
            {step === 11 && (
              <div className={styles.stepField}>
                <p className={styles.stepQ}>Récap — tout est bon ?</p>
                <div className={styles.stepRecap}>
                  <div className={styles.recapRow}><span className={styles.recapLabel}>Titre</span><span>{form.title || '—'}</span></div>
                  {form.brand       && <div className={styles.recapRow}><span className={styles.recapLabel}>Marque</span><span>{form.brand}</span></div>}
                  {form.size        && <div className={styles.recapRow}><span className={styles.recapLabel}>Taille</span><span>{form.size}</span></div>}
                  <div className={styles.recapRow}><span className={styles.recapLabel}>Prix</span><span>{form.price ? `${form.price} €` : '—'}</span></div>
                  {form.description && <div className={styles.recapRow}><span className={styles.recapLabel}>Description</span><span className={styles.recapDesc}>{form.description}</span></div>}
                  <div className={styles.recapRow}><span className={styles.recapLabel}>Vinted</span><span className={styles.recapLink}>{form.vintedUrl ? '✓ lien ajouté' : '—'}</span></div>
                  <div className={styles.recapRow}><span className={styles.recapLabel}>Photos</span><span>{form.imageUrls.filter(Boolean).length} photo(s)</span></div>
                  {form.categories.length > 0 && <div className={styles.recapRow}><span className={styles.recapLabel}>Catégories</span><span>{form.categories.join(', ')}</span></div>}
                  {form.seasons.length > 0    && <div className={styles.recapRow}><span className={styles.recapLabel}>Saisons</span><span>{form.seasons.join(', ')}</span></div>}
                </div>
                {success && <p className={styles.stepSuccess}>✓ Article ajouté !</p>}
                <div className={styles.stepActions}>
                  <button className={styles.stepSkip} onClick={() => setView('dashboard')}>Annuler</button>
                  <button
                    className={styles.stepSubmit}
                    disabled={!form.title || !form.vintedUrl || !form.price}
                    onClick={(e) => handleAddSubmit(e as unknown as React.FormEvent)}
                  >
                    Publier l&apos;article ✓
                  </button>
                </div>
              </div>
            )}

            <div className={styles.stepNav}>
              {step > 0 && <button className={styles.stepBack} onClick={prev}>← Retour</button>}
              <span className={styles.stepCounter}>{step + 1} / {TOTAL_STEPS + 1}</span>
            </div>
          </div>
        </section>
        </>
      )}

      {/* ── BIO ─────────────────────────────────────────────────────────────── */}
      {view === 'bio' && (
        <div className={styles.section}>
          {bioSaved && <span className={styles.bioSavedMsg}>✓ Enregistré</span>}
          {([
            { label: 'Bloc 1', value: bio1, set: setBio1, title: bioTitle1, setTitle: setBioTitle1 },
            { label: 'Bloc 2', value: bio2, set: setBio2, title: bioTitle2, setTitle: setBioTitle2 },
            { label: 'Bloc 3', value: bio3, set: setBio3, title: bioTitle3, setTitle: setBioTitle3, tooltip: bio3Tooltip, setTooltip: setBio3Tooltip },
          ] as { label: string; value: string; set: (v: string) => void; title: string; setTitle: (v: string) => void; tooltip?: string; setTooltip?: (v: string) => void }[]).map(({ label, value, set, title, setTitle, tooltip, setTooltip }) => (
            <div key={label} className={styles.bioBlock}>
              <label className={styles.editLabel}>{label}</label>
              <input
                className={styles.editInput}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setBioSaved(false); }}
                placeholder="Titre..."
              />
              <textarea
                className={styles.bioTextarea}
                value={value}
                onChange={(e) => { set(e.target.value); setBioSaved(false); }}
                placeholder="Texte..."
                rows={4}
              />
              {setTooltip !== undefined && (
                <>
                  <label className={styles.editLabel} style={{ marginTop: '0.5rem' }}>Info-bulle (i)</label>
                  <input
                    className={styles.editInput}
                    value={tooltip ?? ''}
                    onChange={(e) => { setTooltip(e.target.value); setBioSaved(false); }}
                    placeholder="Texte au survol du (i)..."
                  />
                </>
              )}
            </div>
          ))}
          <div className={styles.bioActions}>
            <button
              className={styles.btnPrimary}
              disabled={bioSaving}
              onClick={async () => {
                setBioSaving(true);
                await Promise.all([
                  setData('bio1', bio1),
                  setData('bio2', bio2),
                  setData('bio3', bio3),
                  setData('bioTitle1', bioTitle1),
                  setData('bioTitle2', bioTitle2),
                  setData('bioTitle3', bioTitle3),
                  setData('bio3Tooltip', bio3Tooltip),
                ]);
                setBioSaving(false);
                setBioSaved(true);
              }}
            >
              {bioSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
