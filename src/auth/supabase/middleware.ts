import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
              supabaseResponse = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options),
              );
            },
          },
        },
  );

  // Get the current user session
  const { data: { user } } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const url = new URL(request.url);
  const publicRoutes = ['/login', '/signup', '/api/auth', '/reset-password', '/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

  // If no user and not on a public route, redirect to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', url.pathname);
    return NextResponse.redirect(redirectUrl);
  }


  return supabaseResponse;
}