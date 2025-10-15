import classNames from 'classnames';
import { DropdownOnHover } from 'clo-ui/components/DropdownOnHover';
import { ExternalLink } from 'clo-ui/components/ExternalLink';
import { isUndefined } from 'lodash';
import { MdInfoOutline } from 'react-icons/md';
import { RxDotFilled } from 'react-icons/rx';

import { MaintainersWanted, MaintainersWantedContact, MaintainersWantedLink } from '../../types';
import styles from './MaintainersWantedBadge.module.css';

interface Props {
  className?: string;
  maintainers_wanted: MaintainersWanted;
  buttonStyle?: boolean;
}

const MaintainersWantedBadge = (props: Props) => {
  const activeTooltip =
    (props.maintainers_wanted.contacts && props.maintainers_wanted.contacts.length > 0) ||
    (props.maintainers_wanted.links && props.maintainers_wanted.links.length > 0);
  const isButton = !isUndefined(props.buttonStyle) && props.buttonStyle;

  const maintainersBadge = (
    <>
      {!isButton ? (
        <div
          className={`position-relative text-center text-uppercase fw-bold w-100  ${styles.badge} ${styles.badgeInBottom}`}
        >
          <div className="d-flex flex-row align-items-center justify-content-center">
            <div>Maintainers wanted</div>
            <MdInfoOutline className={`ms-2 position-relative ${styles.icon}`} />
          </div>
        </div>
      ) : (
        <div className={`d-none d-sm-flex badge rounded-0 me-2 ${styles.badge}`}>
          <div className="d-flex flex-row align-items-center justify-content-center">
            <MdInfoOutline className="me-1" />
            <div>Maintainers wanted</div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={classNames({ [`position-absolute ${styles.wrapper}`]: !isButton })}>
      {activeTooltip ? (
        <DropdownOnHover
          dropdownClassName={styles.dropdown}
          width={isButton ? 300 : 500}
          linkContent={maintainersBadge}
          tooltipStyle
        >
          <div className="text-start p-2">
            {props.maintainers_wanted.links && props.maintainers_wanted.links.length > 0 && (
              <>
                <div className="border-bottom border-1 pb-1 mb-3 fw-bold">Links</div>
                <div
                  className={classNames('mb-1', {
                    'mb-3': props.maintainers_wanted.contacts && props.maintainers_wanted.contacts.length > 0,
                  })}
                >
                  {props.maintainers_wanted.links.map((link: MaintainersWantedLink, index: number) => {
                    return (
                      <div key={`link_${index}_${link.url}`} className="d-flex flex-row align-items-center ms-2 my-1">
                        <RxDotFilled className={`me-2 position-relative ${styles.dot}`} />
                        <ExternalLink className="text-truncate w-100" href={link.url}>
                          {link.title || link.url}
                        </ExternalLink>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {props.maintainers_wanted.contacts && props.maintainers_wanted.contacts.length > 0 && (
              <>
                <div className="border-bottom border-1 pb-1 mb-3 fw-bold">Contacts</div>
                <div className="mb-1">
                  {props.maintainers_wanted.contacts.map((contact: MaintainersWantedContact, index: number) => {
                    return (
                      <div
                        key={`contact_${index}_${contact.github_handle}`}
                        className="d-flex flex-row align-items-center ms-2 my-1"
                      >
                        <RxDotFilled className={`me-2 position-relative ${styles.dot}`} />
                        <ExternalLink
                          className="text-truncate w-100"
                          href={`https://github.com/${contact.github_handle}`}
                        >
                          {contact.github_handle}
                        </ExternalLink>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DropdownOnHover>
      ) : (
        <>{maintainersBadge}</>
      )}
    </div>
  );
};

export default MaintainersWantedBadge;
