'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Nav from '@/components/Nav';
import styles from './reset-password.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase redirects with #access_token in the hash — the client picks it up automatically
  }, []);

  const handle = async () => {
    if (!password || password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.replace('/'), 2000);
  };

  return (
    <>
      <Nav />
      <main className={styles.page}>
        <div className={styles.box}>
          <h1 className={styles.title}>Nouveau mot de passe</h1>
          {done ? (
            <p className={styles.success}>Mot de passe mis à jour ! Redirection…</p>
          ) : (
            <>
              <input
                className={styles.input}
                type="password"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <input
                className={styles.input}
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handle(); }}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.btn} onClick={handle} disabled={loading}>
                {loading ? '…' : 'Enregistrer'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
