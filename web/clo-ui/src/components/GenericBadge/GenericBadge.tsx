import React from 'react';

import styles from './GenericBadge.module.css';

export interface IGenericBadgeProps {
  content: string;
  className?: string;
}

export const GenericBadge: React.FC<IGenericBadgeProps> = (props: IGenericBadgeProps) => {
  return (
    <div
      className={`badge border text-dark fw-normal lighterText rounded-0 position-relative ${styles.outlineBadge} ${props.className}`}
    >
      {props.content}
    </div>
  );
};
