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
  isPathSignIn, isPathLogin,
} from '@/app/paths';
import AnimateItems from '../components/AnimateItems';
import {
  GRID_HOMEPAGE_ENABLED,
  NAV_CAPTION,
} from './config';
import { useRef } from 'react';
import useStickyNav from './useStickyNav';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';
import ThemeSwitcher from '@/app/ThemeSwitcher';
import {useAppState} from '@/state/AppState';
import {signOut} from '@/auth/supabase/actions';

const NAV_HEIGHT_CLASS = NAV_CAPTION
  ? 'min-h-[4rem] sm:min-h-[5rem]'
  : 'min-h-[4rem]';

export default function Nav({
  navTitleOrDomain,
}: {
  navTitleOrDomain: string;
}) {
  const {
    userEmail,
    supabaseEmail,
    supabaseEmailEager,
    userEmailEager,
    clearAuthStateAndRedirectIfNecessary,
  } = useAppState();

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
              <div className="flex gap-x-3 xs:gap-x-4 grow flex-wrap">
                {supabaseEmail
                  && <>
                    <div className="truncate max-w-full">
                      {supabaseEmail}
                    </div>
                    <form action={()=> signOut()}>
                      <SubmitButtonWithStatus styleAs="link">
                                Sign out
                      </SubmitButtonWithStatus>
                    </form>
                  </>}
              </div>
              <div className="flex items-center h-10">
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
