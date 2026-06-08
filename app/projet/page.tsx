import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { getData } from '@/lib/supabase';
import styles from './projet.module.css';

export const revalidate = 60;

export default async function ProjetPage() {
  const bio = (await getData('bio') as string | null) ?? '';

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.layout}>
            <div className={styles.photoWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nina - copie.png" alt="Nina" className={styles.photo} />
            </div>
            <div className={styles.content}>
              {bio ? (
                bio.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))
              ) : (
                <p style={{ color: 'var(--light)', fontStyle: 'italic' }}>Aucun texte pour l&apos;instant.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
