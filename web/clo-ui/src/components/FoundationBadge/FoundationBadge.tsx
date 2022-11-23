import React from 'react';

import styles from './FoundationBadge.module.css';

export enum Foundation {
  cncf = 'cncf',
  lfaidata = 'lfaidata',
}

export const FOUNDATIONS = {
  [Foundation.cncf]: {
    name: 'CNCF',
  },
  [Foundation.lfaidata]: {
    name: 'LF AI & Data',
  },
};

export interface IFoundationBadgeProps {
  foundation: Foundation;
  className?: string;
}

export const FoundationBadge: React.FC<IFoundationBadgeProps> = (props: IFoundationBadgeProps) => {
  const foundationData = FOUNDATIONS[props.foundation];

  return (
    <div
      data-testid="foundation-badge"
      className={`badge text-light extraLightText rounded-0 position-relative ${styles.badge} ${props.className}`}
    >
      <div className="d-flex flex-row align-items-center text-uppercase">{foundationData.name}</div>
    </div>
  );
};
