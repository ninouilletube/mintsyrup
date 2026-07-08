'use client';

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductsContext';
import { supabase } from '@/lib/supabase';
import styles from './profil.module.css';

type FieldKey = 'pronoms' | 'age' | 'esthetique' | 'couleur_preferee' | 'couleur_moment' | 'obsession' | 'recherche' | 'inspiration' | 'decennies' | 'ville' | 'interets';

type FieldDef = { key: FieldKey; label: string; colorKey?: string } | { separator: true };

const FIELDS: FieldDef[] = [
  { key: 'pronoms',          label: 'Mes pronoms' },
  { key: 'age',              label: 'Mon âge' },
  { separator: true },
  { key: 'esthetique',       label: 'Mon esthétique' },
  { key: 'decennies',        label: 'Mes décennies préférées' },
  { key: 'inspiration',      label: "Ma source d'inspiration n°1" },
  { key: 'couleur_preferee', label: 'Ma couleur préférée de tous les temps', colorKey: 'couleur_preferee_hex' },
  { key: 'couleur_moment',   label: 'Ma couleur du moment', colorKey: 'couleur_moment_hex' },
  { separator: true },
  { key: 'obsession',        label: 'Mon obsession du moment' },
  { key: 'recherche',        label: 'Je recherche désespérément' },
  { separator: true },
  { key: 'ville',            label: 'Ma ville' },
  { key: 'interets',         label: 'Mes centres d\'intérêts' },
];

const EyeOpen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function ProfilPage() {
  const { user, profile, signOut, updateProfile, uploadAvatar, loading } = useAuth();
  const { products: allProducts } = useProducts();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const outfitRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing]           = useState(false);
  const [newUsername, setNewUsername]   = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [newEmail, setNewEmail]         = useState('');
  const [newBio, setNewBio]             = useState('');
  const [fieldValues, setFieldValues]   = useState<Partial<Record<FieldKey, string>>>({});
  const [colorValues, setColorValues]   = useState<Record<string, string>>({});
  const [visibility, setVisibility]     = useState<Partial<Record<FieldKey | 'friperies', boolean>>>({});
  const [newRencontres, setNewRencontres] = useState(false);
  const [fripesList, setFripesList]     = useState<Array<{nom: string; ville: string; maps: string}>>([{nom:'',ville:'',maps:''}]);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState<string | null>(null);

  // Collection
  const [collection, setCollection]         = useState<number[]>([]);
  const [takenByOthers, setTakenByOthers]   = useState<number[]>([]);
  const [archivesOpen, setArchivesOpen]     = useState(false);
  const [archiveSelected, setArchiveSelected] = useState<Set<number>>(new Set());
  const [savingCollection, setSavingCollection] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  // Outfits
  const [outfits, setOutfits]               = useState<Array<{id: string; image_url: string}>>([]);
  const [outfitUploading, setOutfitUploading] = useState(false);
  const [confirmOutfitRemove, setConfirmOutfitRemove] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !profile)) router.replace('/');
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (!editing || !user || !profile) return;
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile.username) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmed)
        .neq('id', user.id)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 450);
    return () => clearTimeout(timer);
  }, [newUsername, editing, user, profile]);

  useEffect(() => {
    if (!user) return;
    // Own collection
    supabase.from('user_collection').select('product_id').eq('user_id', user.id)
      .then(({ data }) => setCollection((data ?? []).map(r => r.product_id as number)));
    // Outfits
    supabase.from('user_outfits').select('id, image_url').eq('user_id', user.id).order('created_at')
      .then(({ data }) => setOutfits(data ?? []));

    // All claimed product_ids (to exclude from selection)
    supabase.from('user_collection').select('product_id, user_id')
      .then(({ data }) => {
        const others = (data ?? []).filter(r => r.user_id !== user.id).map(r => r.product_id as number);
        setTakenByOthers(others);
      });
  }, [user]);

  if (loading || !user || !profile) return null;

  const isVisible = (key: string) => (visibility[key as FieldKey] ?? profile.profile_visibility?.[key]) !== false;
  const toggleVisibility = (key: string) =>
    setVisibility(v => ({ ...v, [key]: !isVisible(key) }));

  const startEdit = () => {
    setNewUsername(profile.username ?? '');
    setNewEmail(user.email ?? '');
    setNewBio(profile.bio ?? '');
    setNewRencontres(profile.rencontres ?? false);
    const vals: Partial<Record<FieldKey, string>> = {};
    for (const f of FIELDS) {
      if ('separator' in f) continue;
      vals[f.key] = (profile as Record<string, unknown>)[f.key] as string ?? '';
    }
    setFieldValues(vals);
    setColorValues({
      couleur_preferee_hex: (profile as Record<string, unknown>).couleur_preferee_hex as string ?? '#000000',
      couleur_moment_hex:   (profile as Record<string, unknown>).couleur_moment_hex   as string ?? '#000000',
    });
    setVisibility({ ...(profile.profile_visibility ?? {}) } as Partial<Record<FieldKey | 'friperies', boolean>>);
    try {
      const parsed = JSON.parse(profile.friperies ?? '');
      setFripesList(Array.isArray(parsed) && parsed.length ? parsed : [{nom:'',ville:'',maps:''}]);
    } catch {
      setFripesList([{nom: profile.friperies ?? '', ville: '', maps: ''}]);
    }
    setEditing(true);
    setMsg(null);
  };

  const cancelEdit = () => { setEditing(false); setMsg(null); setUsernameStatus('idle'); };

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {
      username: newUsername.trim() || profile.username,
      bio: newBio.trim() || null,
      rencontres: newRencontres,
      profile_visibility: visibility,
      couleur_preferee_hex: colorValues.couleur_preferee_hex ?? null,
      couleur_moment_hex:   colorValues.couleur_moment_hex   ?? null,
      friperies: JSON.stringify(fripesList.filter(f => f.nom.trim())) || null,
    };
    for (const f of FIELDS) {
      if ('separator' in f) continue;
      updates[f.key] = (fieldValues[f.key] ?? '').trim() || null;
    }
    if (newEmail.trim() && newEmail.trim() !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (emailError) { setSaving(false); setMsg(emailError.message); return; }
    }
    const { error } = await updateProfile(updates as Parameters<typeof updateProfile>[0]);
    setSaving(false);
    if (error) { setMsg(error); return; }
    setMsg('Profil mis à jour !');
    setEditing(false);
    setUsernameStatus('idle');
    setTimeout(() => setMsg(null), 2500);
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const { error } = await uploadAvatar(file);
    setAvatarLoading(false);
    if (error) setMsg(error);
  };

  const handleOutfitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOutfitUploading(true);
    const ext = file.name.split('.').pop();
    const path = `outfits/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('mint-assets').upload(path, file);
    if (error) { setOutfitUploading(false); return; }
    const { data: urlData } = supabase.storage.from('mint-assets').getPublicUrl(path);
    const { data: row } = await supabase.from('user_outfits').insert({ user_id: user.id, image_url: urlData.publicUrl }).select('id, image_url').single();
    if (row) setOutfits(prev => [...prev, row]);
    setOutfitUploading(false);
    if (outfitRef.current) outfitRef.current.value = '';
  };

  const handleOutfitRemove = async (id: string, imageUrl: string) => {
    const path = imageUrl.split('/mint-assets/')[1];
    await supabase.storage.from('mint-assets').remove([path]);
    await supabase.from('user_outfits').delete().eq('id', id);
    setOutfits(prev => prev.filter(o => o.id !== id));
    setConfirmOutfitRemove(null);
  };

  const handleRemoveFromCollection = async (productId: number) => {
    await supabase.from('user_collection').delete().eq('user_id', user.id).eq('product_id', productId);
    setCollection(prev => prev.filter(id => id !== productId));
    setConfirmRemoveId(null);
  };

  const handleSaveArchives = async () => {
    setSavingCollection(true);
    const toAdd = [...archiveSelected].filter(id => !collection.includes(id));
    for (const product_id of toAdd) {
      await supabase.from('user_collection').upsert({ user_id: user.id, product_id, source: 'manual' }, { onConflict: 'user_id,product_id' });
    }
    setCollection(prev => [...new Set([...prev, ...toAdd])]);
    setSavingCollection(false);
    setArchivesOpen(false);
    setArchiveSelected(new Set());
  };

  let fripeItems: Array<{nom: string; ville: string; maps: string}> = [];
  try { fripeItems = JSON.parse(profile.friperies ?? ''); } catch { fripeItems = []; }
  if (!Array.isArray(fripeItems)) fripeItems = [];

  const archivedProducts = allProducts.filter(p => p.sold && !takenByOthers.includes(p.id));
  const collectionProducts = allProducts.filter(p => collection.includes(p.id));

  const archivesModal = archivesOpen ? createPortal(
    <div className={styles.archivesOverlay} onClick={() => setArchivesOpen(false)}>
      <div className={styles.archivesModal} onClick={e => e.stopPropagation()}>
        <div className={styles.archivesHeader}>
          <h2 className={styles.archivesTitle}>Les Archives</h2>
          <button className={styles.archivesClose} onClick={() => setArchivesOpen(false)}>×</button>
        </div>
        <p className={styles.archivesSub}>Sélectionne les pièces que tu as achetées (via Vinted ou ailleurs)</p>
        <div className={styles.archivesGrid}>
          {archivedProducts.map(p => {
            const sel = archiveSelected.has(p.id);
            const already = collection.includes(p.id);
            return (
              <div
                key={p.id}
                className={`${styles.archiveItem} ${sel ? styles.archiveItemSelected : ''} ${already ? styles.archiveItemAlready : ''}`}
                onClick={() => {
                  if (already) return;
                  setArchiveSelected(prev => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                    return next;
                  });
                }}
              >
                <div className={styles.archiveThumb}>
                  {p.image
                    ? <img src={p.image} alt={p.title.fr} className={styles.archiveImg} />
                    : <div className={styles.archivePlaceholder} style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }} />
                  }
                  {(sel || already) && (
                    <div className={styles.archiveCheck}>{already ? '✓' : '✓'}</div>
                  )}
                </div>
                <p className={styles.archiveItemTitle}>{p.title.fr}</p>
                {p.brand && <p className={styles.archiveItemBrand}>{p.brand}</p>}
              </div>
            );
          })}
        </div>
        <div className={styles.archivesFooter}>
          <button className={styles.archivesSave} onClick={handleSaveArchives} disabled={savingCollection || archiveSelected.size === 0}>
            {savingCollection ? 'Enregistrement…' : `Ajouter à ma collection (${archiveSelected.size})`}
          </button>
          <button className={styles.archivesCancel} onClick={() => { setArchivesOpen(false); setArchiveSelected(new Set()); }}>Annuler</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.pageRow}>

          {/* ── GAUCHE : post-it + bio ── */}
          <div className={styles.leftSide}>
            <div className={styles.postitWrap}>
              <div className={styles.postit}>
                <img src="/postit-profil.png" alt="mon profil" className={styles.postitImg} />
              </div>
            </div>

            <div className={styles.bioBlock}>
              <span className={styles.bioLabel}>Ma bio</span>
              {editing ? (
                <textarea
                  className={styles.bioTextarea}
                  value={newBio}
                  onChange={e => setNewBio(e.target.value)}
                  rows={5}
                  placeholder="Raconte-toi…"
                />
              ) : (
                <p className={styles.bioText}>
                  {profile.bio || <span className={styles.extraEmpty}>—</span>}
                </p>
              )}
            </div>
          </div>

          {/* ── DROITE : photo + bloc infos ── */}
          <div className={styles.rightSide}>

          {/* ── Photo ── */}
          <div className={styles.photoCol}>
            <div
              className={styles.photoWrap}
              onClick={() => editing && fileRef.current?.click()}
              style={{ cursor: editing ? 'pointer' : 'default' }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Photo de profil" className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  {profile.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              {editing && (
                <div className={styles.photoOverlay}>{avatarLoading ? '…' : '📷 Changer'}</div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />

            <Link href="/ma-wishlist" className={styles.wishlistArrow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fleche-droite.webp" alt="→" className={styles.wishlistArrowImg} />
              <span className={styles.wishlistArrowLabel}>Voir ma wishlist</span>
            </Link>
          </div>

          {/* ── Bloc infos ── */}
          <div className={styles.content}>

            <div className={styles.infoBlock}>
              {editing ? (
                <>
                  <div className={styles.usernameRow}>
                    <span className={styles.usernameLabel}>Nom d'utilisateur</span>
                    <input
                      className={`${styles.input} ${styles.usernameInput} ${usernameStatus === 'taken' ? styles.inputError : usernameStatus === 'available' ? styles.inputOk : ''}`}
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {usernameStatus === 'checking' && <p className={styles.usernameHint}>Vérification…</p>}
                  {usernameStatus === 'taken'    && <p className={styles.usernameError}>Ce nom est déjà pris</p>}
                  {usernameStatus === 'available' && <p className={styles.usernameOk}>Disponible ✓</p>}
                  <div className={styles.usernameRow}>
                    <span className={styles.usernameLabel}>Adresse mail</span>
                    <input
                      className={styles.input}
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.username}>{profile.username}</p>
                  <p className={styles.email}>{user.email}</p>
                </>
              )}
            </div>

            <div className={styles.extraFields}>

              {/* ── Champs texte standard ── */}
              {FIELDS.map((field, i) => {
                if ('separator' in field) return <div key={`sep-${i}`} className={styles.fieldSep} />;
                const { key, label, colorKey } = field;
                const profileVal = (profile as Record<string, unknown>)[key] as string | null | undefined;
                const profileColor = colorKey ? (profile as Record<string, unknown>)[colorKey] as string | null : null;
                const vis = isVisible(key);
                if (!editing && !vis) return null;
                return (
                  <div key={key} className={styles.extraField}>
                    <span className={styles.extraLabel}>{label}</span>
                    {editing ? (
                      <div className={styles.extraInputCol}>
                        <div className={styles.extraInputRow}>
                          {colorKey && (
                            <input
                              type="color"
                              className={styles.colorPicker}
                              value={colorValues[colorKey] ?? '#000000'}
                              onChange={e => setColorValues(v => ({ ...v, [colorKey]: e.target.value }))}
                            />
                          )}
                          <input
                            className={styles.extraInput}
                            value={fieldValues[key] ?? ''}
                            onChange={e => setFieldValues(v => ({ ...v, [key]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className={`${styles.eyeBtn} ${!vis ? styles.eyeBtnOff : ''}`}
                            onClick={() => toggleVisibility(key)}
                            title={vis ? 'Visible · cliquer pour masquer' : 'Masqué · cliquer pour rendre visible'}
                          >
                            {vis ? <EyeOpen /> : <EyeOff />}
                          </button>
                        </div>
                        {key === 'ville' && (
                          <label className={styles.checkLabel}>
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={newRencontres}
                              onChange={e => setNewRencontres(e.target.checked)}
                            />
                            <span>☕</span> Ouvert·e aux rencontres amicales
                          </label>
                        )}
                      </div>
                    ) : (
                      <span className={styles.extraValue} style={profileColor ? { color: profileColor } : undefined}>
                        {profileVal || <span className={styles.extraEmpty}>—</span>}
                        {key === 'ville' && profile.rencontres && (
                          <span className={styles.cafeTooltipWrap}>
                            <span className={styles.cafeIcon}>☕</span>
                            <span className={styles.cafeTooltip}>Ouverte aux rencontres amicales</span>
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* ── Friperies (multi) ── */}
              {(!editing && !isVisible('friperies')) ? null : (
                <div className={`${styles.extraField} ${styles.extraFieldTop}`}>
                  <span className={styles.extraLabel}>Mes friperies préférées</span>
                  {editing ? (
                    <div className={styles.fripesList}>
                      {fripesList.map((fripe, i) => (
                        <div key={i} className={styles.fripeEntry}>
                          <div className={styles.fripeRow}>
                            <input
                              className={styles.extraInput}
                              value={fripe.nom}
                              onChange={e => { const n=[...fripesList]; n[i]={...n[i],nom:e.target.value}; setFripesList(n); }}
                              placeholder="Nom"
                            />
                            {fripesList.length > 1 && (
                              <button type="button" className={styles.fripeRemove}
                                onClick={() => setFripesList(fripesList.filter((_,j)=>j!==i))}>×</button>
                            )}
                          </div>
                          <input
                            className={styles.extraInput}
                            value={fripe.ville}
                            onChange={e => { const n=[...fripesList]; n[i]={...n[i],ville:e.target.value}; setFripesList(n); }}
                            placeholder="Ville"
                          />
                          <input
                            className={styles.extraInput}
                            value={fripe.maps}
                            onChange={e => { const n=[...fripesList]; n[i]={...n[i],maps:e.target.value}; setFripesList(n); }}
                            placeholder="Lien Google Maps"
                          />
                        </div>
                      ))}
                      <div className={styles.fripeFooter}>
                        <button type="button" className={styles.fripeAdd}
                          onClick={() => setFripesList([...fripesList, {nom:'',ville:'',maps:''}])}>+ Ajouter</button>
                        <button type="button"
                          className={`${styles.eyeBtn} ${!isVisible('friperies') ? styles.eyeBtnOff : ''}`}
                          onClick={() => toggleVisibility('friperies')}>
                          {isVisible('friperies') ? <EyeOpen /> : <EyeOff />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.fripeViewList}>
                      {fripeItems.length ? fripeItems.map((f, i) => (
                        <div key={i} className={styles.fripeViewItem}>
                          {f.maps
                            ? <a href={f.maps} target="_blank" rel="noopener noreferrer" className={styles.fripeLink}>{f.nom}</a>
                            : <span className={styles.fripeViewNom}>{f.nom}</span>
                          }
                          {f.ville && <span className={styles.fripeViewVille}>{f.ville}</span>}
                        </div>
                      )) : <span className={styles.extraEmpty}>—</span>}
                    </div>
                  )}
                </div>
              )}

            </div>

            {msg && <p className={styles.msg}>{msg}</p>}

            {editing && (
              <div className={styles.editActions}>
                <button className={styles.btn} onClick={handleSave} disabled={saving || usernameStatus === 'taken' || usernameStatus === 'checking'}>
                  {saving ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button className={styles.cancelBtn} onClick={cancelEdit}>Annuler</button>
              </div>
            )}

            <hr className={styles.divider} />

            <div className={styles.bottomRow}>
              {!editing && (
                <button className={styles.editBtn} onClick={startEdit}>Modifier le profil</button>
              )}
              <div className={styles.bottomRight}>
                <button className={styles.signOutBtn} onClick={async () => { await signOut(); router.replace('/'); }}>
                  Déconnexion
                </button>
                <button className={styles.deleteBtn} onClick={async () => {
                  if (!confirm('Supprimer définitivement ton compte ? Cette action est irréversible.')) return;
                  await fetch('/api/delete-account', { method: 'DELETE' });
                  await signOut();
                  router.replace('/');
                }}>
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>

          </div>{/* fin rightSide */}

        </div>{/* fin pageRow */}

        {/* ── Ma collection ── */}
        <div className={styles.collectionSection}>
          <h2 className={styles.collectionTitle}>Ma collection Mint Syrup</h2>

          {collectionProducts.length === 0 ? (
            <p className={styles.collectionEmpty}>
              Il n&apos;y a rien pour le moment. Passe commande maintenant ou ajoute un article depuis les{' '}
              <button className={styles.archivesLink} onClick={() => setArchivesOpen(true)}>
                archives
              </button>
              !
            </p>
          ) : (
            <>
              <div className={styles.collectionGrid}>
                {collectionProducts.map(p => (
                  <div key={p.id} className={styles.collectionCard}>
                    <div className={styles.collectionThumb}>
                      {p.image
                        ? <img src={p.image} alt={p.title.fr} className={styles.collectionImg} />
                        : <div className={styles.collectionPlaceholder} style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }} />
                      }
                      <button
                        className={styles.collectionRemoveBtn}
                        onClick={() => setConfirmRemoveId(p.id)}
                        title="Retirer de ma collection"
                      >×</button>
                    </div>
                    <p className={styles.collectionCardTitle}>{p.title.fr}</p>
                    {p.brand && <p className={styles.collectionCardBrand}>{p.brand}</p>}

                    {confirmRemoveId === p.id && (
                      <div className={styles.confirmDialog}>
                        <p className={styles.confirmText}>Retirer cet article de ta collection ?</p>
                        <div className={styles.confirmActions}>
                          <button className={styles.confirmYes} onClick={() => handleRemoveFromCollection(p.id)}>Oui, retirer</button>
                          <button className={styles.confirmNo} onClick={() => setConfirmRemoveId(null)}>Annuler</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button className={styles.addToCollectionBtn} onClick={() => setArchivesOpen(true)}>
                + Ajouter une pièce
              </button>
            </>
          )}
        </div>

        {/* ── Mes outfits ── */}
        <div className={styles.outfitsSection}>
          <div className={styles.outfitsHeader}>
            <h2 className={styles.collectionTitle}>Mes outfits</h2>
            <button className={styles.addToCollectionBtn} onClick={() => outfitRef.current?.click()} disabled={outfitUploading}>
              {outfitUploading ? 'Upload…' : '+ Ajouter une tenue'}
            </button>
          </div>
          <input ref={outfitRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleOutfitUpload} />

          {outfits.length === 0 && !outfitUploading ? (
            <p className={styles.collectionEmpty}>
              Ici, tu peux partager tes tenues préférées avec tes pièces Mint Syrup 🌿
            </p>
          ) : (
            <div className={styles.outfitsGrid}>
              {outfits.map((o, i) => (
                <div key={o.id} className={`${styles.outfitPolaroid} ${styles[`polaroidRot${i % 4}`]}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.image_url} alt="outfit" className={styles.outfitImg} />
                  <button
                    className={styles.outfitRemoveBtn}
                    onClick={() => setConfirmOutfitRemove(o.id)}
                    title="Supprimer cette photo"
                  >×</button>
                  {confirmOutfitRemove === o.id && (
                    <div className={styles.confirmDialog}>
                      <p className={styles.confirmText}>Supprimer cette photo ?</p>
                      <div className={styles.confirmActions}>
                        <button className={styles.confirmYes} onClick={() => handleOutfitRemove(o.id, o.image_url)}>Oui</button>
                        <button className={styles.confirmNo} onClick={() => setConfirmOutfitRemove(null)}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {outfitUploading && (
                <div className={`${styles.outfitPolaroid} ${styles.outfitPolaroidLoading}`}>
                  <div className={styles.outfitImgPlaceholder}>…</div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
      <Footer />
      {archivesModal}
    </>
  );
}
