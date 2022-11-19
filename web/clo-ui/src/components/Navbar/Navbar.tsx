import React from 'react';

import styles from './Navbar.module.css';

export interface INavbarProps {
  navbarClassname?: string;
  children: JSX.Element;
}

export const Navbar: React.FC<INavbarProps> = (props: INavbarProps) => {
  return (
    <nav className={`navbar ${styles.navbar} ${props.navbarClassname}`}>
      <div className="container-lg">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between w-100">
          {props.children}
        </div>
      </div>
    </nav>
  );
};
