'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import styles from './profil.module.css';

const FIELDS = [
  { key: 'esthetique',      label: 'Mon esthétique' },
  { key: 'couleur_preferee', label: 'Ma couleur préférée de tous les temps' },
  { key: 'couleur_moment',  label: 'Ma couleur du moment' },
  { key: 'obsession',       label: 'Mon obsession du moment' },
  { key: 'inspiration',     label: "Ma source d'inspiration n°1" },
  { key: 'decennies',       label: 'Mes décennies préférées' },
  { key: 'ville',           label: 'Ma ville' },
  { key: 'friperies',       label: 'Mes friperies préférées' },
] as const;

type FieldKey = typeof FIELDS[number]['key'];

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
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing]         = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newBio, setNewBio]           = useState('');
  const [fieldValues, setFieldValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [visibility, setVisibility]   = useState<Partial<Record<FieldKey, boolean>>>({});
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !profile)) router.replace('/');
  }, [loading, user, profile, router]);

  if (loading || !user || !profile) return null;

  const isVisible = (key: FieldKey) => (visibility[key] ?? profile.profile_visibility?.[key]) !== false;
  const toggleVisibility = (key: FieldKey) =>
    setVisibility(v => ({ ...v, [key]: !isVisible(key) }));

  const startEdit = () => {
    setNewUsername(profile.username ?? '');
    setNewBio(profile.bio ?? '');
    const vals: Partial<Record<FieldKey, string>> = {};
    for (const { key } of FIELDS) vals[key] = (profile as Record<string, unknown>)[key] as string ?? '';
    setFieldValues(vals);
    setVisibility({ ...(profile.profile_visibility ?? {}) } as Partial<Record<FieldKey, boolean>>);
    setEditing(true);
    setMsg(null);
  };

  const cancelEdit = () => { setEditing(false); setMsg(null); };

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {
      username: newUsername.trim() || profile.username,
      bio: newBio.trim() || null,
      profile_visibility: visibility,
    };
    for (const { key } of FIELDS) {
      updates[key] = (fieldValues[key] ?? '').trim() || null;
    }
    const { error } = await updateProfile(updates as Parameters<typeof updateProfile>[0]);
    setSaving(false);
    if (error) { setMsg(error); return; }
    setMsg('Profil mis à jour !');
    setEditing(false);
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

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <div className={styles.layout}>

          {/* ── Post-it ── */}
          <div className={styles.postitWrap}>
            <div className={styles.postit}>
              <img src="/postit-profil.png" alt="mon profil" className={styles.postitImg} />
            </div>
          </div>

          {/* ── Bloc infos ── */}
          <div className={styles.content}>

            <div className={styles.infoBlock}>
              {editing ? (
                <>
                  <input className={styles.input} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Nom d'utilisateur" autoFocus />
                  <p className={styles.email}>{user.email}</p>
                  <p className={styles.emailHint}>Pour changer l'email, contacte-moi directement.</p>
                </>
              ) : (
                <>
                  <p className={styles.username}>{profile.username}</p>
                  <p className={styles.email}>{user.email}</p>
                </>
              )}
            </div>

            <div className={styles.extraFields}>
              {FIELDS.map(({ key, label }) => {
                const profileVal = (profile as Record<string, unknown>)[key] as string | null | undefined;
                const vis = isVisible(key);
                return (
                  <div key={key} className={styles.extraField}>
                    <span className={styles.extraLabel}>{label}</span>
                    {editing ? (
                      <div className={styles.extraInputRow}>
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
                    ) : (
                      <span className={`${styles.extraValue} ${!vis ? styles.extraHidden : ''}`}>
                        {!vis ? <EyeOff /> : null}
                        {profileVal || <span className={styles.extraEmpty}>—</span>}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {msg && <p className={styles.msg}>{msg}</p>}

            {editing && (
              <div className={styles.editActions}>
                <button className={styles.btn} onClick={handleSave} disabled={saving}>
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
          </div>

        </div>

        {/* ── Bloc bio séparé ── */}
        <div className={styles.bioBlock}>
          <span className={styles.bioLabel}>Ma bio</span>
          {editing ? (
            <textarea
              className={styles.bioTextarea}
              value={newBio}
              onChange={e => setNewBio(e.target.value)}
              rows={4}
              placeholder="Raconte-toi…"
            />
          ) : (
            <p className={styles.bioText}>
              {profile.bio || <span className={styles.extraEmpty}>—</span>}
            </p>
          )}
        </div>

      </div>
      <Footer />
    </>
  );
}
