import { Dropdown } from 'clo-ui';
import { FaCog } from 'react-icons/fa';

import ThemeMode from './ThemeMode';

const Settings = () => {
  return (
    <Dropdown label="Settings" btnContent={<FaCog />} btnClassName="fs-5">
      <ThemeMode device="desktop" />
    </Dropdown>
  );
};

export default Settings;
