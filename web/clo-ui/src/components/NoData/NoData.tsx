import React from 'react';

import styles from './NoData.module.css';

export interface INoDataProps {
  children: string | JSX.Element | JSX.Element[];
  className?: string;
}

export const NoData: React.FC<INoDataProps> = (props: INoDataProps) => (
  <div
    role="alert"
    className={`alert ms-auto me-auto rounded-0 my-3 my-md-5 text-center p-4 p-sm-5 border border-primary ${styles.wrapper} ${props.className}`}
  >
    <div className={`h4 ${styles.content}`}>{props.children}</div>
  </div>
);
