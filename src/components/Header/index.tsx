import Link from 'next/link';

import styles from './header.module.scss';

// Header for all the pages
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <img src="/logo.svg" alt="logo" className={styles.logo} />
        </Link>
      </div>
    </header>
  );
}
