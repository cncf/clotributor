import classNames from 'classnames';
import { ExternalLink, Navbar as NavbarWrapper } from 'clo-ui';
import { FaGithub } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

import logo from '../../media/clotributor.svg';
import scrollToTop from '../../utils/scrollToTop';
import MobileSettings from './MobileSettings';
import styles from './Navbar.module.css';
import Searchbar from './Searchbar';
import Settings from './Settings';

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <NavbarWrapper navbarClassname={classNames(styles.navbar, { [styles.navInHome]: isHome })}>
      <>
        <div className={`me-0 me-md-4 mt-2 mt-md-0 ${styles.line}`}>
          <div className="d-flex flex-row align-items-start">
            <div className="position-relative">
              <Link to="/" onClick={scrollToTop} className="cursorPointer">
                <img className={styles.logo} alt="CLOTributor logo" src={logo} />
              </Link>
              <div className={`position-relative badge rounded-0 text-uppercase fw-bold me-3 ms-2 ${styles.alpha}`}>
                Alpha
              </div>
            </div>

            <MobileSettings />
          </div>
        </div>

        {!isHome && <Searchbar bigSize={false} classNameWrapper={`my-3 ${styles.line}`} inNavbar />}

        <div className="d-none d-md-flex flex-row align-items-center ms-auto">
          <ExternalLink
            className="btn btn-md text-light fs-5"
            label="Github link"
            href="https://github.com/cncf/clotributor"
          >
            <FaGithub />
          </ExternalLink>
          <Settings />
        </div>
      </>
    </NavbarWrapper>
  );
};

export default Navbar;
