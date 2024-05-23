import { useScrollRestorationFix } from 'clo-ui';
import { useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { AppContext } from '../context/AppContextProvider';
import styles from './Layout.module.css';
import Footer from './navigation/Footer';
import Navbar from './navigation/Navbar';

const Layout = () => {
  const { ctx } = useContext(AppContext);
  const [invisibleFooter, setInvisibleFooter] = useState<boolean>(false);
  const isEmbed = ctx.isEmbed;

  useScrollRestorationFix();

  return (
    <div className="h-100 d-flex flex-column">
      <Navbar />
      <div className={`d-flex flex-column flex-grow-1 ${styles.wrapper}`}>
        <Outlet context={{ setInvisibleFooter }} />
      </div>
      {!isEmbed && <Footer invisibleFooter={invisibleFooter} />}
    </div>
  );
};

export default Layout;
