'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const subject = encodeURIComponent('Message depuis Mint Syrup');
    const body = encodeURIComponent(`De : ${email}\n\n${message}`);
    window.open(
      `https://mail.google.com/mail/?view=cm&to=chatchep@gmail.com&su=${subject}&body=${body}`,
      '_blank'
    );
    setSent(true);
  };

  if (sent) {
    return (
      <section className={styles.wrap}>
        <h2 className={styles.title}>Me contacter</h2>
        <p className={styles.confirm}>
          Gmail s&apos;est ouvert avec votre message pré-rempli — il ne reste plus qu&apos;à cliquer <strong>Envoyer</strong> dans Gmail !
        </p>
        <button className={styles.btnSecondary} onClick={() => setSent(false)}>
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
      />
      <textarea
        className={styles.textarea}
        placeholder="Une question, une suggestion, un mot d'amour ? Je vous réponds au plus vite."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
      />
      <div className={styles.footer}>
        <a href="mailto:chatchep@gmail.com" className={styles.emailLink}>chatchep@gmail.com</a>
        <button
          className={styles.btn}
          onClick={handleSend}
          disabled={!email.trim() || !message.trim()}
        >
          Envoyer →
        </button>
      </div>
    </section>
  );
}
