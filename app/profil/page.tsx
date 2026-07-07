'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import styles from './profil.module.css';

export default function ProfilPage() {
  const { user, profile, signOut, updateProfile, uploadAvatar, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading) return null;
  if (!user || !profile) {
    router.replace('/');
    return null;
  }

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    const { error } = await updateProfile({ username: username.trim() });
    setSaving(false);
    setMsg(error ?? 'Pseudo mis à jour !');
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
        <div className={styles.card}>
          <h1 className={styles.title}>Mon profil</h1>

          {/* Avatar */}
          <div className={styles.avatarWrap} onClick={() => fileRef.current?.click()}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
              : <div className={styles.avatarPlaceholder}>{profile.username?.[0]?.toUpperCase() ?? '?'}</div>
            }
            <div className={styles.avatarOverlay}>{avatarLoading ? '…' : '📷'}</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
          </div>

          <p className={styles.email}>{user.email}</p>

          {/* Pseudo */}
          <label className={styles.label}>Pseudo</label>
          <input
            className={styles.input}
            defaultValue={profile.username}
            onChange={e => setUsername(e.target.value)}
            placeholder={profile.username}
          />
          <button className={styles.btn} onClick={handleSave} disabled={saving || !username.trim()}>
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>

          {msg && <p className={styles.msg}>{msg}</p>}

          <hr className={styles.divider} />

          <button className={styles.signOutBtn} onClick={async () => { await signOut(); router.replace('/'); }}>
            Se déconnecter
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
