import { isUndefined } from 'lodash';
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
  onClick?: () => void;
}

export const MaturityBadge: React.FC<IMaturityBadgeProps> = (props: IMaturityBadgeProps) => {
  const levelData = Maturity[props.maturityLevel];

  return (
    <>
      {isUndefined(props.onClick) ? (
        <div
          data-testid="maturity-badge"
          className={`badge text-dark lighterText rounded-0 position-relative ${styles.badge} ${props.className}`}
        >
          <div className="d-flex flex-row align-items-center text-capitalize">
            <GiStairsGoal className="me-1 me-xl-2" />
            {levelData}
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-testid="maturity-badge"
          className={`badge text-dark lighterText rounded-0 position-relative ${styles.badge} ${props.className}`}
          onClick={props.onClick}
        >
          <div className="d-flex flex-row align-items-center text-capitalize">
            <GiStairsGoal className="me-1 me-xl-2" />
            {levelData}
          </div>
        </button>
      )}
    </>
  );
};
