import React from 'react';

import styles from './Footer.module.css';

export interface IFooterProps {
  logo: JSX.Element;
  children: JSX.Element;
  className?: string;
}

export const Footer: React.FC<IFooterProps> = (props: IFooterProps) => {
  return (
    <footer className={`py-5 ${styles.footer} ${props.className}`}>
      <div className="container-lg">
        <div className="d-flex flex-row flex-wrap align-items-stretch justify-content-between text-light">
          {props.children}

          <div className={`ms-0 ms-lg-auto ${styles.fullMobileSection}`}>{props.logo}</div>
        </div>
      </div>
    </footer>
  );
};
