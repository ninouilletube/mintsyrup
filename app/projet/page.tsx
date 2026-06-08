import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Image from 'next/image';
import styles from './projet.module.css';

export default function ProjetPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.layout}>
            <div className={styles.photoWrap}>
              <Image
                src="/nina.jpeg"
                alt="Nina"
                fill
                className={styles.photo}
                sizes="(max-width: 768px) 100vw, 45vw"
              />
              <div className={styles.grain} />
            </div>
            <div className={styles.content}>
              <p>Écris ton texte ici.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
