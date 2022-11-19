import 'clo-ui/dist/styles/default.scss';

import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { AppContextProvider } from './context/AppContextProvider';
import Layout from './layout';
import Home from './layout/home';
import NotFound from './layout/notFound';
import Search from './layout/search';

function App() {
  const [scrollPosition, setScrollPosition] = useState<undefined | number>(undefined);

  return (
    <AppContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout setScrollPosition={setScrollPosition} />}>
            <Route index element={<Home setScrollPosition={setScrollPosition} />} />
            <Route
              path="/search"
              element={<Search scrollPosition={scrollPosition} setScrollPosition={setScrollPosition} />}
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AppContextProvider>
  );
}

export default App;
