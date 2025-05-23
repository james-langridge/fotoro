'use server';

import { createClient } from '@/auth/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signOut() {
  const supabase = await createClient();

  // Check if a user is currently logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If a user exists, sign them out
  if (user) {
    await supabase.auth.signOut();
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}