'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './AuthModal.module.css';

type Props = { onClose: () => void };
type Mode = 'login' | 'signup';

export default function AuthModal({ onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && !username.trim()) return;
    setLoading(true);
    const result = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, username.trim());
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (mode === 'signup') { setDone(true); return; }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>×</button>

        {done ? (
          <>
            <h2 className={styles.title}>Vérifie ta boîte mail ✉️</h2>
            <p className={styles.sub}>Un lien de confirmation t&apos;a été envoyé. Reviens ici une fois validé pour te connecter.</p>
            <button className={styles.btn} onClick={() => { setDone(false); setMode('login'); }}>Se connecter</button>
          </>
        ) : (
          <>
            <h2 className={styles.title}>{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>

            {mode === 'signup' && (
              <input
                className={styles.input}
                placeholder="Pseudo (visible sur ta liste)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            )}
            <input
              className={styles.input}
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus={mode === 'login'}
              onKeyDown={e => { if (e.key === 'Enter') handle(); }}
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handle(); }}
            />

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.btn} onClick={handle} disabled={loading}>
              {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>

            <button className={styles.switchMode} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}>
              {mode === 'login' ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
