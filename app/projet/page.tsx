import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import styles from './projet.module.css';

export default function ProjetPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.content}>
            <p>Écris ton texte ici.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
