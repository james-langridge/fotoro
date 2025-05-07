import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if this is an image request
  const isImageRequest = request.nextUrl.pathname.startsWith('/_next/image');

  // Create Supabase client
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
  const publicRoutes = ['/auth/login', '/api/auth', '/auth/reset-password', '/auth/forgot-password', '/auth/callback', '/auth/setup'];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

  // Special handling for image requests - they are never public
  if (isImageRequest) {
    // If no user and this is an image request, block access
    if (!user) {
      return new NextResponse('Authentication required', { status: 401 });
    }
    // If authenticated, allow access to the image
    return supabaseResponse;
  }

  // For non-image requests, continue with normal authentication flow
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', url.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/_next/image',
  ],
};


// export default function middleware(req: NextRequest, res:NextResponse) {
//   const pathname = req.nextUrl.pathname;
//
//   if (pathname === PATH_ADMIN) {
//     return NextResponse.redirect(new URL(PATH_ADMIN_PHOTOS, req.url));
//   } else if (pathname === PATH_OG) {
//     return NextResponse.redirect(new URL(PATH_OG_SAMPLE, req.url));
//   } else if (/^\/photos\/(.)+$/.test(pathname)) {
//     // Accept /photos/* paths, but serve /p/*
//     const matches = pathname.match(/^\/photos\/(.+)$/);
//     return NextResponse.rewrite(new URL(
//       `${PREFIX_PHOTO}/${matches?.[1]}`,
//       req.url,
//     ));
//   } else if (/^\/t\/(.)+$/.test(pathname)) {
//     // Accept /t/* paths, but serve /tag/*
//     const matches = pathname.match(/^\/t\/(.+)$/);
//     return NextResponse.rewrite(new URL(
//       `${PREFIX_TAG}/${matches?.[1]}`,
//       req.url,
//     ));
//   }
//
//   return auth(
//     req as unknown as NextApiRequest,
//     res as unknown as NextApiResponse,
//   );
// }
//
// export const config = {
//   // Excludes:
//   // - /api + /api/auth*
//   // - /_next/static*
//   // - /_next/image*
//   // - /favicon.ico + /favicons/*
//   // - /grid
//   // - /feed
//   // - / (root)
//   // - /home-image
//   // - /template-image
//   // - /template-image-tight
//   // - /template-url
//   // eslint-disable-next-line max-len
//   matcher: ['/((?!api$|api/auth|_next/static|_next/image|favicon.ico$|favicons/|grid$|feed$|home-image$|template-image$|template-image-tight$|template-url$|$).*)'],
// };

