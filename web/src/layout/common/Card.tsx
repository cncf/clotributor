import { Card as CardWrapper, ExternalLink, FoundationBadge, GenericBadge, Image, MaturityBadge } from 'clo-ui';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { BsDot } from 'react-icons/bs';
import { FaChartBar, FaGithub } from 'react-icons/fa';
import { FiExternalLink, FiStar } from 'react-icons/fi';
import { GoCalendar } from 'react-icons/go';

import { Issue } from '../../types';
import prettifyNumber from '../../utils/prettifyNumber';
import removeEmojis from '../../utils/removeEmojis';
import removeLastDot from '../../utils/removeLastDot';
import styles from './Card.module.css';

interface Props {
  issue: Issue;
}

const Card = (props: Props) => {
  const [isGoodFirstIssue, setIsGoodFirstIssue] = useState<boolean>(false);
  const [isBug, setIsBug] = useState<boolean>(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  useEffect(() => {
    function cleanTopics() {
      const lowerLanguages = props.issue.repository.languages.map((lg: string) => {
        return lg.toLowerCase();
      });

      const topics: string[] = [];
      props.issue.repository.topics.forEach((topic: string) => {
        if (!lowerLanguages.includes(topic.toLowerCase())) {
          topics.push(topic);
        }
      });

      setAvailableTopics(topics);
    }

    function checkIfSpecialIssue() {
      if (props.issue.labels) {
        const lowerLabels = props.issue.labels.map((lg: string) => {
          return lg.toLowerCase();
        });
        if (lowerLabels.includes('good first issue')) {
          setIsGoodFirstIssue(true);
        }
        for (let index = 0; index < lowerLabels.length; index++) {
          if (lowerLabels[index].includes('bug')) {
            setIsBug(true);
          }
        }
      }
    }

    cleanTopics();
    checkIfSpecialIssue();
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <CardWrapper wrapperClassname={styles.cardWrapper} hoverable={false}>
      <div className="d-flex flex-row align-items-stretch">
        <div className={`d-flex flex-column flex-sm-row align-items-center ps-3 ${styles.projectWrapper}`}>
          <div className={`d-none d-xl-flex align-items-center justify-content-center ${styles.imageWrapper}`}>
            <Image
              alt={`${props.issue.project.display_name || props.issue.project.name} logo`}
              url={props.issue.project.logo_url}
            />
          </div>
          <div className="flex-grow-1 ms-0 ms-md-3 ms-lg-0 ms-xl-3 w-100 truncateWrapper">
            <div className="p-2 pe-0">
              <div className="d-flex flex-row align-items-center">
                <div
                  className={`d-flex d-xl-none align-items-center justify-content-center me-3 ${styles.miniImageWrapper}`}
                >
                  <Image
                    alt={`${props.issue.project.display_name || props.issue.project.name} logo`}
                    url={props.issue.project.logo_url}
                  />
                </div>
                <div className="d-flex flex-column w-100 truncateWrapper">
                  {props.issue.repository.homepage_url ? (
                    <ExternalLink label="Project url" href={props.issue.repository.homepage_url}>
                      <div className="d-flex flex-row justify-content-between align-items-end text-truncate">
                        <span className={`text-truncate fw-bold mb-0 ${styles.title}`}>
                          {props.issue.project.display_name || props.issue.project.name}
                        </span>
                      </div>
                    </ExternalLink>
                  ) : (
                    <div className="d-flex flex-row justify-content-between align-items-end text-truncate">
                      <span className={`text-truncate fw-bold mb-0 ${styles.title}`}>
                        {props.issue.project.display_name || props.issue.project.name}
                      </span>
                    </div>
                  )}

                  <div className="d-flex flex-row align-items-center my-2">
                    <FoundationBadge foundation={props.issue.project.foundation} />
                    <MaturityBadge maturityLevel={props.issue.project.maturity} className="d-none d-md-flex ms-2" />
                  </div>

                  <div
                    className={`d-none d-md-flex d-lg-none d-xl-flex flex-row mt-0 mt-md-1 mt-lg-0 mt-xl-1 align-items-center ${styles.info}`}
                  >
                    {props.issue.project.devstats_url && (
                      <ExternalLink label="Dev stats link" href={props.issue.project.devstats_url} className="me-3">
                        <div className={`d-flex flex-row align-items-center text-muted ${styles.link}`}>
                          <FaChartBar className={styles.statsIcon} />
                        </div>
                      </ExternalLink>
                    )}

                    <div className={`d-flex flex-row align-items-center ${styles.subtitle} ${styles.wrapperCalendar}`}>
                      <GoCalendar className={`me-1 text-muted ${styles.calendarIcon}`} />
                      <div>{moment(props.issue.project.accepted_at, 'YYYY-MM-DD').format('YYYY')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex-grow-1 p-3 text-muted ${styles.issueContent}`}>
          <div className="d-flex flex-column">
            <div className="d-flex flex-row align-items-center justify-content-between">
              <div className={`d-flex flex-row align-items-baseline ${styles.repoInfo}`}>
                <ExternalLink
                  className={`btn btn-link p-0 ${styles.repoLink}`}
                  label={`Repo ${props.issue.repository.name} link`}
                  href={props.issue.repository.url}
                >
                  <div className="d-flex flex-row align-items-center">
                    <FaGithub className="me-2" />
                    <div
                      className={`text-uppercase text-nowrap fw-bold text-truncate position-relative ${styles.repoName}`}
                    >
                      {props.issue.repository.name}
                    </div>
                    <FiExternalLink className="ms-2" />
                  </div>
                </ExternalLink>

                <div className={`d-flex lex-row align-items-center ms-3 me-2 ${styles.star}`}>
                  <FiStar className="me-1" />
                  <div>{prettifyNumber(props.issue.repository.stars)}</div>
                </div>
              </div>

              <div className={`d-flex flex-row flex-wrap overflow-hidden justify-content-end ${styles.topicsWrapper}`}>
                {availableTopics.slice(0, 4).map((lg: string) => {
                  return (
                    <GenericBadge content={lg} className={`text-secondary lighterText ${styles.badge} ms-2`} key={lg} />
                  );
                })}
              </div>
            </div>

            <div>
              <ExternalLink
                label="Issue url"
                href={props.issue.url}
                className="position-relative d-inline-block mw-100"
              >
                <div className="d-flex flex-row align-items-center my-3 w-100">
                  <div className={`fw-bold text-truncate ${styles.issueDesc}`}>
                    {removeLastDot(removeEmojis(props.issue.title))}
                  </div>
                  <FiExternalLink className="ms-2" />
                </div>
              </ExternalLink>
            </div>

            <div className={`d-flex flex-row align-items-center flex-nowrap ${styles.moreInfo}`}>
              <small className="text-muted text-nowrap">
                {moment.unix(props.issue.published_at!).format('Do MMM YYYY')}
              </small>

              <BsDot className="mx-1" />

              <ExternalLink label="Issue url" href={props.issue.url}>
                <small className="fw-normal">#{props.issue.number}</small>
              </ExternalLink>

              {(isGoodFirstIssue || isBug) && (
                <>
                  <BsDot className="mx-1" />

                  {isGoodFirstIssue && (
                    <GenericBadge
                      content="Good first issue"
                      className={`mx-1 text-uppercase bg-green ${styles.badge} lighterText`}
                    />
                  )}

                  {isBug && (
                    <GenericBadge content="Bug" className={`ms-1 text-uppercase bg-red ${styles.badge} lighterText`} />
                  )}
                </>
              )}

              {props.issue.repository.languages.length > 0 && (
                <div
                  className={`ms-auto d-flex flex-row flex-wrap overflow-hidden justify-content-end ${styles.languagesWrapper}`}
                >
                  {props.issue.repository.languages.map((label: string) => {
                    return (
                      <GenericBadge
                        content={label}
                        className={`fw-normal text-secondary lighterText text-uppercase ms-2 bg-purple ${styles.badge}`}
                        key={`label_${props.issue.number}_${label}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};

export default Card;
