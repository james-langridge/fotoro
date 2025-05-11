'use client';

import { clsx } from 'clsx/lite';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AppGrid from '../components/AppGrid';
import AppViewSwitcher, { SwitcherSelection } from '@/app/AppViewSwitcher';
import {
  PATH_ROOT,
  isPathAdmin,
  isPathFeed,
  isPathGrid,
  isPathProtected,
  isPathSignIn, isPathLogin, PATH_ADMIN_PHOTOS,
} from '@/app/paths';
import AnimateItems from '../components/AnimateItems';
import {
  ENHANCED_PRIVACY_ENABLED,
  GRID_HOMEPAGE_ENABLED,
  NAV_CAPTION, SHOW_REPO_LINK, SHOW_SIGN_OUT_BOTTOM,
} from './config';
import { useRef } from 'react';
import useStickyNav from './useStickyNav';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';
import ThemeSwitcher from '@/app/ThemeSwitcher';
import {useAppState} from '@/state/AppState';
import {signOut} from '@/auth/supabase/actions';
import Spinner from '@/components/Spinner';
import RepoLink from '@/components/RepoLink';
import {signOutAction} from '@/auth/actions';

const NAV_HEIGHT_CLASS = NAV_CAPTION
  ? 'min-h-[4rem] sm:min-h-[5rem]'
  : 'min-h-[4rem]';

export default function Nav({
  navTitleOrDomain,
}: {
  navTitleOrDomain: string;
}) {
  const { userEmail, userEmailEager, isCheckingAuth, clearAuthStateAndRedirectIfNecessary, supabaseEmail } = useAppState();

  const ref = useRef<HTMLElement>(null);

  const pathname = usePathname();
  const showNav = !isPathSignIn(pathname) && !isPathLogin(pathname);;

  const {
    classNameStickyContainer,
    classNameStickyNav,
  } = useStickyNav(ref);

  const renderLink = (
    text: string,
    linkOrAction: string | (() => void),
  ) =>
    typeof linkOrAction === 'string'
      ? <Link href={linkOrAction}>{text}</Link>
      : <button onClick={linkOrAction}>{text}</button>;

  const switcherSelectionForPath = (): SwitcherSelection | undefined => {
    if (pathname === PATH_ROOT) {
      return GRID_HOMEPAGE_ENABLED ? 'grid' : 'feed';
    } else if (isPathGrid(pathname)) {
      return 'grid';
    } else if (isPathFeed(pathname)) {
      return 'feed';
    } else if (isPathProtected(pathname)) {
      return 'admin';
    }
  };

  return (
    <AppGrid
      className={classNameStickyContainer}
      classNameMain='pointer-events-auto'
      contentMain={
        <AnimateItems
          animateOnFirstLoadOnly
          type={!isPathAdmin(pathname) ? 'bottom' : 'none'}
          distanceOffset={10}
          items={showNav
            ? [<nav
              key="nav"
              ref={ref}
              className={clsx(
                'w-full flex items-center bg-main',
                NAV_HEIGHT_CLASS,
                // Enlarge nav to ensure it fully masks underlying content
                'md:w-[calc(100%+8px)] md:translate-x-[-4px] md:px-[4px]',
                classNameStickyNav,
              )}>
              <AppViewSwitcher
                currentSelection={switcherSelectionForPath()}
              />
              {SHOW_SIGN_OUT_BOTTOM ? <div className={clsx(
                'grow text-right min-w-0',
                'hidden xs:block',
                'translate-y-[-1px]',
              )}>
                <div className="truncate overflow-hidden select-none">
                  {renderLink(navTitleOrDomain, PATH_ROOT)}
                </div>
                {NAV_CAPTION &&
                          <div className={clsx(
                            'hidden sm:block truncate overflow-hidden',
                            'leading-tight text-dim',
                          )}>
                            {NAV_CAPTION}
                          </div>}
              </div> : ENHANCED_PRIVACY_ENABLED ? <div className="flex gap-x-3 xs:gap-x-4 grow flex-wrap">
                {supabaseEmail
                          && <>
                            <div className="truncate max-w-full">
                              {supabaseEmail}
                            </div>
                            <form action={() => signOut()}>
                              <SubmitButtonWithStatus styleAs="link">
                                      Sign out
                              </SubmitButtonWithStatus>
                            </form>
                          </>}
              </div> : <div className="flex gap-x-3 xs:gap-x-4 grow flex-wrap">
                {userEmail || userEmailEager
                  ? <>
                    <div className="truncate max-w-full">
                      {userEmail || userEmailEager}
                    </div>
                    <form action={() => signOutAction()
                      .then(clearAuthStateAndRedirectIfNecessary)} method="post">
                      <SubmitButtonWithStatus styleAs="link">
                                      Sign out
                      </SubmitButtonWithStatus>
                    </form>
                  </>
                  : isCheckingAuth
                    ? <Spinner size={16} className="translate-y-[2px]"/>
                    : SHOW_REPO_LINK
                      ? <RepoLink/>
                      : <Link href={PATH_ADMIN_PHOTOS}>
                                      Admin
                      </Link>}
              </div>}
              <div className="hidden sm:flex items-center h-10">
                <ThemeSwitcher/>
              </div>
            </nav>]
            : []}
        />
      }
      sideHiddenOnMobile
    />
  );
};
