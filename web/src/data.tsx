import { Foundation, Maturity, Section } from 'clo-ui';

import { FilterKind, SearchTipItem, SortBy } from './types';

export const DEFAULT_SORT_BY = SortBy.MostRecent;
export const DEFAULT_SEARCH_LIMIT = 20;

export const FILTERS: Section[] = [
  {
    name: FilterKind.Foundation,
    title: 'Foundation',
    filters: [
      { name: Foundation.cncf, label: 'CNCF' },
      { name: Foundation.lfaidata, label: 'LF AI & Data' },
    ],
  },
  {
    name: FilterKind.Maturity,
    title: 'Maturity level',
    filters: [
      { name: Maturity.graduated, label: 'Graduated' },
      { name: Maturity.incubating, label: 'Incubating' },
      { name: Maturity.sandbox, label: 'Sandbox' },
    ],
  },
  {
    name: FilterKind.Kind,
    title: 'Kind',
    filters: [
      { name: 'bug', label: 'Bug' },
      { name: 'feature', label: 'Feature' },
      { name: 'enhancement', label: 'Enhancement' },
    ],
  },
  {
    name: FilterKind.Difficulty,
    title: 'Difficulty',
    filters: [
      { name: 'easy', label: 'Easy' },
      { name: 'medium', label: 'Medium' },
      { name: 'hard', label: 'Hard' },
    ],
  },
];

export const SORT_OPTIONS = [
  {
    label: 'Most recent',
    by: SortBy.MostRecent,
  },
  {
    label: 'Relevance',
    by: SortBy.Relevance,
  },
];

export const FILTER_CATEGORY_NAMES = {
  [FilterKind.Foundation]: 'Foundation',
  [FilterKind.Maturity]: 'Maturity',
};

export const SEARCH_TIPS: SearchTipItem[] = [
  {
    content: (
      <>
        Use <span className="fw-semibold">multiple words</span> to refine your search.
      </>
    ),
    example: 'gitops go',
  },
  {
    content: (
      <>
        Use <span className="fw-semibold">-</span> to exclude words from your search.
      </>
    ),
    example: 'rust -webassembly',
  },
  {
    content: (
      <>
        Put a phrase inside <span className="fw-semibold">double quotes</span> for an exact match.
      </>
    ),
    example: `"machine learning"`,
  },
  {
    content: (
      <>
        Use <span className="fw-semibold">or</span> to combine multiple searches.
      </>
    ),
    example: 'networking or security',
  },
];
