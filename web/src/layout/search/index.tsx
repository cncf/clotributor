import classNames from 'classnames';
import {
  FilterOption,
  FilterSection,
  Foundation,
  Loading,
  NoData,
  Pagination,
  PaginationLimitOptions,
  scrollToTop,
  Sidebar,
  SortOptions,
} from 'clo-ui';
import { isEmpty, isNull, isUndefined } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { FaFilter } from 'react-icons/fa';
import { IoMdCloseCircleOutline } from 'react-icons/io';
import { useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

import API from '../../api';
import { AppContext, updateLimit, updateSort } from '../../context/AppContextProvider';
import { DEFAULT_SORT_BY, SORT_OPTIONS } from '../../data';
import { FilterKind, FiltersExtra, Issue, OutletContext, SearchFiltersURL, SortBy } from '../../types';
import buildSearchParams from '../../utils/buildSearchParams';
import prepareQueryString from '../../utils/prepareQueryString';
import Card from '../common/Card';
import Filters from './Filters';
import FiltersInLine from './FiltersInLine';
import styles from './Search.module.css';

interface FiltersProp {
  [key: string]: string[];
}

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ctx, dispatch } = useContext(AppContext);
  const { limit, sort } = ctx.prefs.search;
  const isEmbed = ctx.isEmbed;
  const [searchParams] = useSearchParams();
  const { setInvisibleFooter } = useOutletContext() as OutletContext;
  const [text, setText] = useState<string | undefined>();
  const [mentorAvailable, setMentorAvailable] = useState<boolean>(false);
  const [goodFirstIssue, setGoodFirstIssue] = useState<boolean>(false);
  const [noLinkedPRs, setNoLinkedPRs] = useState<boolean>(false);
  const [fullFilters, setFullFilters] = useState<FilterSection[] | undefined>(undefined);
  const [cleanFilters, setCleanFilters] = useState<FilterSection[] | undefined>(undefined);
  const [filters, setFilters] = useState<FilterSection[] | undefined>(undefined);
  const [filtersExtra, setFiltersExtra] = useState<FiltersExtra | undefined>();
  const [activeFilters, setActiveFilters] = useState<FiltersProp>({});
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [issues, setIssues] = useState<Issue[] | null | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedFoundation, setSelectedFoundation] = useState<Foundation | null>(null);
  // Check if some filters are active
  let ifActiveFilters = !isEmpty(activeFilters) || mentorAvailable || goodFirstIssue;
  if (isEmbed) {
    const filtersWithoutFoundation = { ...activeFilters };
    delete filtersWithoutFoundation[FilterKind.Foundation];

    ifActiveFilters = !isEmpty(filtersWithoutFoundation) || mentorAvailable || goodFirstIssue || noLinkedPRs;
  }

  const getExtraFilter = () => {
    if (isEmbed) {
      // Scroll to top to reset filters
      document.getElementById('clo-wrapper')!.scrollTop = 0;
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.has(FilterKind.Foundation) && !isNull(searchParams.get(FilterKind.Foundation))) {
        return { [FilterKind.Foundation]: [searchParams.get(FilterKind.Foundation)!] };
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  };

  const onResetFilters = (): void => {
    setSelectedFoundation(null);
    setFilters(cleanFilters);
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        pageNumber: 1,
        ts_query_web: text,
        filters: { ...getExtraFilter() },
      }),
    });
  };

  const onFiltersChange = (name: string, value: string, checked: boolean, type?: string): void => {
    if (!isUndefined(type)) {
      onFilterTypeChange(name, value, checked, type);
    } else {
      const currentFilters = activeFilters || {};
      let additionalChanges = {};
      let newFilters = isUndefined(currentFilters[name]) ? [] : currentFilters[name].slice();
      if (checked) {
        newFilters.push(value);
        if (name === FilterKind.Foundation) {
          if (newFilters.length > 1) {
            additionalChanges = { project: [], maturity: [] };
          }
        }
      } else {
        newFilters = newFilters.filter((el) => el !== value);
        if (name === FilterKind.Foundation) {
          if (newFilters.length !== 1) {
            additionalChanges = { project: [], maturity: [] };
          }
        }
      }

      updateCurrentPage({
        filters: { ...currentFilters, [name]: newFilters, ...additionalChanges },
      });
    }
  };

  const onPaginationLimitChange = (newLimit: number): void => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        ...getCurrentFilters(),
        pageNumber: 1,
      }),
    });
    dispatch(updateLimit(newLimit));
  };

  const onFilterTypeChange = (name: string, value: string, checked: boolean, type: string): void => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        ...getCurrentFilters(),
        [name]: type === 'boolean' ? checked : value,
        pageNumber: 1,
      }),
    });
  };

  const onSortChange = (by: string): void => {
    // Load pageNumber is forced before update Sorting criteria
    navigate(
      {
        pathname: '/search',
        search: prepareQueryString({
          ...getCurrentFilters(),
          pageNumber: 1,
        }),
      },
      { replace: true }
    );
    dispatch(updateSort(by as SortBy));
  };

  const onPageNumberChange = (pNumber: number): void => {
    updateCurrentPage({
      pageNumber: pNumber,
    });
  };

  const updateCurrentPage = (searchChanges: object) => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        ...getCurrentFilters(),
        pageNumber: 1,
        ...searchChanges,
      }),
    });
  };

  const getCurrentFilters = (): SearchFiltersURL => {
    return {
      pageNumber: pageNumber,
      mentor_available: mentorAvailable,
      good_first_issue: goodFirstIssue,
      no_linked_prs: noLinkedPRs,
      ts_query_web: text,
      filters: { ...activeFilters, ...getExtraFilter() },
    };
  };

  const calculateOffset = (pNumber: number): number => {
    return pNumber && limit ? (pNumber - 1) * limit : 0;
  };

  const prepareFilters = (foundation: Foundation, allFilters?: FilterSection[], extra?: FiltersExtra) => {
    const currentFilters = !isUndefined(allFilters) ? [...allFilters] : [];
    if (foundation && !isUndefined(extra)) {
      [FilterKind.Maturity, FilterKind.Project].forEach((k: FilterKind) => {
        const kind = k as FilterKind.Project | FilterKind.Maturity;
        const objIndex = currentFilters.findIndex((f: FilterSection) => (f.key || f.title) === k);
        const values = extra[kind][foundation];
        let activeValues:
          | FilterOption[]
          | {
              [key: string]: FilterOption[];
            } = [];
        if (!isUndefined(values)) {
          activeValues = (currentFilters[objIndex].options as FilterOption[]).filter((opt: FilterOption) =>
            values.includes(opt.value || opt.name)
          );
        }
        currentFilters[objIndex] = { ...currentFilters[objIndex], options: activeValues };
      });
    }
    setFilters(currentFilters);
  };

  const cleanFullFilters = (f: FilterSection[]): FilterSection[] => {
    const tmpFilters = [...f];
    [FilterKind.Maturity, FilterKind.Project].forEach((k: FilterKind) => {
      const objIndex = tmpFilters.findIndex((f: FilterSection) => (f.key || f.title) === k);
      tmpFilters[objIndex] = { ...tmpFilters[objIndex], options: [] };
    });
    return tmpFilters;
  };

  const getResultsText = () => {
    return (
      <>
        {total > 0 && (
          <span className="pe-1">
            {calculateOffset(pageNumber) + 1} - {total < limit * pageNumber ? total : limit * pageNumber}{' '}
            <span className="ms-1">of</span>{' '}
          </span>
        )}
        {total}
        <span className="ps-1"> results </span>
        {text && text !== '' && (
          <span className="d-none d-sm-inline ps-1">
            for "<span className="fw-bold">{text}</span>"
          </span>
        )}
      </>
    );
  };

  useEffect(() => {
    async function getIssuesFilters() {
      setIsLoading(true);
      setInvisibleFooter(true);
      scrollToTop();

      try {
        const response = await API.getIssuesFilters();
        setFilters(response.filters);
        setFullFilters(response.filters);
        setCleanFilters(cleanFullFilters(response.filters));
        setFiltersExtra(response.extra);

        const selectedFoundations = searchParams.getAll('foundation');
        if (selectedFoundations.length === 1) {
          prepareFilters(selectedFoundations[0] as Foundation, response.filters, response.extra);
        }
      } catch {
        setFilters([]);
      }
    }
    getIssuesFilters();
  }, []);

  useEffect(() => {
    const formattedParams = buildSearchParams(searchParams);
    setText(formattedParams.ts_query_web);
    setMentorAvailable(formattedParams.mentor_available || false);
    setGoodFirstIssue(formattedParams.good_first_issue || false);
    setNoLinkedPRs(formattedParams.no_linked_prs || false);
    setActiveFilters(formattedParams.filters || {});
    setPageNumber(formattedParams.pageNumber);

    const foundationActive: Foundation | null =
      !isUndefined(formattedParams.filters) &&
      formattedParams.filters[FilterKind.Foundation] &&
      formattedParams.filters[FilterKind.Foundation].length === 1
        ? (formattedParams.filters[FilterKind.Foundation][0] as Foundation)
        : null;

    if (foundationActive) {
      prepareFilters(foundationActive, fullFilters, filtersExtra);
      setSelectedFoundation(foundationActive);
    } else {
      setFilters(cleanFilters);
      setSelectedFoundation(null);
    }

    async function searchIssues() {
      setIsLoading(true);
      setInvisibleFooter(true);
      scrollToTop();

      try {
        const newSearchResults = await API.searchIssues({
          ts_query_web: formattedParams.ts_query_web,
          mentor_available: formattedParams.mentor_available || false,
          good_first_issue: formattedParams.good_first_issue || false,
          no_linked_prs: formattedParams.no_linked_prs || false,
          sort_by: sort.by,
          filters: formattedParams.filters || {},
          offset: calculateOffset(formattedParams.pageNumber),
          limit: limit,
        });
        setTotal(parseInt(newSearchResults['Pagination-Total-Count']));
        setIssues(newSearchResults.items);
      } catch {
        setApiError('An error occurred searching issues.');
      } finally {
        setIsLoading(false);
        setInvisibleFooter(false);
      }
    }

    // When a new text is searched, sort.by is updated to default before searching
    if (text !== formattedParams.ts_query_web && sort.by !== DEFAULT_SORT_BY) {
      dispatch(updateSort(DEFAULT_SORT_BY));
    } else {
      searchIssues();
    }
  }, [searchParams, limit, sort.by]);

  return (
    <>
      {/* Subnavbar */}
      <nav
        className={classNames(
          'navbar navbar-expand-sm',
          styles.navbar,
          { 'd-block d-lg-none': isEmbed },
          { 'd-block': !isEmbed }
        )}
        role="navigation"
      >
        <div className="container-lg">
          <div className="d-flex flex-column w-100">
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between flex-nowrap">
              <div className="d-flex flex-row flex-lg-column align-items-center align-items-lg-start w-100 text-truncate">
                <Sidebar
                  label="Filters"
                  className="d-inline-block d-lg-none me-2"
                  wrapperClassName="d-inline-block px-4"
                  buttonType={classNames(
                    'btn-primary btn-sm rounded-circle position-relative',
                    styles.btnMobileFilters,
                    { [styles.filtersBadge]: ifActiveFilters }
                  )}
                  buttonIcon={<FaFilter />}
                  closeButtonClassName={styles.closeSidebar}
                  closeButton={
                    <>
                      {isLoading ? (
                        <>
                          <Loading spinnerClassName={styles.spinner} noWrapper smallSize />
                          <span className="ms-2">Searching...</span>
                        </>
                      ) : (
                        <>See {total} results</>
                      )}
                    </>
                  }
                  leftButton={
                    <>
                      {ifActiveFilters && (
                        <div className="d-flex align-items-center">
                          <IoMdCloseCircleOutline className={`text-dark ${styles.resetBtnDecorator}`} />
                          <button
                            className="btn btn-link btn-sm p-0 ps-1 text-dark"
                            onClick={onResetFilters}
                            aria-label="Reset filters"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </>
                  }
                  header={<div className="h6 text-uppercase mb-0 flex-grow-1">Filters</div>}
                >
                  <div role="menu">
                    <Filters
                      device="mobile"
                      filters={filters || []}
                      disabledSections={isNull(selectedFoundation) ? [FilterKind.Maturity, FilterKind.Project] : []}
                      activeFilters={activeFilters}
                      mentorAvailable={mentorAvailable}
                      goodFirstIssue={goodFirstIssue}
                      noLinkedPRs={noLinkedPRs}
                      onChange={onFiltersChange}
                      visibleTitle={false}
                    />
                  </div>
                </Sidebar>

                <div className="text-truncate fw-bold w-100" role="status">
                  {getResultsText()}
                </div>
              </div>

              {!isEmbed && (
                <div className="d-flex flex-nowrap flex-row justify-content-sm-end ms-0 ms-md-3 w-100">
                  {/* Only display sort options when ts_query_web is defined */}
                  {text && text !== '' && (
                    <SortOptions
                      options={SORT_OPTIONS}
                      by={sort.by}
                      width={150}
                      onSortChange={onSortChange}
                      className="mt-3 mt-sm-0"
                    />
                  )}
                  <div className="ms-2 ms-md-m4">
                    <PaginationLimitOptions limit={limit} onPaginationLimitChange={onPaginationLimitChange} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Filters */}
      <nav
        className={classNames('d-none d-lg-block navbar navbar-expand-sm', styles.filtersNavbar, {
          'd-none': !isUndefined(filters) && filters.length === 0,
        })}
        role="navigation"
      >
        <div className="container-lg h-100">
          <div className="d-flex flex-column w-100">
            <FiltersInLine
              filters={filters || []}
              disabledSections={isNull(selectedFoundation) ? [FilterKind.Maturity, FilterKind.Project] : []}
              activeFilters={activeFilters}
              onChange={onFiltersChange}
              onResetFilters={onResetFilters}
              mentorAvailable={mentorAvailable}
              goodFirstIssue={goodFirstIssue}
              noLinkedPRs={noLinkedPRs}
              isLoadingFilters={isUndefined(filters)}
              device="desktop"
              ifActiveFilters={ifActiveFilters}
              extraContent={
                isEmbed ? (
                  <div className={`text-truncate fw-bold ${styles.resultsInEmbed}`}>{getResultsText()}</div>
                ) : undefined
              }
            />
          </div>
        </div>
      </nav>

      <main role="main" className="container-lg flex-grow-1 mb-5">
        {isLoading && <Loading className={styles.loading} position="fixed" transparentBg />}
        <div
          className={classNames('h-100 position-relative d-flex flex-row align-items-start', {
            'opacity-75': isLoading,
          })}
        >
          <div className="w-100">
            {apiError && (
              <NoData className={styles.extraMargin}>
                <div className="mb-4 mb-lg-5 h2">{apiError}</div>
                <p className="h5 mb-0">Please try again later.</p>
              </NoData>
            )}

            {issues && (
              <>
                {isEmpty(issues) ? (
                  <NoData>
                    <div className="h4">
                      We're sorry!
                      <p className="h6 mb-0 mt-3 lh-base">
                        <span> We can't seem to find any issues that match your search </span>
                        {text && (
                          <span className="ps-1">
                            for "<span className="fw-bold">{text}</span>"
                          </span>
                        )}
                        {!isEmpty(activeFilters) ? <span className="ps-1">with the selected filters</span> : <>.</>}
                      </p>
                      <p className="h6 mb-0 mt-5 lh-base">
                        You can{' '}
                        {!isEmpty(activeFilters) ? (
                          <button
                            className="btn btn-link text-dark fw-bold py-0 pb-1 px-0"
                            onClick={onResetFilters}
                            aria-label="Reset filters"
                          >
                            <u>reset the filters</u>
                          </button>
                        ) : (
                          <button
                            className="btn btn-link text-dark fw-bold py-0 pb-1 px-0"
                            onClick={() => {
                              navigate({
                                pathname: '/search',
                                search: prepareQueryString({
                                  pageNumber: 1,
                                  filters: {},
                                }),
                              });
                            }}
                            aria-label="Browse all issues"
                          >
                            <u>browse all issues</u>
                          </button>
                        )}
                        <> or try a new search.</>
                      </p>
                    </div>
                  </NoData>
                ) : (
                  <div className={`row g-0 w-100 ${styles.list}`} role="list">
                    {issues.map((issue: Issue, index: number) => {
                      return <Card key={`issue_${issue.number}_${index}`} issue={issue} />;
                    })}
                  </div>
                )}
              </>
            )}

            <div className="mt-auto mx-auto">
              <Pagination
                limit={limit}
                offset={0}
                total={total}
                active={pageNumber}
                className="mt-4 mt-md-5 mb-0 mb-md-2"
                onChange={onPageNumberChange}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Search;
