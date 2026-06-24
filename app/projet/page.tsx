import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import PageArrow from '@/components/PageArrow';
import RetourArrow from '@/components/RetourArrow';
import ScrollToTop from '@/components/ScrollToTop';
import ArchivesSection from '@/components/ArchivesSection';
import { getData } from '@/lib/supabase';
import styles from './projet.module.css';
import ProjetAccordion from './ProjetAccordion';

export const revalidate = 60;

export default async function ProjetPage() {
  const [bio1, bio2, bio3, title1, title2, title3, tooltip3] = await Promise.all([
    getData('bio1') as Promise<string | null>,
    getData('bio2') as Promise<string | null>,
    getData('bio3') as Promise<string | null>,
    getData('bioTitle1') as Promise<string | null>,
    getData('bioTitle2') as Promise<string | null>,
    getData('bioTitle3') as Promise<string | null>,
    getData('bio3Tooltip') as Promise<string | null>,
  ]);

  const blocks = [
    { title: title1, text: bio1 },
    { title: title2, text: bio2 },
    { title: title3, text: bio3 },
  ].filter((b) => b.title || b.text);

  return (
    <>
      <ScrollToTop />
      <Nav />
      <span className={styles.mobileHidden}><PageArrow href="/favoris" label="Mes favoris" direction="left" /></span>
      <span className={styles.mobileHidden}><RetourArrow direction="right" /></span>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.layout}>
            {/* Badge mobile uniquement */}
            <div className={styles.mobilePageHeader}>
              <span className={styles.mobilePageBadge}>Le projet</span>
            </div>

            <div className={styles.layoutTop}>
              <div className={styles.blocksTop}>

                {/* ── Groupe A : texte 1 (desktop flex + mobile grid col-1 row-1) ── */}
                {blocks[0] && (
                  <div className={`${styles.blockNaked} ${styles.mobileBlock0}`}>
                    {blocks[0].title && <h2 className={styles.blockTitle}>{blocks[0].title}</h2>}
                    {blocks[0].text && blocks[0].text.split('\n').filter(Boolean).map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                    {/* Logo desktop uniquement — masqué sur mobile */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon.webp" alt="Mint Syrup" className={`${styles.projetLogo} ${styles.desktopOnly}`} />
                  </div>
                )}

                {/* ── Texte 2 desktop uniquement (masqué sur mobile) ── */}
                {blocks[1] && (
                  <div className={`${styles.blockNaked} ${styles.blockNakedNarrow} ${styles.mobileBlock1}`}>
                    {blocks[1].title && <h2 className={styles.blockTitle}>{blocks[1].title}</h2>}
                    {blocks[1].text && blocks[1].text.split('\n').filter(Boolean).map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                )}

                {/* ── Groupe B mobile : logo + texte 2, pleine largeur row-2 ── */}
                {/* Avec display:contents sur blocksTop, ce div devient enfant direct du grid layoutTop */}
                <div className={styles.mobileLogoRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.webp" alt="Mint Syrup" className={styles.projetLogo} />
                  {blocks[1] && (
                    <div className={styles.mobileBlock1Inner}>
                      {blocks[1].title && <h2 className={styles.blockTitle}>{blocks[1].title}</h2>}
                      {blocks[1].text && blocks[1].text.split('\n').filter(Boolean).map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <div className={styles.photoWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/nina - copie.webp" alt="Nina" className={styles.photo} />
              </div>
            </div>

            {blocks[2] && (
              <>
                {/* Desktop : carte pleine */}
                <div className={`${styles.content} ${styles.blockFull} ${styles.desktopBlock2}`}>
                  {tooltip3 && (
                    <div className={styles.infoWrap}>
                      <span className={styles.infoIcon}>i</span>
                      <div className={styles.infoTooltip}>
                        <div className={styles.infoTooltipInner}>
                          <span>{tooltip3}</span>
                          <a
                            href="https://www.vinted.fr/member/3125590380"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.infoLink}
                          >Voir mon profil Vinted ↗</a>
                        </div>
                      </div>
                    </div>
                  )}
                  {blocks[2].title && <h2 className={styles.blockTitle}>{blocks[2].title}</h2>}
                  {blocks[2].text && blocks[2].text.split('\n').filter(Boolean).map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
                {/* Mobile : accordéon repliable */}
                <ProjetAccordion title={blocks[2].title} text={blocks[2].text} tooltip3={tooltip3} />
              </>
            )}
          </div>

          <ArchivesSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
