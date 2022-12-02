import { Dropdown, FiltersSection, Foundation, FOUNDATIONS, Section } from 'clo-ui';
import { isUndefined } from 'lodash';
import { useEffect, useState } from 'react';
import { IoMdCloseCircleOutline } from 'react-icons/io';

import { FILTERS } from '../../data';
import { FilterKind } from '../../types';
import capitalizeFirstLetter from '../../utils/capitalizeFirstLetter';
import styles from './FiltersInLine.module.css';

interface Props {
  activeFilters: {
    [key: string]: string[];
  };
  onChange: (name: string, value: string, checked: boolean) => void;
  onResetFilters: () => void;
  device: string;
}

interface FiltersProps {
  activeFilters: string[];
  section: Section;
  device: string;
  onChange: (name: string, value: string, checked: boolean) => void;
  closeDropdown?: () => void;
}

const Filters = (props: FiltersProps) => {
  const onChangeFilter = (name: string, value: string, checked: boolean) => {
    props.onChange(name, value, checked);
    if (!isUndefined(props.closeDropdown)) {
      props.closeDropdown();
    }
  };

  return (
    <div className="ms-3 mt-2">
      <FiltersSection
        device={props.device}
        activeFilters={props.activeFilters}
        section={props.section}
        onChange={onChangeFilter}
        visibleTitle={false}
      />
    </div>
  );
};

const getFilterName = (type: FilterKind, filter: string): string => {
  switch (type) {
    case FilterKind.Foundation:
      return FOUNDATIONS[filter as Foundation].name;

    case FilterKind.Maturity:
      return filter;
  }
};

const FiltersInLine = (props: Props) => {
  const [filtersNumber, setFiltersNumber] = useState<number>(0);

  useEffect(() => {
    let filters: number = 0;

    Object.keys(props.activeFilters).forEach((cat: string) => {
      filters = filters + props.activeFilters[cat].length;
    });

    setFiltersNumber(filters);
  }, [props.activeFilters]);

  return (
    <div className="d-none d-lg-block mb-2">
      <div className="d-flex flex-row align-items-baseline my-2">
        <div className={`text-uppercase text-secondary fw-bold ${styles.title}`}>Filters</div>
        {filtersNumber > 1 && (
          <button
            className={`btn btn-link text-secondary btn-sm me-3 ${styles.btnRemove}`}
            onClick={props.onResetFilters}
            aria-label="Remove all filters"
          >
            <div className="d-flex flex-row align-items-center">
              <div className="me-1">Clear all</div>
              <IoMdCloseCircleOutline />
            </div>
          </button>
        )}
      </div>
      <div className="d-flex flex-row align-items-top">
        {FILTERS.map((section: Section) => {
          const activeFilters = props.activeFilters[section.name];

          return (
            <div key={`sec_${section.name}`} className={`me-2 me-md-4 ${styles.dropdownWrapper}`}>
              <Dropdown
                label="Filters"
                btnContent={section.name}
                btnClassName={`btn btn-md btn-light text-decoration-none text-start w-100 ${styles.btn}`}
                dropdownClassName={styles.dropdown}
              >
                <Filters
                  section={section}
                  device={props.device}
                  activeFilters={activeFilters}
                  onChange={props.onChange}
                />
              </Dropdown>
              {activeFilters && (
                <div className="mt-2">
                  {activeFilters.map((filter: string) => {
                    const filterName = capitalizeFirstLetter(getFilterName(section.name as FilterKind, filter));

                    return (
                      <button
                        className={`btn btn-sm btn-link text-start w-100 text-decoration-none ${styles.btnActiveFilter}`}
                        onClick={() => props.onChange(section.name, filter as string, false)}
                      >
                        <div className="d-flex flex-row align-items-center">
                          <div className="flex-grow-1 text-truncate me-2">{filterName}</div>
                          <IoMdCloseCircleOutline className="ms-auto" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FiltersInLine;
