import classnames from 'classnames';
import { isNull, isUndefined } from 'lodash';
import React, { ChangeEvent, useEffect, useState } from 'react';

import { CheckBox } from '../Checkbox/Checkbox';
import { Searchbar } from '../Searchbar/Searchbar';
import styles from './FiltersSection.module.css';

export interface FilterSection {
  key?: string;
  title: string;
  options: FilterOption[];
}

export interface FilterOption {
  name: string;
  value?: string;
  type?: string;
  key?: string;
  legend?: string;
  decorator?: JSX.Element;
}

export interface IFiltersSectionProps {
  section: FilterSection;
  visibleTitle: boolean;
  contentClassName?: string;
  device: string;
  activeFilters?: string[];
  withSearchBar?: boolean;
  onChange: (name: string, value: string, checked: boolean, type?: string) => void;
}

const SEARCH_DELAY = 3 * 100; // 300ms

export const FiltersSection: React.FC<IFiltersSectionProps> = (props: IFiltersSectionProps) => {
  const [value, setValue] = useState<string>('');
  const [visibleOptions, setVisibleOptions] = useState<FilterOption[]>(props.section.options);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const filterOptions = () => {
    if (props.section.options) {
      if (value !== '') {
        setVisibleOptions(props.section.options.filter((f: FilterOption) => f.value && f.value.includes(value)));
      } else {
        setVisibleOptions(props.section.options);
      }
    }
  };

  useEffect(() => {
    setVisibleOptions(props.section.options);
  }, [props.section.options]);

  useEffect(() => {
    if (!isNull(searchTimeout)) {
      clearTimeout(searchTimeout);
    }
    setSearchTimeout(
      setTimeout(() => {
        filterOptions();
      }, SEARCH_DELAY)
    );
  }, [value]); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <>
      {props.visibleTitle && (
        <div className={`fw-bold text-uppercase text-primary ${styles.categoryTitle}`}>
          <small>{props.section.title}</small>
        </div>
      )}

      {!isUndefined(props.withSearchBar) && props.withSearchBar && (
        <div className="mb-3">
          <Searchbar
            value={value}
            onValueChange={(newValue: string) => setValue(newValue)}
            onSearch={filterOptions}
            cleanSearchValue={() => setValue('')}
            classNameSearch={styles.search}
            placeholder={`Search ${props.section.key || ''}`}
            bigSize={false}
          />
        </div>
      )}

      <div className={classnames(props.contentClassName, { 'mt-2': props.visibleTitle })}>
        {visibleOptions.map((filter: FilterOption) => {
          return (
            <CheckBox
              key={`filter_${filter.key || filter.value}`}
              name={(filter.key || props.section.key)!}
              value={(filter.key || filter.value)!}
              labelClassName="mw-100"
              legend={filter.legend}
              label={filter.name}
              icon={<span className={`position-relative ${styles.decorator}`}>{filter.decorator}</span>}
              device={props.device}
              checked={!isUndefined(props.activeFilters) && props.activeFilters.includes((filter.key || filter.value)!)}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                props.onChange(e.target.name, e.target.value, e.target.checked, filter.type)
              }
            />
          );
        })}
      </div>
    </>
  );
};
