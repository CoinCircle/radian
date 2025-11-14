import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className={styles.logoContainer}>
          <img src="/img/logo.svg" alt="Radian Protocol" className={styles.logo} />
        </div>
        {/* <h1 className="hero__title">{siteConfig.title}</h1> */}
        {/* <p className="hero__subtitle">{siteConfig.tagline}</p> */}
        <p className="hero__subtitle">Radical Autonomous Decentralized <br></br></p>
        
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/overview">
            Read the Docs →
          </Link>
        </div>
      </div>
    </header>
  );
}
 
export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Radian Protocol - Radical Autonomous Decentralized Finance Infrastructure">
      <HomepageHeader />
    </Layout>
  );
}