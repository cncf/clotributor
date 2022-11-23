import { Dropdown } from 'clo-ui';
import { FaCog } from 'react-icons/fa';

import styles from './Settings.module.css';
import ThemeMode from './ThemeMode';

const Settings = () => {
  return (
    <Dropdown
      label="Settings"
      btnContent={<FaCog />}
      btnClassName={`btn btn-md btn-link text-white rounded-0 lh-1 fs-5 ${styles.btn}`}
      dropdownClassName={styles.dropdown}
    >
      <ThemeMode device="desktop" />
    </Dropdown>
  );
};

export default Settings;
