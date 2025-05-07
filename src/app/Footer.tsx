'use client';

import { clsx } from 'clsx/lite';
import AppGrid from '../components/AppGrid';
import ThemeSwitcher from '@/app/ThemeSwitcher';
import Link from 'next/link';
import { SHOW_REPO_LINK } from '@/app/config';
import RepoLink from '../components/RepoLink';
import { usePathname } from 'next/navigation';
import { PATH_ADMIN_PHOTOS, isPathAdmin, isPathSignIn } from './paths';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';
// import { signOutAction } from '@/auth/actions';
import AnimateItems from '@/components/AnimateItems';
import { useAppState } from '@/state/AppState';
import Spinner from '@/components/Spinner';
import {createClient} from '@/auth/supabase/client';
import {User} from '@supabase/supabase-js';
import {useEffect, useState } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUserData();
  }, [supabase.auth]);

  const {
    // userEmail,
    // userEmailEager,
    isCheckingAuth,
    // clearAuthStateAndRedirectIfNecessary,
  } = useAppState();

  const showFooter = !isPathSignIn(pathname);

  const shouldAnimate = !isPathAdmin(pathname);

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
                {user?.email
                  ? <>
                    <div className="truncate max-w-full">
                      {user.email}
                    </div>
                    <form action="/api/auth/signout" method="post">
                      <SubmitButtonWithStatus styleAs="link">
                        Sign out
                      </SubmitButtonWithStatus>
                    </form>
                  </>
                  : isCheckingAuth
                    ? <Spinner size={16} className="translate-y-[2px]" />
                    : SHOW_REPO_LINK
                      ? <RepoLink />
                      : <Link href={PATH_ADMIN_PHOTOS}>
                        Admin
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
