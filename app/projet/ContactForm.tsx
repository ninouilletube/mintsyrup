'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSend = async () => {
    if (!email.trim() || !message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setStatus('sent');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <section className={styles.wrap}>
        <h2 className={styles.title}>Me contacter</h2>
        <p className={styles.confirm}>
          Message envoyé ! Je vous répondrai dès que possible.
        </p>
        <button className={styles.btnSecondary} onClick={() => setStatus('idle')}>
          Envoyer un autre message
        </button>
      </section>
    );
  }

  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>Me contacter</h2>
      <input
        type="email"
        className={styles.input}
        placeholder="Votre adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'sending'}
      />
      <textarea
        className={styles.textarea}
        placeholder="Une question, une suggestion, un mot d'amour ? Je vous réponds au plus vite."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        disabled={status === 'sending'}
      />
      {status === 'error' && (
        <p className={styles.errorMsg}>
          Une erreur s&apos;est produite, réessayez ou écrivez directement à{' '}
          <a href="mailto:chatchep@gmail.com">chatchep@gmail.com</a>.
        </p>
      )}
      <div className={styles.footer}>
        <a href="mailto:chatchep@gmail.com" className={styles.emailLink}>chatchep@gmail.com</a>
        <button
          className={styles.btn}
          onClick={handleSend}
          disabled={!email.trim() || !message.trim() || status === 'sending'}
        >
          {status === 'sending' ? 'Envoi…' : 'Envoyer →'}
        </button>
      </div>
    </section>
  );
}
