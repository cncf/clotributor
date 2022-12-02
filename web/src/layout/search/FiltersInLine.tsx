import { Dropdown, Filter as FilterOpt, FiltersSection, Foundation, FOUNDATIONS, Searchbar, Section } from 'clo-ui';
import { isEmpty, isNull, isUndefined } from 'lodash';
import React, { useEffect, useState } from 'react';
import { IoMdCloseCircleOutline } from 'react-icons/io';

import { FILTERS } from '../../data';
import { Filter, FilterKind, FilterOption } from '../../types';
import capitalizeFirstLetter from '../../utils/capitalizeFirstLetter';
import styles from './FiltersInLine.module.css';

interface Props {
  activeFilters: {
    [key: string]: string[];
  };
  projects?: Filter;
  mentorAvailable: boolean;
  onMentorChange: () => void;
  onChange: (name: string, value: string, checked: boolean) => void;
  onResetFilters: () => void;
  device: string;
}

interface FiltersProps {
  activeFilters: string[];
  contentClassName?: string;
  section: Section;
  device: string;
  additionalContent?: JSX.Element;
  onChange: (name: string, value: string, checked: boolean) => void;
  closeDropdown?: () => void;
}

const SEARCH_DELAY = 3 * 100; // 300ms

const Filters = (props: FiltersProps) => {
  const onChangeFilter = (name: string, value: string, checked: boolean) => {
    props.onChange(name, value, checked);
    if (!isUndefined(props.closeDropdown)) {
      props.closeDropdown();
    }
  };

  return (
    <div className="ms-3 mt-2">
      {props.additionalContent}
      <FiltersSection
        device={props.device}
        activeFilters={props.activeFilters}
        contentClassName={`overflow-auto ${styles.projectOptions}`}
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

    default:
      return filter;
  }
};

const ProjectFilters = (props: Props) => {
  const [value, setValue] = useState<string>('');
  const [visibleOptions, setVisibleOptions] = useState<FilterOpt[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const activeFilters = props.activeFilters.project;

  const formatOptions = (opts: FilterOption[]) => {
    return opts.map((opt: FilterOption) => {
      return { name: opt.value, label: opt.name };
    });
  };

  useEffect(() => {
    if (!isUndefined(props.projects)) {
      setVisibleOptions(formatOptions(props.projects.options));
    }
  }, [props.projects]);

  const searchProjects = () => {
    if (props.projects && props.projects.options) {
      if (value !== '') {
        setVisibleOptions(formatOptions(props.projects.options.filter((f: FilterOption) => f.value.includes(value))));
      } else {
        setVisibleOptions(formatOptions(props.projects.options));
      }
    }
  };

  useEffect(() => {
    if (!isNull(searchTimeout)) {
      clearTimeout(searchTimeout);
    }
    setSearchTimeout(
      setTimeout(() => {
        searchProjects();
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

  if (isUndefined(props.projects)) return null;

  return (
    <div className={`me-2 me-md-4 ${styles.dropdownWrapper}`}>
      <Dropdown
        label="Filters"
        btnContent="Project"
        btnClassName={`btn btn-md btn-light text-decoration-none text-start w-100 ${styles.btn}`}
        dropdownClassName={`${styles.dropdown} ${styles.projectDropdown}`}
        onClose={() => setValue('')}
      >
        <Filters
          section={{ name: 'project', title: 'Project', filters: visibleOptions }}
          device={props.device}
          contentClassName={styles.content}
          activeFilters={activeFilters}
          onChange={props.onChange}
          additionalContent={
            <div className="mb-3">
              <Searchbar
                value={value}
                onValueChange={(newValue: string) => setValue(newValue)}
                onSearch={searchProjects}
                cleanSearchValue={() => setValue('')}
                classNameSearch={styles.search}
                placeholder="Search projects"
                bigSize={false}
              />
            </div>
          }
        />
      </Dropdown>
      {activeFilters && (
        <div className="mt-2">
          {activeFilters.map((filter: string) => {
            const filterOpt = props.projects!.options.find((opt: FilterOption) => opt.value === filter);
            if (isUndefined(filterOpt)) return null;

            const filterName = capitalizeFirstLetter(filterOpt.name);

            return (
              <button
                className={`btn btn-sm btn-link text-start w-100 text-decoration-none ${styles.btnActiveFilter}`}
                onClick={() => props.onChange('project', filter as string, false)}
                key={`fil_${filterName}`}
              >
                <div className="d-flex flex-row align-items-center">
                  <div className="flex-grow-1 text-truncate me-2">{filterName}</div>
                  <IoMdCloseCircleOutline className={`ms-auto ${styles.closeBtn}`} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FiltersInLine = (props: Props) => {
  return (
    <div className="d-none d-lg-block mb-2">
      <div className="d-flex flex-row align-items-baseline mt-2 mb-3">
        <div className={`text-uppercase text-secondary fw-bold ${styles.title}`}>Filters</div>
        {!isEmpty(props.activeFilters) && (
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
      </div>
      <div className="d-flex flex-row align-items-top">
        {FILTERS.map((section: Section) => {
          const activeFilters = props.activeFilters[section.name];

          return (
            <React.Fragment key={`sec_${section.name}`}>
              <div className={`me-2 me-md-4 ${styles.dropdownWrapper}`}>
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
                          key={`fil_${filterName}`}
                        >
                          <div className="d-flex flex-row align-items-center">
                            <div className="flex-grow-1 text-truncate me-2">{filterName}</div>
                            <IoMdCloseCircleOutline className={`ms-auto ${styles.closeBtn}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {section.name === FilterKind.Maturity && <ProjectFilters {...props} />}
            </React.Fragment>
          );
        })}
        <div className={`me-2 me-md-4 ${styles.dropdownWrapper}`}>
          <Dropdown
            label="Filters"
            btnContent="Other"
            btnClassName={`btn btn-md btn-light text-decoration-none text-start w-100 ${styles.btn}`}
            dropdownClassName={styles.dropdown}
          >
            <Filters
              section={{
                name: 'other',
                title: 'Other',
                filters: [{ name: 'mentor_available', label: 'Mentor available' }],
              }}
              device={props.device}
              activeFilters={props.mentorAvailable ? ['mentor_available'] : []}
              onChange={props.onMentorChange}
            />
          </Dropdown>
          {props.mentorAvailable && (
            <div className="mt-2">
              <button
                className={`btn btn-sm btn-link text-start w-100 text-decoration-none ${styles.btnActiveFilter}`}
                onClick={props.onMentorChange}
              >
                <div className="d-flex flex-row align-items-center">
                  <div className="flex-grow-1 text-truncate me-2">Mentor available</div>
                  <IoMdCloseCircleOutline className={`ms-auto ${styles.closeBtn}`} />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltersInLine;
