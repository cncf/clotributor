import { Dropdown, FiltersSection, Section } from 'clo-ui';
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

const FiltersInLine = (props: Props) => {
  return (
    <div className="d-flex flex-row align-items-center">
      {FILTERS.map((section: Section) => (
        <div key={`sec_${section.name}`} className="me-2 me-md-4">
          <Dropdown
            label="Filters"
            btnContent={section.name}
            btnClassName={`btn btn-md btn-light text-decoration-none ${styles.btn}`}
            dropdownClassName={styles.dropdown}
          >
            <div className="ms-3">
              <FiltersSection
                device={props.device}
                activeFilters={props.activeFilters[section.name]}
                section={section}
                onChange={props.onChange}
                visibleTitle={false}
              />
            </div>
          </Dropdown>
        </div>
      ))}
    </div>
  );
};

export default FiltersInLine;
