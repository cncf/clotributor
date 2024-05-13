import classnames from 'classnames';
import { Loading, scrollToTop } from 'clo-ui';
import { isUndefined } from 'lodash';
import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import API from '../../api';
import { DEFAULT_SORT_BY } from '../../data';
import { Issue, OutletContext } from '../../types';
import Card from '../common/Card';
import Searchbar from '../navigation/Searchbar';
import styles from './Home.module.css';
import SearchTip from './SearchTip';

const Home = () => {
  const { setInvisibleFooter } = useOutletContext() as OutletContext;
  const [latestOpportunities, setLatestOpportunities] = useState<Issue[] | undefined>();
  const [loadingLatestOpportunities, setLoadingLatestOpportunities] = useState<boolean>(true);

  useEffect(() => {
    async function getLatestOpportunities() {
      scrollToTop();
      setInvisibleFooter(true);
      setLoadingLatestOpportunities(true);
      try {
        const opp = await API.searchIssues({
          limit: 10,
          offset: 0,
          sort_by: DEFAULT_SORT_BY,
        });
        setLatestOpportunities(opp.items);
      } catch {
        setLatestOpportunities([]);
      } finally {
        setLoadingLatestOpportunities(false);
        setInvisibleFooter(false);
      }
    }
    getLatestOpportunities();
  }, []);

  return (
    <>
      <div className={`p-4 p-md-5 mb-3 mb-md-4 text-center ${styles.banner}`}>
        <div className="container-lg px-0">
          <div className="d-block d-sm-none">
            <div className={styles.midFont}>Discover great opportunities to become</div>
            <div className={`mb-1 mb-sm-4 ${styles.bigFont}`}>
              a <span className="fw-bold extraLightText">Cloud Native</span> contributor
            </div>
          </div>

          <div className="d-none d-sm-block">
            <div className={styles.midFont}>Discover great opportunities to</div>
            <div className={`mb-1 mb-sm-4 ${styles.bigFont}`}>
              become a <span className="fw-bold lightText">Cloud Native</span> contributor
            </div>
          </div>

          <div className="py-4">
            <Searchbar bigSize inNavbar={false} />
            <SearchTip />
          </div>

          <div className="mx-3 mx-md-5 mt-2 mt-sm-3">
            <p className={`d-none d-sm-block px-0 px-md-5 mx-auto ${styles.legend}`}>
              You can search for <span className="fst-italic">projects</span> or{' '}
              <span className="fst-italic">technologies</span> you are interested in to find the opportunities that suit
              you the best, or{' '}
              <Link
                to="/search"
                type="button"
                className={`btn btn-link p-0 fw-bold text-decoration-underline text-dark ${styles.link}`}
              >
                explore all opportunities
              </Link>{' '}
              available.
            </p>
            <p className={`d-block d-sm-none px-0 mx-auto mb-1 ${styles.legend}`}>
              or{' '}
              <Link
                to="/search"
                type="button"
                className={`btn btn-link p-0 fw-bold text-decoration-underline text-dark ${styles.link}`}
              >
                explore all opportunities
              </Link>{' '}
              available
            </p>
          </div>
        </div>
      </div>

      <div className={classnames({ 'd-none': !isUndefined(latestOpportunities) && latestOpportunities.length === 0 })}>
        <div className="w-100 py-1 py-sm-4">
          <div className="h3 text-center text-dark mt-0 mt-sm-2 mb-1 mb-sm-5 fw-semibold">
            Latest opportunities <span className="d-none d-sm-inline-block">published</span>
          </div>

          <div className="container-lg px-sm-4 px-lg-0">
            <div
              className={`d-flex flex-wrap justify-content-center position-relative ${styles.latestOpportunitiesWrapper}`}
            >
              {loadingLatestOpportunities && <Loading transparentBg />}
              {!isUndefined(latestOpportunities) && (
                <>
                  <div className="pt-2 mb-3 mb-sm-5 row g-0 justify-content-center w-100" role="list">
                    {latestOpportunities.map((issue: Issue, index: number) => {
                      return <Card key={`issue_${issue.number}_${index}`} issue={issue} />;
                    })}
                  </div>
                  <div className="text-center mt-1 mt-sm-0 mb-4">
                    <Link
                      to="/search"
                      type="button"
                      className="btn btn-md rounded-0 btn-primary text-uppercase text-decoration-none"
                    >
                      Explore all
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
