import { Dispatch, SetStateAction, useState } from 'react';
import { Outlet } from 'react-router-dom';

import styles from './Layout.module.css';
import Footer from './navigation/Footer';
import Navbar from './navigation/Navbar';

interface Props {
  setScrollPosition: Dispatch<SetStateAction<number | undefined>>;
}

const Layout = (props: Props) => {
  const [invisibleFooter, setInvisibleFooter] = useState<boolean>(false);

  return (
    <div className="h-100 d-flex flex-column">
      <Navbar setScrollPosition={props.setScrollPosition} />
      <div className={`d-flex flex-column flex-grow-1 ${styles.wrapper}`}>
        <Outlet context={{ setInvisibleFooter }} />
      </div>
      <Footer invisibleFooter={invisibleFooter} />
    </div>
  );
};

export default Layout;
