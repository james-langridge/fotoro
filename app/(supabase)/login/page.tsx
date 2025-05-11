import {clsx} from 'clsx';
import SignInForm from './SignInForm';
import {redirect} from 'next/navigation';
import {PATH_ROOT} from '@/app/paths';
import {createClient} from '@/auth/supabase/server';

export default async function LoginPage() {
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();

  if (user) {
    redirect(PATH_ROOT);
  }

  return (
    <div className={clsx(
      'fixed top-0 left-0 right-0 bottom-0',
      'flex items-center justify-center flex-col gap-8',
    )}>
      <SignInForm />
    </div>
  );
}