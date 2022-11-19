import { FiltersSection, Section } from 'clo-ui';
import { isEmpty } from 'lodash';
import React from 'react';
import { IoMdCloseCircleOutline } from 'react-icons/io';

import { FILTERS } from '../../data';

interface Props {
  visibleTitle: boolean;
  activeFilters: {
    [key: string]: string[];
  };
  onChange: (name: string, value: string, checked: boolean) => void;
  onResetFilters?: () => void;
  device: string;
}

const Filters = (props: Props) => {
  return (
    <>
      {props.visibleTitle && (
        <div className="d-flex flex-row align-items-center justify-content-between pb-2 mb-4 border-bottom">
          <div className="h6 text-uppercase mb-0 lh-base text-primary fw-bold">Filters</div>
          {!isEmpty(props.activeFilters) && (
            <button className="btn btn-link text-primary" onClick={props.onResetFilters} aria-label="Reset filters">
              <div className="d-flex flex-row align-items-center">
                <IoMdCloseCircleOutline className="me-2" />

                <small>Reset</small>
              </div>
            </button>
          )}
        </div>
      )}

      {FILTERS.map((section: Section) => (
        <React.Fragment key={`sec_${section.name}`}>
          <FiltersSection
            device={props.device}
            activeFilters={props.activeFilters[section.name]}
            section={section}
            onChange={props.onChange}
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default Filters;
