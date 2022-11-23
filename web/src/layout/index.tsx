import { Dispatch, SetStateAction } from 'react';
import { Outlet } from 'react-router-dom';

import styles from './Layout.module.css';
import Footer from './navigation/Footer';
import Navbar from './navigation/Navbar';

interface Props {
  setScrollPosition: Dispatch<SetStateAction<number | undefined>>;
}

const Layout = (props: Props) => {
  return (
    <div className="h-100 d-flex flex-column">
      <Navbar setScrollPosition={props.setScrollPosition} />
      <div className={`d-flex flex-column flex-grow-1 ${styles.wrapper}`}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
