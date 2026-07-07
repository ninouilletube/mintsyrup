'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import styles from './profil.module.css';

export default function ProfilPage() {
  const { user, profile, signOut, updateProfile, uploadAvatar, loading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing]             = useState(false);
  const [newUsername, setNewUsername]     = useState('');
  const [newEsthetique, setNewEsthetique] = useState('');
  const [newCouleur, setNewCouleur]       = useState('');
  const [newInspiration, setNewInspiration] = useState('');
  const [newVille, setNewVille]           = useState('');
  const [newFriperies, setNewFriperies]   = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saving, setSaving]               = useState(false);
  const [msg, setMsg]                     = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !profile)) router.replace('/');
  }, [loading, user, profile, router]);

  if (loading || !user || !profile) return null;

  const startEdit = () => {
    setNewUsername(profile.username ?? '');
    setNewEsthetique(profile.esthetique ?? '');
    setNewCouleur(profile.couleur_preferee ?? '');
    setNewInspiration(profile.inspiration ?? '');
    setNewVille(profile.ville ?? '');
    setNewFriperies(profile.friperies ?? '');
    setEditing(true);
    setMsg(null);
  };

  const cancelEdit = () => { setEditing(false); setMsg(null); };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      username: newUsername.trim() || profile.username,
      esthetique: newEsthetique.trim() || null,
      couleur_preferee: newCouleur.trim() || null,
      inspiration: newInspiration.trim() || null,
      ville: newVille.trim() || null,
      friperies: newFriperies.trim() || null,
    });
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

          {/* ── Post-it à gauche du bloc ── */}
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
              {([
                { label: 'Mon esthétique', key: 'esthetique', val: profile.esthetique, set: setNewEsthetique, state: newEsthetique },
                { label: 'Ma couleur préférée', key: 'couleur', val: profile.couleur_preferee, set: setNewCouleur, state: newCouleur },
                { label: "Ma source d'inspiration n°1", key: 'inspiration', val: profile.inspiration, set: setNewInspiration, state: newInspiration },
                { label: 'Ma ville', key: 'ville', val: profile.ville, set: setNewVille, state: newVille },
                { label: 'Mes friperies préférées', key: 'friperies', val: profile.friperies, set: setNewFriperies, state: newFriperies },
              ] as const).map(({ label, key, val, set, state }) => (
                <div key={key} className={styles.extraField}>
                  <span className={styles.extraLabel}>{label}</span>
                  {editing
                    ? <input className={styles.extraInput} value={state} onChange={e => set(e.target.value)} placeholder="…" />
                    : <span className={styles.extraValue}>{val || <span className={styles.extraEmpty}>—</span>}</span>
                  }
                </div>
              ))}
            </div>

            {msg && <p className={styles.msg}>{msg}</p>}

            {editing ? (
              <div className={styles.editActions}>
                <button className={styles.btn} onClick={handleSave} disabled={saving}>
                  {saving ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button className={styles.cancelBtn} onClick={cancelEdit}>Annuler</button>
              </div>
            ) : null}

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

          {/* ── Colonne droite : photo avec scotch ── */}
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
      </div>
      <Footer />
    </>
  );
}
