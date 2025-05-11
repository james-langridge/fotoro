'use client';

import FieldSetWithStatus from '@/components/FieldSetWithStatus';
import Container from '@/components/Container';
import SubmitButtonWithStatus from '@/components/SubmitButtonWithStatus';
import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react';
import { signInAction } from './actions';
import ErrorNote from '@/components/ErrorNote';
import {
  KEY_CALLBACK_URL,
  KEY_CREDENTIALS_SIGN_IN_ERROR,
  KEY_CREDENTIALS_SUCCESS,
} from '@/auth';
import {useRouter, useSearchParams} from 'next/navigation';
import { useAppState } from '@/state/AppState';
import { clsx } from 'clsx/lite';
import {PATH_ROOT} from '@/app/paths';
import IconLock from '@/components/icons/IconLock';
import {createClient} from '@/auth/supabase/client';

export default function SignInForm({
  includeTitle = true,
  shouldRedirect = true,
  className,
}: {
  includeTitle?: boolean
  shouldRedirect?: boolean
  className?: string
}) {
  const params = useSearchParams();
  const router = useRouter();

  const { setSupabaseEmail } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [response, action] = useActionState(signInAction, undefined);

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timeout = setTimeout(() => emailRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (response === KEY_CREDENTIALS_SUCCESS) {
      setSupabaseEmail?.(email);
      router.push(PATH_ROOT);
    }
  }, [setSupabaseEmail, response, email, router]);

  useEffect(() => {
    async function getUserEmail() {
      const supabase = await createClient();
      const {data: {user}} = await supabase.auth.getUser();
      return user?.email ?? undefined;
    }
    return () => {
      // Capture user email before unmounting
      getUserEmail().then(email => {
        console.log('Setting user email:', email);
        setSupabaseEmail?.(email);
      });
    };
  }, [setSupabaseEmail]);

  const isFormValid =
    email.length > 0 &&
    password.length > 0;

  return (
    <Container
      className={clsx(
        'w-[calc(100vw-1.5rem)] sm:w-[min(360px,90vw)]',
        'px-6 py-5',
        className,
      )}
    >
      {includeTitle &&
        <h1 className={clsx(
          'flex gap-3 items-center justify-center',
          'self-start text-2xl',
          'mb-6',
        )}>
          <IconLock className="text-main translate-y-[0.5px]" />
          <span className="text-main">
            Sign in
          </span>
        </h1>}
      <form action={action} className="w-full">
        <div className="space-y-5 w-full -translate-y-0.5">
          {response === KEY_CREDENTIALS_SIGN_IN_ERROR &&
            <ErrorNote>
              Invalid email/password
            </ErrorNote>}
          <div className="space-y-4 w-full">
            <FieldSetWithStatus
              id="email"
              inputRef={emailRef}
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
            />
            <FieldSetWithStatus
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
            />
            {shouldRedirect &&
              <input
                type="hidden"
                name={KEY_CALLBACK_URL}
                value={params.get(KEY_CALLBACK_URL) || PATH_ROOT}
              />}
          </div>
          <SubmitButtonWithStatus disabled={!isFormValid}>
            Sign in
          </SubmitButtonWithStatus>
        </div>
      </form>
    </Container>
  );
}
