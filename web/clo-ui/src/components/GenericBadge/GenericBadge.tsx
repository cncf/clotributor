import { isUndefined } from 'lodash';
import React from 'react';

import styles from './GenericBadge.module.css';

export interface IGenericBadgeProps {
  content: string;
  className?: string;
  onClick?: () => void;
}

export const GenericBadge: React.FC<IGenericBadgeProps> = (props: IGenericBadgeProps) => {
  return (
    <>
      {isUndefined(props.onClick) ? (
        <div className={`badge fw-normal rounded-0 position-relative ${styles.outlineBadge} ${props.className}`}>
          {props.content}
        </div>
      ) : (
        <button
          type="button"
          className={`btn btn-sm badge fw-normal rounded-0 position-relative clickable ${styles.outlineBadge} ${styles.clickable} ${props.className}`}
          onClick={props.onClick}
        >
          {props.content}
        </button>
      )}
    </>
  );
};
