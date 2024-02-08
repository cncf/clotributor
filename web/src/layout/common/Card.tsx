import classNames from 'classnames';
import {
  Card as CardWrapper,
  ExternalLink,
  FoundationBadge,
  GenericBadge,
  Image,
  MaturityBadge,
  prettifyNumber,
} from 'clo-ui';
import { isUndefined } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { BsDot } from 'react-icons/bs';
import { FaChartBar, FaGithub } from 'react-icons/fa';
import { FiExternalLink, FiStar } from 'react-icons/fi';
import { GoCalendar } from 'react-icons/go';
import { IoGlobeOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

import { AppContext } from '../../context/AppContextProvider';
import { FilterKind, Issue } from '../../types';
import prepareQueryString from '../../utils/prepareQueryString';
import removeEmojis from '../../utils/removeEmojis';
import removeLastDot from '../../utils/removeLastDot';
import styles from './Card.module.css';
import MaintainersWantedBadge from './MaintainersWantedBadge';

interface Props {
  issue: Issue;
}

const Card = (props: Props) => {
  const navigate = useNavigate();
  const { ctx } = useContext(AppContext);
  const { effective } = ctx.prefs.theme;
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const isMaintainersWantedAvailable: boolean =
    !isUndefined(props.issue.project.maintainers_wanted) && props.issue.project.maintainers_wanted.enabled;

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

  const searchByGoodFirstIssue = () => {
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        pageNumber: 1,
        good_first_issue: true,
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

    cleanTopics();
  }, []); /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <CardWrapper className={styles.card} wrapperClassName={styles.cardWrapper} hoverable={false}>
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
                dark_url={props.issue.project.logo_dark_url}
                effective_theme={effective}
              />
            </div>
            <div className="truncateWrapper w-100">
              <div className="d-flex flex-row justify-content-between align-items-end text-truncate">
                <span className={`text-truncate fw-bold mb-0 ${styles.title}`}>
                  {props.issue.project.display_name || props.issue.project.name}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-row align-items-center ms-2">
            {isMaintainersWantedAvailable && (
              <MaintainersWantedBadge
                className="d-none d-sm-flex me-2"
                maintainers_wanted={props.issue.project.maintainers_wanted!}
                buttonStyle
              />
            )}
            {props.issue.project.maturity && (
              <MaturityBadge
                maturityLevel={props.issue.project.maturity}
                maxLength={14}
                className="d-none d-sm-flex me-2"
                onClick={() => searchByFilter(FilterKind.Maturity, props.issue.project.maturity!)}
              />
            )}
            <FoundationBadge
              foundation={props.issue.project.foundation}
              maxLength={14}
              onClick={() => searchByFilter(FilterKind.Foundation, props.issue.project.foundation)}
            />
          </div>
        </div>

        <div
          className={`d-none d-md-flex flex-column flex-sm-row align-items-center ps-3 position-relative ${styles.projectWrapper}`}
        >
          <div
            className={classNames('d-none d-xl-flex align-items-center justify-content-center', styles.imageWrapper, {
              [styles.negativeMarginTop]: isMaintainersWantedAvailable,
            })}
          >
            <Image
              alt={`${props.issue.project.display_name || props.issue.project.name} logo`}
              url={props.issue.project.logo_url}
              dark_url={props.issue.project.logo_dark_url}
              effective_theme={effective}
            />
          </div>
          <div
            className={classNames('ms-0 ms-xl-3 flex-grow-1 w-100 truncateWrapper', {
              [styles.negativeMarginTop]: isMaintainersWantedAvailable,
            })}
          >
            <div className="p-0 p-xl-2 pe-xl-0">
              <div className="d-flex flex-row align-items-center">
                <div className="d-flex flex-column w-100 truncateWrapper">
                  <div className="d-flex flex-row align-items-center w-100 truncateWrapper">
                    <div
                      className={`d-flex d-xl-none align-items-center justify-content-center me-2 ${styles.miniImageWrapper}`}
                    >
                      <Image
                        alt={`${props.issue.project.display_name || props.issue.project.name} logo`}
                        url={props.issue.project.logo_url}
                        dark_url={props.issue.project.logo_dark_url}
                        effective_theme={effective}
                      />
                    </div>
                    <div className="truncateWrapper">
                      <button
                        className="btn btn-sm btn-link border-0 p-0 mw-100 align-baseline"
                        onClick={() => searchByFilter(FilterKind.Project, props.issue.project.name)}
                      >
                        <div className="d-flex flex-row justify-content-between align-items-end text-truncate">
                          <span
                            className={classNames('text-truncate fw-semibold mb-0 lightText', styles.title, {
                              [styles.longProjectName]:
                                (props.issue.project.display_name || props.issue.project.name).length > 22,
                            })}
                          >
                            {props.issue.project.display_name || props.issue.project.name}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="d-flex flex-row align-items-center my-2">
                    <FoundationBadge
                      foundation={props.issue.project.foundation}
                      maxLength={14}
                      onClick={() => searchByFilter(FilterKind.Foundation, props.issue.project.foundation)}
                    />
                    {props.issue.project.maturity && (
                      <MaturityBadge
                        maturityLevel={props.issue.project.maturity}
                        className="ms-2"
                        maxLength={14}
                        onClick={() => searchByFilter(FilterKind.Maturity, props.issue.project.maturity!)}
                      />
                    )}
                  </div>

                  <div className={`d-none d-md-flex flex-row mt-0 mt-md-1 align-items-center ${styles.info}`}>
                    {props.issue.repository.homepage_url && (
                      <ExternalLink label="Project url" href={props.issue.repository.homepage_url} className="me-3">
                        <div className={`d-flex flex-row align-items-center text-muted ${styles.link}`}>
                          <IoGlobeOutline className={styles.urlIcon} />
                        </div>
                      </ExternalLink>
                    )}

                    {props.issue.project.devstats_url && (
                      <ExternalLink label="Dev stats link" href={props.issue.project.devstats_url} className="me-3">
                        <div className={`d-flex flex-row align-items-center text-muted ${styles.link}`}>
                          <FaChartBar className={styles.statsIcon} />
                        </div>
                      </ExternalLink>
                    )}

                    {props.issue.project.accepted_at && (
                      <div
                        className={`d-flex flex-row align-items-center ${styles.subtitle} ${styles.wrapperCalendar}`}
                      >
                        <GoCalendar className={`me-1 text-muted ${styles.calendarIcon}`} />
                        <div>{moment(props.issue.project.accepted_at, 'YYYY-MM-DD').format('YYYY')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isMaintainersWantedAvailable && (
            <MaintainersWantedBadge maintainers_wanted={props.issue.project.maintainers_wanted!} />
          )}
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

              {props.issue.repository.languages.length > 0 && (
                <div className="ms-auto d-flex d-sm-none">
                  <GenericBadge
                    content={props.issue.repository.languages[0]}
                    className={`fw-normal text-secondary text-uppercase ms-2 bg-purple ${styles.badge}`}
                  />
                </div>
              )}

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
              <div className={`fw-semibold text-start ${styles.issueDesc}`}>
                {removeLastDot(removeEmojis(props.issue.title))}
              </div>
            </ExternalLink>

            <div className="d-none d-md-flex flex-row align-items-center">
              <div className="d-flex truncateWrapper">
                <ExternalLink
                  label="Issue url"
                  href={props.issue.url}
                  className="position-relative d-inline-block mw-100 my-3"
                  externalIconClassName={styles.externalIcon}
                  visibleExternalIcon
                >
                  <div className={`fw-semibold text-start text-truncate ${styles.issueDesc}`}>
                    {removeLastDot(removeEmojis(props.issue.title))}
                  </div>
                </ExternalLink>
              </div>

              {props.issue.mentor_available && (
                <div className="d-none d-xl-flex">
                  <GenericBadge
                    content="Mentor available"
                    className={classNames('ms-3 text-uppercase bg-solid-yellow', styles.badge, styles.mentorBadge)}
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

              {(props.issue.good_first_issue || props.issue.kind || props.issue.difficulty || props.issue.area) && (
                <div
                  className={`d-flex flex-row align-items-center justify-content-end justify-content-sm-start flex-wrap overflow-hidden ms-auto ms-sm-0 ${styles.badgesWrapper}`}
                >
                  <BsDot className={`d-none d-sm-flex mx-1 ${styles.dot}`} />

                  {props.issue.good_first_issue && (
                    <GenericBadge
                      content="Good first issue"
                      className={`text-uppercase bg-green ${styles.badge}`}
                      onClick={searchByGoodFirstIssue}
                    />
                  )}

                  {!isUndefined(props.issue.kind) && (
                    <GenericBadge
                      content={props.issue.kind}
                      className={classNames(
                        'text-uppercase text-truncate',
                        { 'bg-red': props.issue.kind === 'bug' },
                        { 'bg-blue': props.issue.kind !== 'bug' },
                        styles.badge
                      )}
                      onClick={() => searchByFilter(FilterKind.Kind, props.issue.kind!)}
                    />
                  )}

                  {!isUndefined(props.issue.difficulty) && (
                    <GenericBadge
                      content={props.issue.difficulty}
                      className={classNames('text-uppercase bg-blue', styles.badge)}
                      onClick={() => searchByFilter(FilterKind.Difficulty, props.issue.difficulty!)}
                    />
                  )}

                  {!isUndefined(props.issue.area) && (
                    <GenericBadge
                      content={props.issue.area}
                      className={classNames('text-uppercase bg-blue', styles.badge)}
                      onClick={() => searchByFilter(FilterKind.Area, props.issue.area!)}
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
                        className={`fw-normal text-secondary text-uppercase ms-2 bg-purple ${styles.badge}`}
                        key={`label_${props.issue.number}_${label}`}
                        onClick={() => searchByFilter(FilterKind.Language, label)}
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
