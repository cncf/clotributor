import { FilterSection, FiltersSection } from 'clo-ui';
import { isEmpty } from 'lodash';
import React from 'react';
import { IoMdCloseCircleOutline } from 'react-icons/io';

interface Props {
  visibleTitle: boolean;
  filters: FilterSection[];
  activeFilters: {
    [key: string]: string[];
  };
  mentorAvailable: boolean;
  goodFirstIssue: boolean;
  onChange: (name: string, value: string, checked: boolean, type?: string) => void;
  onResetFilters?: () => void;
  device: string;
}

const Filters = (props: Props) => {
  const getActiveFiltersForOther = (): string[] => {
    let otherFilters = [];
    if (props.mentorAvailable) {
      otherFilters.push('mentor_available');
    }
    if (props.goodFirstIssue) {
      otherFilters.push('good_first_issue');
    }
    return otherFilters;
  };

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

      {props.filters.map((section: FilterSection) => {
        const activeFilters = section.key ? props.activeFilters[section.key] : getActiveFiltersForOther();
        // Does not render project and language filters on mobile version
        if (section.key && ['project', 'language'].includes(section.key)) return null;
        return (
          <React.Fragment key={`sec_${section.key}`}>
            <FiltersSection
              device={props.device}
              activeFilters={activeFilters}
              section={section}
              onChange={props.onChange}
              visibleTitle
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default Filters;
