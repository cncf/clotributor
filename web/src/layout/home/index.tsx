import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import API from '../../api';
import { DEFAULT_SORT_BY } from '../../data';
import { Issue } from '../../types';
import Card from '../common/Card';
import Searchbar from '../navigation/Searchbar';
import styles from './Home.module.css';
import SearchTip from './SearchTip';

interface Props {
  setScrollPosition: Dispatch<SetStateAction<number | undefined>>;
}

const Home = (props: Props) => {
  const [latestOpportunities, setLatestOpportunities] = useState<Issue[]>([]);

  useEffect(() => {
    async function getLatestOpportunities() {
      const opp = await API.searchIssues({
        limit: 10,
        offset: 0,
        sort_by: DEFAULT_SORT_BY,
      });
      setLatestOpportunities(opp.items);
    }
    getLatestOpportunities();
  }, []);

  return (
    <>
      <div className={`p-4 p-md-5 mb-4 text-center ${styles.banner}`}>
        <div className="container-lg px-0">
          <div className={styles.midFont}>Discover great opportunities to</div>
          <div className={`mb-4 ${styles.bigFont}`}>
            become a <span className="fw-bold extraLightText">Cloud Native</span> contributor
          </div>

          <div className="py-4">
            <Searchbar bigSize setScrollPosition={props.setScrollPosition} inNavbar={false} />
            <SearchTip />
          </div>

          <div className="mx-3 mx-md-5 mt-3">
            <p className={`px-0 px-md-5 mx-auto ${styles.legend}`}>
              You can search for <span className="fst-italic">software categories</span> you are intested in or{' '}
              <span className="fst-italic">languages</span> you are familiar with to find the opportunities that suit
              you the best. You can also{' '}
              <Link
                to="/search"
                type="button"
                className={`btn btn-link p-0 fw-bold text-decoration-underline text-dark ${styles.link}`}
              >
                explore all opportunities
              </Link>{' '}
              available.
            </p>
          </div>
        </div>
      </div>

      {latestOpportunities.length > 0 && (
        <div>
          <div className="w-100 py-4">
            <div className="h3 fw-bold text-center text-dark mt-3 mt-md-2 mb-4">Latest opportunities published</div>

            <div className="container-lg px-sm-4 px-lg-0">
              <div className="d-flex flex-wrap justify-content-center">
                <div className="pt-2 mb-5 row g-0 justify-content-center w-100" role="list">
                  {latestOpportunities.map((issue: Issue, index: number) => {
                    return <Card key={`issue_${issue.number}_${index}`} issue={issue} />;
                  })}
                </div>

                <div className="text-center mb-5">
                  <Link
                    to="/search"
                    type="button"
                    className="btn btn-md rounded-0 btn-primary text-uppercase text-decoration-none"
                  >
                    Explore all
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
