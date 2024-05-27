import { FilterKind, SearchTipItem, SortBy } from './types';

export const DEFAULT_SORT_BY = SortBy.MostRecent;
export const DEFAULT_THEME = 'automatic';
export const DEFAULT_SEARCH_LIMIT = 20;
export const EMBED_SEARCH_LIMIT = 10;
export const EMBED_PARAM = 'embed';
export const AVAILABLE_THEMES = ['light', 'dark', 'auto'];

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
