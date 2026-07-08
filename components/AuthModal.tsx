'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [showPassword, setShowPassword] = useState(false);

  const handle = async () => {
    setError(null);
    if (!username.trim() || !password.trim()) return;
    if (mode === 'signup' && !email.trim()) return;
    setLoading(true);
    const result = mode === 'login'
      ? await signIn(username.trim(), password)
      : await signUp(email.trim(), password, username.trim());
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (mode === 'signup' && !(result as { error: string | null; confirmed?: boolean }).confirmed) { setDone(true); return; }
    onClose();
  };

  const modal = (
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

            <input
              className={styles.input}
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handle(); }}
            />
            {mode === 'signup' && (
              <input
                className={styles.input}
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handle(); }}
              />
            )}
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handle(); }}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

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

  return createPortal(modal, document.body);
}
