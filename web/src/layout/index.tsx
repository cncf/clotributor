import { useScrollRestorationFix } from 'clo-ui';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import styles from './Layout.module.css';
import Footer from './navigation/Footer';
import Navbar from './navigation/Navbar';

const Layout = () => {
  const [invisibleFooter, setInvisibleFooter] = useState<boolean>(false);

  useScrollRestorationFix();

  return (
    <div className="h-100 d-flex flex-column">
      <Navbar />
      <div className={`d-flex flex-column flex-grow-1 ${styles.wrapper}`}>
        <Outlet context={{ setInvisibleFooter }} />
      </div>
      <Footer invisibleFooter={invisibleFooter} />
    </div>
  );
};

export default Layout;
