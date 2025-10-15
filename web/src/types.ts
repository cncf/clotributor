import { Foundation } from 'clo-ui/components/Foundation';
import { Maturity } from 'clo-ui/components/Maturity';

export interface OutletContext {
  setInvisibleFooter: (value: boolean) => void;
}

export interface Prefs {
  search: { limit: number; sort: { by: SortBy } };
  theme: ThemePrefs;
}

export interface ThemePrefs {
  configured: string;
  effective: string;
}

export interface Issue {
  number: number;
  title: string;
  url: string;
  labels?: string[];
  published_at: number;
  kind?: string;
  area?: string;
  difficulty?: string;
  mentor_available?: string;
  good_first_issue?: string;
  has_linked_prs?: boolean;
  project: Project;
  repository: Repository;
}

export interface MaintainersWanted {
  enabled: boolean;
  links?: MaintainersWantedLink[];
  contacts?: MaintainersWantedContact[];
}

export interface MaintainersWantedLink {
  title?: string;
  url: string;
}

export interface MaintainersWantedContact {
  github_handle: string;
}

export interface Project {
  name: string;
  display_name?: string;
  keywords?: string[];
  logo_url?: string;
  logo_dark_url?: string;
  devstats_url?: string;
  accepted_at?: number;
  maturity?: Maturity;
  foundation: Foundation;
  maintainers_wanted?: MaintainersWanted;
}

export interface Repository {
  name: string;
  homepage_url?: string;
  url: string;
  topics: string[];
  languages: string[];
  stars: number;
}

export enum FilterKind {
  Foundation = 'foundation',
  Maturity = 'maturity',
  Project = 'project',
  Kind = 'kind',
  Difficulty = 'difficulty',
  Area = 'area',
  Language = 'language',
}

export enum SortBy {
  MostRecent = 'most_recent',
  Relevance = 'relevance',
}

export interface Error {
  kind: ErrorKind;
  message?: string;
}

export enum ErrorKind {
  Other,
  NotFound,
}

export interface BasicQuery {
  ts_query_web?: string;
  filters?: {
    [key: string]: string[];
  };
  mentor_available?: boolean;
  good_first_issue?: boolean;
  no_linked_prs?: boolean;
}

export interface SearchQuery extends BasicQuery {
  limit: number;
  offset: number;
  sort_by: SortBy;
}

export interface SearchFiltersURL extends BasicQuery {
  pageNumber: number;
}

export interface SearchTipItem {
  content: JSX.Element | string;
  example: string;
}

export interface FiltersReponse {
  filters: Filter[];
  extra: FiltersExtra;
}

export interface Filter {
  title: string;
  key: string;
  options: FilterOption[];
}

export interface FiltersExtra {
  [FilterKind.Maturity]: {
    [key in Foundation]: string[];
  };
  [FilterKind.Project]: {
    [key in Foundation]: string[];
  };
}

export interface FilterOption {
  name: string;
  value: string;
  key?: string;
}
