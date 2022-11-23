import classnames from 'classnames';
import { isUndefined } from 'lodash';
import React, { ChangeEvent } from 'react';

import { CheckBox } from '../Checkbox/Checkbox';
import styles from './FiltersSection.module.css';

export interface Section {
  name: string;
  title: string;
  filters: Filter[];
}

export interface Filter {
  name: string;
  label: string;
  legend?: string;
  decorator?: JSX.Element;
}

export interface IFiltersSectionProps {
  section: Section;
  visibleTitle: boolean;
  device: string;
  activeFilters?: string[];
  onChange: (name: string, value: string, checked: boolean) => void;
}

export const FiltersSection: React.FC<IFiltersSectionProps> = (props: IFiltersSectionProps) => {
  return (
    <>
      {props.visibleTitle && (
        <div className={`fw-bold text-uppercase text-primary ${styles.categoryTitle}`}>
          <small>{props.section.title}</small>
        </div>
      )}

      <div className={classnames({ 'mt-2': props.visibleTitle })}>
        {props.section.filters.map((filter: Filter) => {
          return (
            <CheckBox
              key={`filter_${filter.name.toString()}`}
              name={props.section.name}
              value={filter.name.toString()}
              labelClassName="mw-100"
              legend={filter.legend}
              label={filter.label}
              icon={<span className={`position-relative ${styles.decorator}`}>{filter.decorator}</span>}
              device={props.device}
              checked={!isUndefined(props.activeFilters) && props.activeFilters.includes(filter.name.toString())}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                props.onChange(e.target.name, e.target.value, e.target.checked)
              }
            />
          );
        })}
      </div>
    </>
  );
};
