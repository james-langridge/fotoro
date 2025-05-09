import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function handleSupabaseAuth(
  request: NextRequest,
  originalResponse: NextResponse | null,
) {
  const supabaseResponse = originalResponse || NextResponse.next({ request });

  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              if (supabaseResponse.cookies) {
                supabaseResponse.cookies.set(name, value, options);
              }
            });
          },
        },
      },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isImageRequest = request.nextUrl.pathname.startsWith('/_next/image');

  if (isImageRequest && !user) {
    return new NextResponse('Authentication required', { status: 401 });
  }

  const url = new URL(request.url);
  const publicRoutes = ['/login', '/reset-password', '/forgot-password', '/auth/callback', '/setup'];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', url.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}