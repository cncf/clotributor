import React from 'react';

import styles from './DotsLoading.module.css';

export interface IDotsLoadingProps {
  className?: string;
}

export const DotsLoading: React.FC<IDotsLoadingProps> = (props: IDotsLoadingProps) => {
  return (
    <div className={`d-flex flex-row ${props.className}`} role="status">
      <div className={`${styles.dot} ${styles.dot1} dot`} />
      <div className={`${styles.dot} ${styles.dot2} dot`} />
      <div className={`${styles.dot} ${styles.dot3} dot`} />
    </div>
  );
};
