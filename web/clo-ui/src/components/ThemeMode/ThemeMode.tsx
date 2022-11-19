import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';
import { GoBrowser } from 'react-icons/go';

import styles from './ThemeMode.module.css';

export interface IThemeModeProps {
  device: string;
  configuredTheme: string;
  onChange: (vallue: string) => void;
}

export const ThemeMode: React.FC<IThemeModeProps> = (props: IThemeModeProps) => {
  return (
    <>
      <div className="px-3 py-2 lightText text-secondary text-uppercase fw-bold">Theme</div>

      <div className="dropdown-item">
        <div className="form-check">
          <input
            id={`theme-${props.device}-automatic`}
            name="automatic"
            className={`form-check-input ${styles.input}`}
            type="radio"
            value="automatic"
            onChange={() => props.onChange('automatic')}
            aria-checked={props.configuredTheme === 'automatic'}
            tabIndex={-1}
            checked={props.configuredTheme === 'automatic'}
          />
          <label className="form-check-label w-100" htmlFor={`theme-${props.device}-automatic`}>
            <GoBrowser className="mx-1 position-relative" />
            Automatic
          </label>
        </div>
      </div>

      <div className="dropdown-item">
        <div className="form-check">
          <input
            id={`theme-${props.device}-light`}
            name="light"
            className={`form-check-input ${styles.input}`}
            type="radio"
            value="light"
            onChange={() => props.onChange('light')}
            aria-checked={props.configuredTheme === 'light'}
            tabIndex={-1}
            checked={props.configuredTheme === 'light'}
          />
          <label className="form-check-label w-100" htmlFor={`theme-${props.device}-light`}>
            <FiSun className="mx-1 position-relative" />
            Light
          </label>
        </div>
      </div>

      <div className="dropdown-item">
        <div className="form-check">
          <input
            id={`theme-${props.device}-dark`}
            name="dark"
            className={`form-check-input ${styles.input}`}
            type="radio"
            value="dark"
            onChange={() => props.onChange('dark')}
            aria-checked={props.configuredTheme === 'dark'}
            tabIndex={-1}
            checked={props.configuredTheme === 'dark'}
          />
          <label className="form-check-label w-100" htmlFor={`theme-${props.device}-dark`}>
            <FiMoon className="mx-1 position-relative" />
            Dark
          </label>
        </div>
      </div>
    </>
  );
};
