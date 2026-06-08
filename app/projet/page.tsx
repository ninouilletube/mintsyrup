import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { getData } from '@/lib/supabase';
import styles from './projet.module.css';

export const revalidate = 60;

export default async function ProjetPage() {
  const [bio1, bio2, bio3, title1, title2, title3] = await Promise.all([
    getData('bio1') as Promise<string | null>,
    getData('bio2') as Promise<string | null>,
    getData('bio3') as Promise<string | null>,
    getData('bioTitle1') as Promise<string | null>,
    getData('bioTitle2') as Promise<string | null>,
    getData('bioTitle3') as Promise<string | null>,
  ]);

  const blocks = [
    { title: title1, text: bio1 },
    { title: title2, text: bio2 },
    { title: title3, text: bio3 },
  ].filter((b) => b.title || b.text);

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.layout}>
            <div className={styles.layoutTop}>
              <div className={styles.blocksTop}>
                {[blocks[0], blocks[1]].map((b, i) => b && (
                  <div key={i} className={`${styles.content} ${styles.blockSquare}`}>
                    {b.title && <h2 className={styles.blockTitle}>{b.title}</h2>}
                    {b.text && b.text.split('\n').filter(Boolean).map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>
              <div className={styles.photoWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/nina - copie.png" alt="Nina" className={styles.photo} />
              </div>
            </div>
            {blocks[2] && (
              <div className={`${styles.content} ${styles.blockFull}`}>
                {blocks[2].title && <h2 className={styles.blockTitle}>{blocks[2].title}</h2>}
                {blocks[2].text && blocks[2].text.split('\n').filter(Boolean).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
