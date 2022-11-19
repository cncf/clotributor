import classNames from 'classnames';
import React from 'react';

import styles from './Card.module.css';

export interface ICardProps {
  wrapperClassname?: string;
  children: JSX.Element;
  hoverable: boolean;
}

export const Card: React.FC<ICardProps> = (props: ICardProps) => {
  return (
    <div className={props.wrapperClassname} role="listitem">
      <div
        className={classNames('card rounded-0 p-0 h-100 mw-100 d-flex text-reset text-decoration-none card', {
          [styles.hoverable]: props.hoverable,
        })}
      >
        {props.children}
      </div>
    </div>
  );
};
