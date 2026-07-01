'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const subject = encodeURIComponent('Message depuis Mint Syrup');
    const body = encodeURIComponent(`De : ${email}\n\n${message}`);
    window.location.href = `mailto:chatchep@gmail.com?subject=${subject}&body=${body}`;
  };

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
