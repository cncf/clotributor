import classNames from 'classnames';
import { isUndefined } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

import useOutsideClick from '../../hooks/useOutsideClick';
import styles from './Dropdown.module.css';

export interface IDropdownProps {
  label: string;
  btnContent: JSX.Element | string;
  children: JSX.Element;
  btnClassName?: string;
  dropdownClassName?: string;
  onClose?: () => void;
}

export const Dropdown: React.FC<IDropdownProps> = (props: IDropdownProps) => {
  const [visibleDropdown, setVisibleDropdown] = useState(false);
  const ref = useRef(null);
  useOutsideClick([ref], visibleDropdown, () => setVisibleDropdown(false));

  const closeDropdown = () => {
    setVisibleDropdown(false);
  };

  useEffect(() => {
    if (!visibleDropdown && !isUndefined(props.onClose)) {
      props.onClose();
    }
  }, [visibleDropdown]); /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <div ref={ref} className="position-relative">
      <button
        className={`btn btn-md btn-link text-white rounded-0 lh-1 ${styles.btn} ${props.btnClassName}`}
        type="button"
        onClick={() => setVisibleDropdown(!visibleDropdown)}
        aria-label={`${props.label} button`}
        aria-expanded={visibleDropdown}
      >
        {props.btnContent}
      </button>

      <div
        role="menu"
        className={classNames('dropdown-menu rounded-0', styles.dropdown, props.dropdownClassName, {
          show: visibleDropdown,
        })}
      >
        <div className={`dropdown-arrow ${styles.arrow}`} />
        {React.cloneElement(props.children, { closeDropdown: closeDropdown, isVisibleDropdown: visibleDropdown })}
      </div>
    </div>
  );
};
