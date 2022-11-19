import classNames from 'classnames';
import { ExternalLink } from 'clo-ui';
import { useRef, useState } from 'react';
import { BsList } from 'react-icons/bs';
import { FaGithub } from 'react-icons/fa';

import useOutsideClick from '../../hooks/useOutsideClick';
import styles from './MobileSettings.module.css';
import ThemeMode from './ThemeMode';

const MobileSettings = () => {
  const [visibleDropdown, setVisibleDropdown] = useState(false);
  const ref = useRef(null);
  useOutsideClick([ref], visibleDropdown, () => setVisibleDropdown(false));

  return (
    <div ref={ref} className="d-flex d-md-none ms-auto position-relative">
      <button
        className={`btn btn-sm btn-link text-white rounded-0 lh-1 fs-5 ms-3 ${styles.btn}`}
        type="button"
        onClick={() => setVisibleDropdown(!visibleDropdown)}
        aria-label="Mobile settings button"
        aria-expanded={visibleDropdown}
      >
        <BsList />
      </button>

      <div role="menu" className={classNames('dropdown-menu rounded-0', styles.dropdown, { show: visibleDropdown })}>
        <ThemeMode device="mobile" />

        <hr />

        <div className="dropdown-item mb-2">
          <ExternalLink className="text-decoration-none fw-bold d-inline-block w-100" label="Github link" href="">
            <div className="d-flex flex-row align-items-center py-1">
              <FaGithub />
              <div className="ms-2">Github</div>
            </div>
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default MobileSettings;
