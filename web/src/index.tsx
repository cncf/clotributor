import './index.css';

import { createRoot } from 'react-dom/client';

const container = document.getElementById('clo-wrapper');
const root = createRoot(container!);

void import('./App').then(({ default: App }) => {
  root.render(<App />);
});
