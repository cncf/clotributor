import { Foundation, FOUNDATIONS } from 'clo-ui';
import { isEmpty } from 'lodash';
import { Fragment, useEffect, useState } from 'react';
import { IoMdCloseCircleOutline } from 'react-icons/io';

import { FILTER_CATEGORY_NAMES } from '../../data';
import { FilterKind } from '../../types';
import capitalizeFirstLetter from '../../utils/capitalizeFirstLetter';
import styles from './SelectedFilters.module.css';

interface Props {
  filters: { [key: string]: string[] };
  onChange: (name: string, value: string, checked: boolean) => void;
  onResetFilters: () => void;
}

const SelectedFilters = (props: Props) => {
  const [filtersNumber, setFiltersNumber] = useState<number>(0);

  useEffect(() => {
    let filters: number = 0;

    Object.keys(props.filters).forEach((cat: string) => {
      filters = filters + props.filters[cat].length;
    });

    setFiltersNumber(filters);
  }, [props.filters]);

  if (isEmpty(props.filters)) return null;

  const getFilterName = (type: FilterKind, filter: string): string => {
    switch (type) {
      case FilterKind.Foundation:
        return FOUNDATIONS[filter as Foundation].name;

      case FilterKind.Maturity:
        return filter;
    }
  };

  return (
    <div className="d-none d-md-block mt-2">
      <div className="d-flex flex-row justify-content-start align-items-baseline">
        <div className="me-3">Filters:</div>
        <div role="list" className={`position-relative ${styles.badges}`}>
          {Object.keys(props.filters).map((category: string) => {
            const categoryName = FILTER_CATEGORY_NAMES[category as FilterKind];
            return (
              <Fragment key={`filter_${category}`}>
                {props.filters[category].map((filter: string) => {
                  const filterName = capitalizeFirstLetter(getFilterName(category as FilterKind, filter));
                  return (
                    <span
                      role="listitem"
                      className={`badge bg-secondary rounded-0 text-light me-3 my-1 ${styles.badge} lightBorder`}
                      key={`filter_${category}_${filter}`}
                    >
                      <div className="d-flex flex-row align-items-baseline">
                        <div className={styles.content}>
                          <small className="text-uppercase fw-normal me-2">{categoryName}:</small>
                          <span>{filterName}</span>
                        </div>
                        <button
                          className={`btn btn-link btn-sm lh-1 ${styles.btn}`}
                          onClick={() => props.onChange(category, filter as string, false)}
                          aria-label={`Remove ${filterName} filter`}
                        >
                          <IoMdCloseCircleOutline />
                        </button>
                      </div>
                    </span>
                  );
                })}
              </Fragment>
            );
          })}

          {filtersNumber > 1 && (
            <span role="listitem" className={`d-inline-block me-3 ${styles.reset}`}>
              <button
                className={`btn btn-link text-secondary btn-sm lh-1 ${styles.btn}`}
                onClick={props.onResetFilters}
                aria-label="Remove all filters"
              >
                <div className="d-flex flex-row align-items-center">
                  <div className="fw-bold me-1">Reset all</div>
                  <IoMdCloseCircleOutline />
                </div>
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedFilters;
