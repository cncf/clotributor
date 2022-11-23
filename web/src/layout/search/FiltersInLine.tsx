import { Dropdown, FiltersSection, Section } from 'clo-ui';
import { isUndefined } from 'lodash';
import React from 'react';

import { FILTERS } from '../../data';
import styles from './FiltersInLine.module.css';

interface Props {
  activeFilters: {
    [key: string]: string[];
  };
  onChange: (name: string, value: string, checked: boolean) => void;
  device: string;
}

interface FiltersProps extends Props {
  section: Section;
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
        activeFilters={props.activeFilters[props.section.name]}
        section={props.section}
        onChange={onChangeFilter}
        visibleTitle={false}
      />
    </div>
  );
};

const FiltersInLine = (props: Props) => {
  return (
    <div className="d-none d-lg-flex flex-row align-items-center">
      {FILTERS.map((section: Section) => (
        <div key={`sec_${section.name}`} className="me-2 me-md-4">
          <Dropdown
            label="Filters"
            btnContent={section.name}
            btnClassName={`btn btn-md btn-light text-decoration-none ${styles.btn}`}
            dropdownClassName={styles.dropdown}
          >
            <Filters
              section={section}
              device={props.device}
              activeFilters={props.activeFilters}
              onChange={props.onChange}
            />
          </Dropdown>
        </div>
      ))}
    </div>
  );
};

export default FiltersInLine;
