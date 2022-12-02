import classNames from 'classnames';
import { isNull } from 'lodash';
import React, { KeyboardEvent, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import { IoCloseSharp } from 'react-icons/io5';

import styles from './Searchbar.module.css';

export interface ISearchbarProps {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSearch: () => void;
  cleanSearchValue: () => void;
  bigSize: boolean;
  classNameWrapper?: string;
  classNameSearch?: string;
}

export const Searchbar: React.FC<ISearchbarProps> = (props: ISearchbarProps) => {
  const inputEl = useRef<HTMLInputElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        props.onSearch();
        forceBlur();
        return;
      default:
        return;
    }
  };

  const forceBlur = (): void => {
    if (!isNull(inputEl) && !isNull(inputEl.current)) {
      inputEl.current.blur();
    }
  };

  const forceFocus = (): void => {
    if (!isNull(inputEl) && !isNull(inputEl.current)) {
      inputEl.current.focus();
    }
  };

  return (
    <div className={classNames('position-relative', props.classNameWrapper, { [styles.big]: props.bigSize })}>
      <div
        className={`d-flex align-items-center overflow-hidden searchBar lh-base bg-white mx-auto ${styles.searchBar} ${props.classNameSearch} search`}
      >
        <input
          data-testid="search-bar"
          ref={inputEl}
          className={`flex-grow-1 ps-2 ps-md-3 border-0 shadow-none bg-transparent lh-base ${styles.input}`}
          type="text"
          value={props.value}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck="false"
          placeholder={props.placeholder}
          onKeyDown={onKeyDown}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onValueChange(e.target.value)}
        />

        {props.value !== '' && (
          <>
            <button
              aria-label="Clear search"
              className={`btn btn-link lh-1 px-2 ${styles.btnIcon}`}
              onClick={() => {
                props.cleanSearchValue();
                forceFocus();
              }}
            >
              <div className="text-muted lightIcon">
                <IoCloseSharp />
              </div>
            </button>
            <div className={`vr ${styles.vr}`} />
          </>
        )}

        <button
          aria-label="Search text"
          className={`btn btn-link lh-1 px-2 ${styles.btnIcon}`}
          onClick={props.onSearch}
        >
          <div className={`${styles.iconWrapper} lightIcon`}>
            <FiSearch />
          </div>
        </button>
      </div>
    </div>
  );
};
