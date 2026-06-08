'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProducts } from '@/context/ProductsContext';
import { useSubcategories } from '@/context/SubcategoriesContext';
import { useTags } from '@/context/TagsContext';
import { CATEGORIES } from '@/data/categories';
import type { Category, Season } from '@/data/products';

const SEASONS: { id: Season; label: string }[] = [
  { id: 'printemps', label: 'Printemps' },
  { id: 'ete',       label: 'Été' },
  { id: 'automne',   label: 'Automne' },
  { id: 'hiver',     label: 'Hiver' },
];
import styles from './Admin.module.css';

const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'mintsyrup2026';

const PLACEHOLDERS: [string, string][] = [
  ['#E8621A', '#F5C842'],
  ['#D8385A', '#F4D0C0'],
  ['#F0A820', '#E8621A'],
  ['#C82858', '#F0A820'],
  ['#F07838', '#D8385A'],
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
};

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [addingSubFor, setAddingSubFor] = useState<Category | null>(null);
  const [newSubLabel, setNewSubLabel] = useState('');
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { subcategories, addSubcategory, deleteSubcategory } = useSubcategories();
  const { tags, addTag, deleteTag } = useTags();
  const [addingTag, setAddingTag] = useState(false);

  const handleExport = () => {
    const data = {
      products: localStorage.getItem('msc_products'),
      subcategories: localStorage.getItem('msc_subcategories'),
      tags: localStorage.getItem('msc_tags'),
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mintsyrup-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.products) localStorage.setItem('msc_products', data.products);
        if (data.subcategories) localStorage.setItem('msc_subcategories', data.subcategories);
        if (data.tags) localStorage.setItem('msc_tags', data.tags);
        window.location.reload();
      } catch {}
    };
    reader.readAsText(file);
  };
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('#E8621A');

  const login = () => {
    if (pwd === PASSWORD) { setAuth(true); setPwdError(false); }
    else setPwdError(true);
  };

  const toggleSeason = (id: Season) => {
    setForm((f) => ({
      ...f,
      seasons: f.seasons.includes(id) ? f.seasons.filter((s) => s !== id) : [...f.seasons, id],
    }));
  };

  const toggleCategory = (id: Category) => {
    setForm((f) => {
      const newCats = f.categories.includes(id)
        ? f.categories.filter((c) => c !== id)
        : [...f.categories, id];
      const subStillValid = subcategories.some(
        (s) => s.id === f.subcategory && (newCats.length === 0 || newCats.includes(s.parentCategory))
      );
      return { ...f, categories: newCats, subcategory: subStillValid ? f.subcategory : '' };
    });
  };

  const startEdit = (p: (typeof products)[0]) => {
    setForm({
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
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.vintedUrl || !form.price) return;
    if (editingId !== null) {
      const existing = products.find((p) => p.id === editingId)!;
      updateProduct({
        ...existing,
        brand: form.brand || null,
        title: { fr: form.title, en: form.title },
        size: form.size,
        price: parseFloat(form.price),
        description: { fr: form.description, en: form.description },
        vintedUrl: form.vintedUrl,
        image: form.imageUrls.find(Boolean) || null,
        images: form.imageUrls.filter(Boolean),
        categories: form.categories.length > 0 ? form.categories : ['drops'],
        subcategory: form.subcategory || undefined,
        seasons: form.seasons.length > 0 ? form.seasons : undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
      });
      setForm(emptyForm);
      setEditingId(null);
    } else {
      const placeholder = PLACEHOLDERS[products.length % PLACEHOLDERS.length];
      addProduct({
        brand: form.brand || null,
        title: { fr: form.title, en: form.title },
        size: form.size,
        price: parseFloat(form.price),
        description: { fr: form.description, en: form.description },
        vintedUrl: form.vintedUrl,
        image: form.imageUrls.find(Boolean) || null,
        images: form.imageUrls.filter(Boolean),
        placeholder,
        categories: form.categories.length > 0 ? form.categories : ['drops'],
        subcategory: form.subcategory || undefined,
        seasons: form.seasons.length > 0 ? form.seasons : undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
      });
      setForm(emptyForm);
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!auth) {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginBox}>
          <h1 className={styles.loginTitle}>Mint Syrup</h1>
          <p className={styles.loginSub}>Admin</p>
          <input
            type="password"
            placeholder="Mot de passe"
            value={pwd}
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin</h1>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={handleExport}>⬇ Exporter</button>
          <label className={styles.btnSecondary} style={{ cursor: 'pointer' }}>
            ⬆ Importer
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <a href="/" className={styles.backLink}>← Retour au site</a>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{editingId !== null ? 'Modifier l\'article' : 'Ajouter un article'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Titre *</label>
              <input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Blouse vintage à fleurs" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Marque</label>
              <input className={styles.input} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Zara, H&M..." />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Taille</label>
              <input className={styles.input} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="Ex: M / 38 / 10" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Prix (€) *</label>
              <input className={styles.input} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Ex: 25" required />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Décris la pièce..." rows={3} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Lien Vinted *</label>
            <input className={styles.input} type="url" value={form.vintedUrl} onChange={(e) => setForm({ ...form, vintedUrl: e.target.value })} placeholder="https://www.vinted.fr/items/..." required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Photos (optionnel)</label>
            {form.imageUrls.map((url, i) => (
              <div key={i} className={styles.imageUrlRow}>
                <input
                  className={styles.input}
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const urls = [...form.imageUrls];
                    urls[i] = e.target.value;
                    setForm({ ...form, imageUrls: urls });
                  }}
                  placeholder={i === 0 ? 'https://... (photo principale)' : 'https://...'}
                />
                {form.imageUrls.length > 1 && (
                  <button type="button" className={styles.inlineCancel} onClick={() => setForm({ ...form, imageUrls: form.imageUrls.filter((_, j) => j !== i) })}>×</button>
                )}
              </div>
            ))}
            <button type="button" className={styles.inlineAddBtn} onClick={() => setForm({ ...form, imageUrls: [...form.imageUrls, ''] })}>+</button>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Catégories</label>
            <div className={styles.checkboxGrid}>
              {CATEGORIES.filter((cat) => cat.id !== 'drops' && cat.id !== 'ete').map((cat) => (
                <label key={cat.id} className={`${styles.checkLabel} ${form.categories.includes(cat.id) ? styles.checkActive : ''}`}>
                  <input type="checkbox" checked={form.categories.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className={styles.checkbox} />
                  {cat.fr}
                </label>
              ))}
            </div>
            {form.categories.length > 0 && (
              <div className={styles.inlineSubsWrap}>
                {form.categories.map((catId) => {
                  const cat = CATEGORIES.find((c) => c.id === catId)!;
                  const subs = subcategories.filter((s) => s.parentCategory === catId);
                  return (
                    <div key={catId} className={styles.inlineSubRow}>
                      <div className={styles.inlineSubTags}>
                        {subs.map((s) => (
                          <div key={s.id} className={`${styles.subTag} ${form.subcategory === s.id ? styles.subTagActive : ''}`} onClick={() => setForm({ ...form, subcategory: form.subcategory === s.id ? '' : s.id })}>
                            <span>{s.label}</span>
                            <button type="button" className={styles.subDelete} onClick={(e) => { e.stopPropagation(); deleteSubcategory(s.id); if (form.subcategory === s.id) setForm({ ...form, subcategory: '' }); }}>×</button>
                          </div>
                        ))}
                        {addingSubFor === catId ? (
                          <div className={styles.inlineSubInput}>
                            <input
                              autoFocus
                              className={styles.inlineInput}
                              value={newSubLabel}
                              onChange={(e) => setNewSubLabel(e.target.value)}
                              placeholder="Nom..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); if (newSubLabel.trim()) { addSubcategory({ label: newSubLabel.trim(), parentCategory: catId }); } setNewSubLabel(''); setAddingSubFor(null); }
                                if (e.key === 'Escape') { setNewSubLabel(''); setAddingSubFor(null); }
                              }}
                            />
                            <button type="button" className={styles.inlineConfirm} onClick={() => { if (newSubLabel.trim()) addSubcategory({ label: newSubLabel.trim(), parentCategory: catId }); setNewSubLabel(''); setAddingSubFor(null); }}>✓</button>
                            <button type="button" className={styles.inlineCancel} onClick={() => { setNewSubLabel(''); setAddingSubFor(null); }}>×</button>
                          </div>
                        ) : (
                          <button type="button" className={styles.inlineAddBtn} onClick={() => { setAddingSubFor(catId); setNewSubLabel(''); }}>+</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Saisons</label>
            <div className={styles.checkboxGrid}>
              {SEASONS.map((s) => (
                <label key={s.id} className={`${styles.checkLabel} ${form.seasons.includes(s.id) ? styles.checkActive : ''}`}>
                  <input type="checkbox" checked={form.seasons.includes(s.id)} onChange={() => toggleSeason(s.id)} className={styles.checkbox} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Étiquettes</label>
            <div className={styles.inlineSubsWrap}>
              <div className={styles.inlineSubTags}>
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={styles.colorTag}
                    style={{ background: tag.color, borderColor: form.tags.includes(tag.id) ? '#3A1808' : tag.color, boxShadow: form.tags.includes(tag.id) ? '2px 2px 0 #3A1808' : 'none' }}
                    onClick={() => setForm({ ...form, tags: form.tags.includes(tag.id) ? form.tags.filter((id) => id !== tag.id) : [...form.tags, tag.id] })}
                  >
                    <span className={styles.colorTagLabel}>{tag.label}</span>
                    <button type="button" className={styles.subDelete} onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); setForm({ ...form, tags: form.tags.filter((id) => id !== tag.id) }); }}>×</button>
                  </div>
                ))}
                {addingTag ? (
                  <div className={styles.colorTagForm}>
                    <input
                      autoFocus
                      className={styles.inlineInput}
                      value={newTagLabel}
                      onChange={(e) => setNewTagLabel(e.target.value)}
                      placeholder="Nom..."
                      style={{ width: '90px' }}
                      onKeyDown={(e) => { if (e.key === 'Escape') { setAddingTag(false); setNewTagLabel(''); } }}
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className={styles.colorPicker}
                    />
                    <button type="button" className={styles.inlineConfirm} onClick={() => { if (newTagLabel.trim()) addTag({ label: newTagLabel.trim(), color: newTagColor }); setNewTagLabel(''); setAddingTag(false); }}>✓</button>
                    <button type="button" className={styles.inlineCancel} onClick={() => { setAddingTag(false); setNewTagLabel(''); }}>×</button>
                  </div>
                ) : (
                  <button type="button" className={styles.inlineAddBtn} onClick={() => setAddingTag(true)}>+</button>
                )}
              </div>
            </div>
          </div>
          <div className={styles.formFooter}>
            {success && <span className={styles.successMsg}>{editingId !== null ? '✓ Article modifié !' : '✓ Article ajouté !'}</span>}
            {editingId !== null && (
              <button type="button" className={styles.btnSecondary} onClick={cancelEdit}>Annuler</button>
            )}
            <button type="submit" className={styles.btnPrimary}>{editingId !== null ? 'Enregistrer' : 'Ajouter l\'article'}</button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Articles en ligne ({products.length})</h2>
        {products.length === 0 ? (
          <p className={styles.empty}>Aucun article pour le moment.</p>
        ) : (
          <div className={styles.productList}>
            {products.map((p) => (
              <div key={p.id} className={styles.productRow}>
                <div className={styles.productThumb} style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }}>
                  {p.image && <Image src={p.image} alt={p.title.fr} fill style={{ objectFit: 'cover' }} />}
                </div>
                <div className={styles.productInfo}>
                  <p className={styles.productTitle}>{p.title.fr}</p>
                  {p.brand && <p className={styles.productMeta}>{p.brand}</p>}
                  <p className={styles.productMeta}>{p.size} — {p.price} €</p>
                  <div className={styles.productCats}>
                    {p.categories.map((c) => (
                      <span key={c} className={styles.catTag}>{c}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.productActions}>
                  <a href={p.vintedUrl} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>Voir sur Vinted</a>
                  <button className={styles.btnSecondary} onClick={() => startEdit(p)}>Modifier</button>
                  <button className={styles.btnDelete} onClick={() => deleteProduct(p.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
