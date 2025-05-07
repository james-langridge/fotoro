'use server';

import { redirect } from 'next/navigation';
import { createClient} from '@/auth/supabase/server';

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  // Set custom redirect path for the reset link
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    console.error('Error requesting password reset:', error);
    redirect('/error?message=Failed+to+send+reset+link');
  }

  // Redirect to success page
  redirect('/forgot-password/confirmation');
}