'use client';

import { clsx } from 'clsx/lite';
import AppGrid from '../components/AppGrid';
import ThemeSwitcher from '@/app/ThemeSwitcher';
import Link from 'next/link';
import {ENHANCED_PRIVACY_ENABLED, SHOW_REPO_LINK} from '@/app/config';
import RepoLink from '../components/RepoLink';
import { usePathname } from 'next/navigation';
import {PATH_ADMIN_PHOTOS, isPathAdmin, isPathSignIn, isPathLogin} from './paths';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';
import { signOutAction } from '@/auth/actions';
import AnimateItems from '@/components/AnimateItems';
import { useAppState } from '@/state/AppState';
import Spinner from '@/components/Spinner';
import { useAppText } from '@/i18n/state/client';

export default function Footer() {
  const pathname = usePathname();

  const {
    userEmail,
    userEmailEager,
    isCheckingAuth,
    clearAuthStateAndRedirectIfNecessary,
  } = useAppState();

  const appText = useAppText();

  const showFooter = !isPathSignIn(pathname) && !isPathLogin(pathname);

  const shouldAnimate = !isPathAdmin(pathname);

  const action = ENHANCED_PRIVACY_ENABLED ? '/api/auth/supabase/signout' : () => signOutAction()
    .then(clearAuthStateAndRedirectIfNecessary);

  return (
    <AppGrid
      contentMain={
        <AnimateItems
          animateOnFirstLoadOnly
          type={!shouldAnimate ? 'none' : 'bottom'}
          distanceOffset={10}
          items={showFooter
            ? [<div
              key="footer"
              className={clsx(
                'flex items-center gap-1',
                'text-dim min-h-10',
              )}>
              <div className="flex gap-x-3 xs:gap-x-4 grow flex-wrap">
                {userEmail || userEmailEager
                  ? <>
                    <div className="truncate max-w-full">
                      {userEmail || userEmailEager}
                    </div>
                    <form action={action} method="post">
                      <SubmitButtonWithStatus styleAs="link">
                        {appText.auth.signOut}
                      </SubmitButtonWithStatus>
                    </form>
                  </>
                  : isCheckingAuth
                    ? <Spinner size={16} className="translate-y-[2px]" />
                    : SHOW_REPO_LINK
                      ? <RepoLink />
                      : <Link href={PATH_ADMIN_PHOTOS}>
                        {appText.nav.admin}
                      </Link>}
              </div>
              <div className="flex items-center h-10">
                <ThemeSwitcher />
              </div>
            </div>]
            : []}
        />}
    />
  );
}
