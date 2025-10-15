import classNames from 'classnames';
import { DotsLoading } from 'clo-ui/components/DotsLoading';
import { Dropdown } from 'clo-ui/components/Dropdown';
import { ElementWithTooltip } from 'clo-ui/components/ElementWithTooltip';
import { FilterOption } from 'clo-ui/components/FilterOption';
import { FilterSection } from 'clo-ui/components/FilterSection';
import { FiltersSection } from 'clo-ui/components/FiltersSection';
import { RefFiltersSection } from 'clo-ui/components/RefFiltersSection';
import { isUndefined } from 'lodash';
import React, { useContext, useEffect, useRef } from 'react';
import { IoMdCloseCircleOutline } from 'react-icons/io';

import { AppContext } from '../../context/AppContextProvider';
import { Filter, FilterKind } from '../../types';
import styles from './FiltersInLine.module.css';

interface Props {
  filters: FilterSection[];
  activeFilters: {
    [key: string]: string[];
  };
  disabledSections: FilterKind[];
  projects?: Filter;
  mentorAvailable: boolean;
  goodFirstIssue: boolean;
  noLinkedPRs: boolean;
  onChange: (name: string, value: string, checked: boolean, type?: string) => void;
  onResetFilters: () => void;
  isLoadingFilters?: boolean;
  device: string;
  ifActiveFilters: boolean;
  extraContent?: JSX.Element;
}

interface FiltersProps {
  activeFilters: string[];
  disabled: boolean;
  contentClassName?: string;
  section: FilterSection;
  device: string;
  withSearchBar?: boolean;
  onChange: (name: string, value: string, checked: boolean, type?: string) => void;
  closeDropdown?: () => void;
  isVisibleDropdown?: boolean;
}

const Filters = (props: FiltersProps) => {
  const filtersSection = useRef<RefFiltersSection>(null);

  const onChangeFilter = (name: string, value: string, checked: boolean, type?: string) => {
    props.onChange(name, value, checked, type);
    if (!isUndefined(props.closeDropdown)) {
      props.closeDropdown();
    }
  };

  useEffect(() => {
    if (!isUndefined(props.isVisibleDropdown) && !props.isVisibleDropdown && filtersSection && filtersSection.current) {
      filtersSection.current.cleanValue();
    }
  }, [props.isVisibleDropdown]);

  return (
    <div className="ms-2 ms-xl-3 mt-2">
      <FiltersSection
        ref={filtersSection}
        device={props.device}
        activeFilters={props.activeFilters}
        contentClassName={`overflow-auto ${styles.options}`}
        section={props.section}
        withSearchBar={props.withSearchBar}
        searchBarClassName={props.withSearchBar ? styles.searchBar : ''}
        onChange={onChangeFilter}
        visibleTitle={false}
        disabled={props.disabled}
        sortedBySelected={props.withSearchBar}
      />
    </div>
  );
};

const FiltersInLine = (props: Props) => {
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
    <div className="d-none d-lg-block mb-2">
      <div className="d-flex flex-row align-items-baseline mt-2 mb-3">
        <div className={`text-uppercase text-secondary fw-bold ${styles.title}`}>Filters</div>
        {props.ifActiveFilters && (
          <button
            className={`btn btn-link text-secondary btn-sm py-0 me-3 ${styles.btnRemove}`}
            onClick={props.onResetFilters}
            aria-label="Remove all filters"
          >
            <div className="d-flex flex-row align-items-center">
              <div className="me-1">Clear all</div>
              <IoMdCloseCircleOutline />
            </div>
          </button>
        )}
        {!isUndefined(props.extraContent) && <div className="ms-auto">{props.extraContent}</div>}
      </div>
      {props.isLoadingFilters ? (
        <DotsLoading className="my-auto" />
      ) : (
        <div className="d-flex flex-row align-items-top justify-content-between">
          {props.filters.map((section: FilterSection, index: number) => {
            const isSearchSection = section.key && ['project', 'language'].includes(section.key);
            const activeFilters = section.key ? props.activeFilters[section.key] : getActiveFiltersForOther();
            const isDisabled = props.disabledSections.includes((section.key || section.title) as FilterKind);

            if (isEmbed && section.key === FilterKind.Foundation) return null;

            return (
              <React.Fragment key={`sec_${section.key}`}>
                <div
                  className={classNames(
                    styles.dropdownWrapper,
                    {
                      'me-2 me-lg-3 me-xl-4': index !== props.filters.length - 1,
                    },
                    { 'w-100': isEmbed }
                  )}
                >
                  <ElementWithTooltip
                    element={
                      <Dropdown
                        label="Filters"
                        btnContent={section.title}
                        btnClassName={`btn btn-md btn-light text-decoration-none text-start w-100 ${styles.btn}`}
                        dropdownClassName={classNames(
                          styles.dropdown,
                          {
                            [styles.projectDropdown]: section.key === 'project',
                          },
                          {
                            [styles.languageDropdown]: section.key === 'language',
                          }
                        )}
                        disabled={isDisabled}
                      >
                        <Filters
                          section={section}
                          disabled={isDisabled}
                          device={props.device}
                          activeFilters={activeFilters}
                          withSearchBar={isSearchSection ? true : undefined}
                          onChange={props.onChange}
                        />
                      </Dropdown>
                    }
                    tooltipWidth={210}
                    tooltipArrowClassName={styles.tooltipArrow}
                    tooltipMessage="Please select a foundation to use this filter"
                    visibleTooltip={isDisabled}
                    active
                  />

                  {activeFilters && (
                    <div className="mt-2">
                      {activeFilters.map((filter: string) => {
                        const opts: FilterOption[] = section.options as FilterOption[];
                        const selectedFilter = opts.find((f: FilterOption) => f.key === filter || f.value === filter);

                        if (isUndefined(selectedFilter)) return null;

                        return (
                          <div
                            className={`d-flex flex-row align-items-center w-100 ${styles.activeFilter}`}
                            key={`fil_${selectedFilter.value}`}
                          >
                            <div className="flex-grow-1 text-truncate me-2">{selectedFilter.name}</div>
                            <button
                              className={`btn btn-sm btn-link text-end text-decoration-none ${styles.closeBtn}`}
                              onClick={() =>
                                props.onChange(
                                  (selectedFilter.key || section.key)!,
                                  filter as string,
                                  false,
                                  selectedFilter.type
                                )
                              }
                            >
                              <IoMdCloseCircleOutline className={styles.closeIcon} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FiltersInLine;
