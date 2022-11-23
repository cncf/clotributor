import React, { ChangeEvent, useRef } from 'react';

import styles from './PaginationLimitOptions.module.css';

const AVAILABLE_LIMITS = [20, 40, 60];

export interface IPaginationLimitOptionsProps {
  limit: number;
  onPaginationLimitChange: (limit: number) => void;
}

export const PaginationLimitOptions: React.FC<IPaginationLimitOptionsProps> = (props: IPaginationLimitOptionsProps) => {
  const selectEl = useRef<HTMLSelectElement>(null);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    props.onPaginationLimitChange(parseInt(event.target.value));
    forceBlur();
  };

  const forceBlur = (): void => {
    if (selectEl && selectEl.current) {
      selectEl.current.blur();
    }
  };

  return (
    <div className="d-none d-md-flex flex-nowrap align-items-center lh-1">
      <label className="form-label me-2 mb-0">Show:</label>
      <select
        ref={selectEl}
        className={`form-select form-select-sm rounded-0 cursorPointer ${styles.select}`}
        value={props.limit}
        onChange={handleChange}
        aria-label="Pagination limit select"
      >
        {AVAILABLE_LIMITS.map((opt: number) => {
          return (
            <option value={opt} key={`limit_${opt}`}>
              {opt}
            </option>
          );
        })}
      </select>
    </div>
  );
};
