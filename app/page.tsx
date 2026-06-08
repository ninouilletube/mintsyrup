import Nav from '@/components/Nav';
import VideoHero from '@/components/VideoHero';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <div className={styles.heroWrap}>
          <VideoHero />
          <ProductGrid />
        </div>
        <Footer />
      </main>
    </>
  );
}
