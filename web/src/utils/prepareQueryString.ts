import { isEmpty, isUndefined } from 'lodash';

import { BasicQuery, SearchFiltersURL } from '../types';

const getURLSearchParams = (query: BasicQuery): URLSearchParams => {
  const q = new URLSearchParams();
  if (!isUndefined(query.filters) && !isEmpty(query.filters)) {
    Object.keys(query.filters).forEach((filterId: string) => {
      return query.filters![filterId].forEach((id: string) => {
        q.append(filterId, id.toString());
      });
    });
  }
  if (!isUndefined(query.ts_query_web) && query.ts_query_web !== '') {
    q.set('ts_query_web', query.ts_query_web);
  }
  if (!isUndefined(query.mentor_available) && query.mentor_available) {
    q.set('mentor_available', 'true');
  }
  return q;
};

const prepareQueryString = (query: SearchFiltersURL): string => {
  const q = getURLSearchParams(query);
  q.set('page', query.pageNumber.toString());
  return `?${q.toString()}`;
};

export default prepareQueryString;
