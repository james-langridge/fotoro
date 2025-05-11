'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/auth/supabase/server';
import {
  KEY_CREDENTIALS_SIGN_IN_ERROR,
  KEY_CREDENTIALS_SUCCESS,
} from '@/auth';

export async function signInAction(
  _prevState: string | undefined,
  formData: FormData,
) {
  const supabase = await createClient();
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      console.log('Supabase sign in error:', error);
      return KEY_CREDENTIALS_SIGN_IN_ERROR;
    }

    revalidatePath('/', 'layout');

    return KEY_CREDENTIALS_SUCCESS;
  } catch (error) {
    if (!`${error}`.includes('NEXT_REDIRECT')) {
      console.log('Unknown sign in error:', {
        errorText: `${error}`,
        error,
      });
      throw error;
    }
  }
}