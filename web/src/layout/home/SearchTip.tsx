import { isUndefined, sample } from 'lodash';
import { memo, useState } from 'react';
import { FaRegLightbulb } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import { SEARCH_TIPS } from '../../data';
import { SearchTipItem } from '../../types';
import prepareQueryString from '../../utils/prepareQueryString';
import styles from './SearchTip.module.css';

const SearchTip = () => {
  const [activeTip] = useState<SearchTipItem | undefined>(sample(SEARCH_TIPS));

  if (isUndefined(activeTip)) return null;

  return (
    <div className="d-none d-md-inline w-50 mx-auto text-center position-relative">
      <div
        className={`d-flex mt-2 pt-1 flex-row align-items-baseline justify-content-center textLight ${styles.tipText}`}
      >
        <FaRegLightbulb className="me-1" />
        <div className="align-items-baseline">
          <span className="me-1 fw-normal">Tip:</span>
          {activeTip.content} Example:{' '}
          <Link
            className="fw-bold textLighter p-0"
            to={{
              pathname: '/search',
              search: prepareQueryString({
                pageNumber: 1,
                ts_query_web: activeTip.example,
              }),
            }}
          >
            {activeTip.example}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default memo(SearchTip);
