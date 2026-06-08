import { Suspense } from 'react';
import Nav from '@/components/Nav';
import VideoHero from '@/components/VideoHero';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import CategoryInit from '@/components/CategoryInit';
import PageBackground from '@/components/PageBackground';
import DropsArrow from '@/components/DropsArrow';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Nav />
      <PageBackground>
        <main>
          <div className={styles.heroWrap}>
            <VideoHero />
            <ProductGrid />
          </div>
          <Footer />
        </main>
      </PageBackground>
      <DropsArrow />
      <Suspense><CategoryInit /></Suspense>
    </>
  );
}
