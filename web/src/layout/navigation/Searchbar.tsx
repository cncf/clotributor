import classnames from 'classnames';
import { scrollToTop, Searchbar as SearchbarForm } from 'clo-ui';
import { useEffect, useState } from 'react';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

import prepareQueryString from '../../utils/prepareQueryString';
import SearchTipsModal from '../common/SearchTipsModal';
import styles from './Searchbar.module.css';

interface Props {
  bigSize: boolean;
  inNavbar: boolean;
  classNameWrapper?: string;
}

const Searchbar = (props: Props) => {
  const [openTips, setOpenTips] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState<string>('');
  const [currentSearch, setCurrentSearch] = useState<string | null>(null);

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
        filters: {},
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
          filters: {},
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
