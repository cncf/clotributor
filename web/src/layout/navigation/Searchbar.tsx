import classnames from 'classnames';
import { scrollToTop, Searchbar as SearchbarForm } from 'clo-ui';
import isNull from 'lodash/isNull';
import { useContext, useEffect, useState } from 'react';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AppContext } from '../../context/AppContextProvider';
import { FilterKind } from '../../types';
import prepareQueryString from '../../utils/prepareQueryString';
import SearchTipsModal from '../common/SearchTipsModal';
import styles from './Searchbar.module.css';

interface Props {
  bigSize: boolean;
  inNavbar: boolean;
  classNameWrapper?: string;
}

const Searchbar = (props: Props) => {
  const { ctx } = useContext(AppContext);
  const isEmbed = ctx.isEmbed;
  const location = useLocation();
  const [openTips, setOpenTips] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState<string>('');
  const [currentSearch, setCurrentSearch] = useState<string | null>(null);

  const getExtraFilter = () => {
    if (isEmbed) {
      const searchParams = new URLSearchParams(location.search);
      // Scroll to top on every search
      document.getElementById('clo-wrapper')!.scrollTop = 0;

      if (searchParams.has(FilterKind.Foundation) && !isNull(searchParams.get(FilterKind.Foundation))) {
        return { [FilterKind.Foundation]: [searchParams.get(FilterKind.Foundation)!] };
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  };

  useEffect(() => {
    const text = searchParams.get('ts_query_web');
    setValue(text || '');
    setCurrentSearch(text);
  }, [searchParams]);

  const search = () => {
    scrollToTop();
    navigate({
      pathname: '/search',
      search: prepareQueryString({
        pageNumber: 1,
        ts_query_web: value,
        filters: { ...getExtraFilter() },
      }),
    });
  };

  const cleanSearchValue = () => {
    if (currentSearch === value) {
      scrollToTop();
      navigate({
        pathname: '/search',
        search: prepareQueryString({
          pageNumber: 1,
          ts_query_web: '',
          filters: { ...getExtraFilter() },
        }),
      });
    } else {
      setValue('');
    }
  };

  return (
    <div
      className={classnames(
        'd-flex flex-row justify-content-center',
        { [styles.searchWrapper]: props.inNavbar },
        {
          [styles.bigSearch]: props.bigSize,
        }
      )}
    >
      <SearchbarForm
        value={value}
        onValueChange={(newValue: string) => setValue(newValue)}
        onSearch={search}
        cleanSearchValue={cleanSearchValue}
        placeholder="Search opportunities"
        classNameWrapper={props.classNameWrapper}
        bigSize={props.bigSize}
      />
      <div className={`d-none d-sm-inline-block ${styles.questionMark}`}>
        <button
          className={classnames('btn btn-link text-decoration-none', { [styles.inNavbar]: props.inNavbar })}
          onClick={() => setOpenTips(!openTips)}
        >
          <FaRegQuestionCircle className={`position-absolute ${styles.question}`} />
        </button>
      </div>
      <SearchTipsModal openTips={openTips} setOpenTips={setOpenTips} />
    </div>
  );
};

export default Searchbar;
