import isNull from 'lodash/isNull';

import { FilterKind, SearchFiltersURL } from '../types';

interface F {
  [key: string]: string[];
}

const WHITELISTED_FILTER_KEYS = [
  FilterKind.Foundation, // Project foundation
  FilterKind.Maturity, // Project maturity
  FilterKind.Project, // Project name
  FilterKind.Kind, // Issue kind
  FilterKind.Difficulty, // Issue difficulty
  FilterKind.Area, // Issue area
  FilterKind.Language, // Issue language
];

const buildSearchParams = (p: URLSearchParams): SearchFiltersURL => {
  const filters: F = {};

  p.forEach((value, key) => {
    if (WHITELISTED_FILTER_KEYS.includes(key as FilterKind)) {
      const values = filters[key] || [];
      values.push(value);
      filters[key] = values;
    }
  });

  return {
    ts_query_web: p.has('ts_query_web') ? p.get('ts_query_web')! : undefined,
    mentor_available: p.has('mentor_available'),
    good_first_issue: p.has('good_first_issue'),
    no_linked_prs: p.has('no_linked_prs'),
    filters: { ...filters },
    pageNumber: p.has('page') && !isNull(p.get('page')) ? parseInt(p.get('page')!) : 1,
  };
};

export default buildSearchParams;
