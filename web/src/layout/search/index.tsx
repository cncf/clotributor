import classNames from 'classnames';
import { FilterSection, Loading, NoData, Pagination, PaginationLimitOptions, Sidebar, SortOptions } from 'clo-ui';
import { isEmpty, isUndefined } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { FaFilter } from 'react-icons/fa';
import { IoMdCloseCircleOutline } from 'react-icons/io';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

import API from '../../api';
import { AppContext, updateLimit, updateSort } from '../../context/AppContextProvider';
import { DEFAULT_SORT_BY, SORT_OPTIONS } from '../../data';
import { Issue, OutletContext, SearchFiltersURL, SortBy } from '../../types';
import buildSearchParams from '../../utils/buildSearchParams';
import prepareQueryString from '../../utils/prepareQueryString';
import scrollToTop from '../../utils/scrollToTop';
import Card from '../common/Card';
import Filters from './Filters';
import FiltersInLine from './FiltersInLine';
import styles from './Search.module.css';

interface FiltersProp {
  [key: string]: string[];
}

const Search = () => {
  const navigate = useNavigate();
  const { ctx, dispatch } = useContext(AppContext);
  const { limit, sort } = ctx.prefs.search;
  const [searchParams] = useSearchParams();
  const { setInvisibleFooter } = useOutletContext() as OutletContext;
  const [text, setText] = useState<string | undefined>();
  const [mentorAvailable, setMentorAvailable] = useState<boolean>(false);
  const [goodFirstIssue, setGoodFirstIssue] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterSection[] | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<FiltersProp>({});
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [issues, setIssues] = useState<Issue[] | null | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // Check if some filters are active
  const ifActiveFilters = !isEmpty(activeFilters) || mentorAvailable || goodFirstIssue;

  const onResetFilters = (): void => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        pageNumber: 1,
        ts_query_web: text,
        filters: {},
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
        switch (name) {
          case 'project':
            additionalChanges = { foundation: [], maturity: [] };
            break;
          case 'foundation':
          case 'maturity':
            additionalChanges = { project: [] };
            break;
          default:
            break;
        }
      } else {
        newFilters = newFilters.filter((el) => el !== value);
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

  const updateCurrentPage = (searchChanges: any) => {
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
      ts_query_web: text,
      filters: activeFilters,
    };
  };

  const calculateOffset = (pNumber: number): number => {
    return pNumber && limit ? (pNumber - 1) * limit : 0;
  };

  useEffect(() => {
    async function getIssuesFilters() {
      setIsLoading(true);
      setInvisibleFooter(true);
      scrollToTop();

      try {
        setFilters(await API.getIssuesFilters());
      } catch {
        setFilters([]);
      }
    }
    getIssuesFilters();
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    const formattedParams = buildSearchParams(searchParams);
    setText(formattedParams.ts_query_web);
    setMentorAvailable(formattedParams.mentor_available || false);
    setGoodFirstIssue(formattedParams.good_first_issue || false);
    setActiveFilters(formattedParams.filters || {});
    setPageNumber(formattedParams.pageNumber);

    async function searchIssues() {
      setIsLoading(true);
      setInvisibleFooter(true);
      scrollToTop();

      try {
        const newSearchResults = await API.searchIssues({
          ts_query_web: formattedParams.ts_query_web,
          mentor_available: formattedParams.mentor_available || false,
          good_first_issue: formattedParams.good_first_issue || false,
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

    // prettier-ignore
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [searchParams, limit, sort.by]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      {/* Subnavbar */}
      <nav className={`navbar navbar-expand-sm ${styles.navbar}`} role="navigation">
        <div className="container-lg">
          <div className="d-flex flex-column w-100">
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between flex-nowrap">
              <div className="d-flex flex-row flex-lg-column align-items-center align-items-lg-start w-100 text-truncate">
                {!isUndefined(filters) && filters.length > 0 && (
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
                        filters={filters}
                        activeFilters={activeFilters}
                        mentorAvailable={mentorAvailable}
                        goodFirstIssue={goodFirstIssue}
                        onChange={onFiltersChange}
                        visibleTitle={false}
                      />
                    </div>
                  </Sidebar>
                )}

                <div className="text-truncate fw-bold w-100 Search_searchResults__hU0s2" role="status">
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
                </div>
              </div>

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
                <PaginationLimitOptions limit={limit} onPaginationLimitChange={onPaginationLimitChange} />
              </div>
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
              activeFilters={activeFilters}
              onChange={onFiltersChange}
              onResetFilters={onResetFilters}
              mentorAvailable={mentorAvailable}
              goodFirstIssue={goodFirstIssue}
              isLoadingFilters={isUndefined(filters)}
              device="desktop"
              ifActiveFilters={ifActiveFilters}
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
