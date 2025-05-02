import { FilterSection, FiltersSection } from 'clo-ui';
import { isEmpty } from 'lodash';
import React, { useContext } from 'react';
import { IoMdCloseCircleOutline } from 'react-icons/io';

import { AppContext } from '../../context/AppContextProvider';
import { FilterKind } from '../../types';
import styles from './Filters.module.css';

interface Props {
  visibleTitle: boolean;
  filters: FilterSection[];
  activeFilters: {
    [key: string]: string[];
  };
  mentorAvailable: boolean;
  goodFirstIssue: boolean;
  noLinkedPRs: boolean;
  onChange: (name: string, value: string, checked: boolean, type?: string) => void;
  onResetFilters?: () => void;
  device: string;
  disabledSections: FilterKind[];
}

const Filters = (props: Props) => {
  const { ctx } = useContext(AppContext);
  const isEmbed = ctx.isEmbed;

  const getActiveFiltersForOther = (): string[] => {
    const otherFilters = [];
    if (props.mentorAvailable) {
      otherFilters.push('mentor_available');
    }
    if (props.goodFirstIssue) {
      otherFilters.push('good_first_issue');
    }
    if (props.noLinkedPRs) {
      otherFilters.push('no_linked_prs');
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
        const key = (section.key || section.title) as FilterKind;
        const withSearchBar = [FilterKind.Language, FilterKind.Project].includes(key);

        // Does not render disabled sections on mobile version
        if (
          props.disabledSections.includes(key) ||
          section.options.length === 0 ||
          (isEmbed && key === FilterKind.Foundation)
        )
          return null;

        return (
          <React.Fragment key={`sec_${key}`}>
            <FiltersSection
              device={props.device}
              activeFilters={activeFilters}
              section={section}
              onChange={props.onChange}
              withSearchBar={withSearchBar}
              contentClassName={withSearchBar ? `border overflow-auto p-3 ${styles.dropdownFilter}` : ''}
              searchBarClassName={withSearchBar ? styles.searchBar : ''}
              sortedBySelected={withSearchBar}
              visibleTitle
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default Filters;
