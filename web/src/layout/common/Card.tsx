import classNames from 'classnames';
import { Card as CardWrapper, ExternalLink, FoundationBadge, GenericBadge, Image, MaturityBadge } from 'clo-ui';
import { isUndefined } from 'lodash';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { BsDot } from 'react-icons/bs';
import { FaChartBar, FaGithub } from 'react-icons/fa';
import { FiExternalLink, FiStar } from 'react-icons/fi';
import { GoCalendar } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';

import { FilterKind, Issue } from '../../types';
import prepareQueryString from '../../utils/prepareQueryString';
import prettifyNumber from '../../utils/prettifyNumber';
import removeEmojis from '../../utils/removeEmojis';
import removeLastDot from '../../utils/removeLastDot';
import styles from './Card.module.css';

interface Props {
  issue: Issue;
}

const Card = (props: Props) => {
  const navigate = useNavigate();
  const [isGoodFirstIssue, setIsGoodFirstIssue] = useState<boolean>(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const searchByText = (text: string) => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        pageNumber: 1,
        ts_query_web: text.toLowerCase(),
        filters: {},
      }),
    });
  };

  const searchByFilter = (filter: FilterKind, value: string) => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        pageNumber: 1,
        filters: { [filter]: [value] },
      }),
    });
  };

  const searchByMentor = () => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        pageNumber: 1,
        mentor_available: true,
        filters: {},
      }),
    });
  };

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
      }
    }

    cleanTopics();
    checkIfSpecialIssue();
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <CardWrapper wrapperClassname={styles.cardWrapper} hoverable={false}>
      <div className="d-flex flex-column flex-md-row align-items-stretch">
        <div
          className={`d-flex flex-row justify-content-between align-items-center d-md-none ${styles.smProjectWrapper}`}
        >
          <div className="flex-grow-1 d-flex flex-row align-items-center truncateWrapper">
            <div
              className={`d-flex d-xl-none align-items-center justify-content-center me-2 ${styles.miniImageWrapper}`}
            >
              <Image
                alt={`${props.issue.project.display_name || props.issue.project.name} logo`}
                url={props.issue.project.logo_url}
              />
            </div>
            <div className="truncateWrapper w-100">
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
            </div>
          </div>

          <div className="d-flex flex-row align-items-center ms-2">
            <MaturityBadge maturityLevel={props.issue.project.maturity} className="d-none d-sm-flex me-2" />
            <FoundationBadge foundation={props.issue.project.foundation} />
          </div>
        </div>

        <div className={`d-none d-md-flex flex-column flex-sm-row align-items-center ps-3 ${styles.projectWrapper}`}>
          <div className={`d-none d-xl-flex align-items-center justify-content-center ${styles.imageWrapper}`}>
            <Image
              alt={`${props.issue.project.display_name || props.issue.project.name} logo`}
              url={props.issue.project.logo_url}
            />
          </div>
          <div className="ms-0 ms-xl-3 flex-grow-1 w-100 truncateWrapper">
            <div className="p-0 p-xl-2 pe-xl-0">
              <div className="d-flex flex-row align-items-center">
                <div className="d-flex flex-column w-100 truncateWrapper">
                  <div className="d-flex flex-row w-100 truncateWrapper">
                    <div
                      className={`d-flex d-xl-none align-items-center justify-content-center me-2 ${styles.miniImageWrapper}`}
                    >
                      <Image
                        alt={`${props.issue.project.display_name || props.issue.project.name} logo`}
                        url={props.issue.project.logo_url}
                      />
                    </div>
                    <div className="truncateWrapper">
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
                    </div>
                  </div>

                  <div className="d-flex flex-row align-items-center my-2">
                    <FoundationBadge foundation={props.issue.project.foundation} />
                    <MaturityBadge maturityLevel={props.issue.project.maturity} className="ms-2" />
                  </div>

                  <div className={`d-none d-md-flex flex-row mt-0 mt-md-1 align-items-center ${styles.info}`}>
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
                <div className="d-flex d-sm-none text-truncate">
                  <div className="d-flex flex-row align-items-center text-truncate">
                    <FaGithub className="me-2" />
                    <div
                      className={`text-uppercase text-nowrap fw-bold text-truncate position-relative ${styles.repoName}`}
                    >
                      {props.issue.repository.name}
                    </div>
                    <FiExternalLink className="d-none d-md-block ms-2" />
                  </div>
                </div>
                <ExternalLink
                  className={`d-none d-sm-flex btn btn-link p-0 ${styles.repoLink}`}
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
                    <FiExternalLink className="d-none d-md-block ms-2" />
                  </div>
                </ExternalLink>

                <div className={`d-flex flex-row align-items-center ms-3 me-2 ${styles.star}`}>
                  <FiStar className="me-1" />
                  <div>{prettifyNumber(props.issue.repository.stars)}</div>
                </div>
              </div>

              <div
                className={`d-none d-sm-flex flex-row flex-wrap overflow-hidden justify-content-end ${styles.topicsWrapper}`}
              >
                {availableTopics.slice(0, 4).map((lg: string) => {
                  return (
                    <GenericBadge
                      content={lg}
                      className={`text-secondary lighterText ${styles.badge} ms-2`}
                      key={lg}
                      onClick={() => searchByText(lg)}
                    />
                  );
                })}
              </div>
            </div>

            <ExternalLink
              label="Issue url"
              href={props.issue.url}
              className={`position-relative d-block d-md-none mw-100 my-3 text-decoration-none ${styles.linkMobile}`}
            >
              <div className={`fw-bold text-start text-truncate ${styles.issueDesc}`}>
                {removeLastDot(removeEmojis(props.issue.title))}
              </div>
            </ExternalLink>

            <div className="d-none d-md-flex flex-row align-items-center">
              <div className="d-flex truncateWrapper">
                <ExternalLink
                  label="Issue url"
                  href={props.issue.url}
                  className="position-relative d-inline-block mw-100 my-3"
                  visibleExternalIcon
                >
                  <div className={`fw-bold text-start text-truncate ${styles.issueDesc}`}>
                    {removeLastDot(removeEmojis(props.issue.title))}
                  </div>
                </ExternalLink>
              </div>

              {props.issue.mentor_available && (
                <div className="d-none d-xl-flex">
                  <GenericBadge
                    content="Mentor available"
                    className={classNames(
                      'ms-3 text-uppercase bg-solid-yellow',
                      styles.badge,
                      styles.mentorBadge,
                      'lighterText'
                    )}
                    onClick={searchByMentor}
                  />
                </div>
              )}
            </div>

            <div className={`d-flex flex-row align-items-center flex-nowrap ${styles.moreInfo}`}>
              <small className="text-muted text-nowrap">
                {moment.unix(props.issue.published_at!).format('Do MMM YYYY')}
              </small>

              <div className="d-none d-sm-flex flex-row align-items-center">
                <BsDot className="mx-1" />

                <ExternalLink label="Issue url" href={props.issue.url}>
                  <small className="fw-normal">#{props.issue.number}</small>
                </ExternalLink>
              </div>

              {(isGoodFirstIssue || props.issue.kind || props.issue.difficulty) && (
                <div className="d-flex flex-row align-items-center ms-auto ms-sm-0">
                  <BsDot className="d-none d-sm-flex mx-1" />

                  {isGoodFirstIssue && (
                    <GenericBadge
                      content="Good first issue"
                      className={`mx-1 text-uppercase bg-green ${styles.badge} lighterText`}
                      onClick={() => searchByText('good first issue')}
                    />
                  )}

                  {!isUndefined(props.issue.kind) && (
                    <GenericBadge
                      content={props.issue.kind}
                      className={classNames(
                        'ms-1 text-uppercase',
                        { 'bg-red': props.issue.kind === 'bug' },
                        { 'bg-blue': props.issue.kind !== 'bug' },
                        styles.badge,
                        'lighterText'
                      )}
                      onClick={() => searchByFilter(FilterKind.Kind, props.issue.kind!)}
                    />
                  )}

                  {!isUndefined(props.issue.difficulty) && (
                    <GenericBadge
                      content={props.issue.difficulty}
                      className={classNames('ms-1 text-uppercase bg-blue', styles.badge, 'lighterText')}
                      onClick={() => searchByFilter(FilterKind.Difficulty, props.issue.difficulty!)}
                    />
                  )}
                </div>
              )}

              {props.issue.repository.languages.length > 0 && (
                <div
                  className={`ms-auto d-none d-sm-flex flex-row flex-wrap overflow-hidden justify-content-end ${styles.languagesWrapper}`}
                >
                  {props.issue.repository.languages.slice(0, 4).map((label: string) => {
                    return (
                      <GenericBadge
                        content={label}
                        className={`fw-normal text-secondary lighterText text-uppercase ms-2 bg-purple ${styles.badge}`}
                        key={`label_${props.issue.number}_${label}`}
                        onClick={() => searchByText(label)}
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
