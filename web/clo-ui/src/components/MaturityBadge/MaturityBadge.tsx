import React from 'react';
import { GiStairsGoal } from 'react-icons/gi';

import styles from './MaturityBadge.module.css';

export enum Maturity {
  graduated = 'graduated',
  incubating = 'incubating',
  sandbox = 'sandbox',
}

export interface IMaturityBadgeProps {
  maturityLevel: Maturity;
  className?: string;
}

export const MaturityBadge: React.FC<IMaturityBadgeProps> = (props: IMaturityBadgeProps) => {
  return (
    <div
      data-testid="maturity-badge"
      className={`badge text-dark lighterText rounded-0 position-relative ${styles.badge} ${props.className}`}
    >
      <div className="d-flex flex-row align-items-center text-capitalize">
        <GiStairsGoal className="me-1 me-xl-2" />
        {Maturity[props.maturityLevel]}
      </div>
    </div>
  );
};
