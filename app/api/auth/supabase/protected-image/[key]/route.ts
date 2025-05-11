import { NextRequest, NextResponse } from 'next/server';
import {awsS3Get} from '@/platforms/storage/aws-s3';
import {createClient} from '@/auth/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  let { key } = await params;

  if (key.startsWith('http')) {
    key = key.split('/').pop() || '';
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized request', { status: 401 });
  }

  try {
    const s3Response = await awsS3Get(key);

    const headers = new Headers();
    headers.set('Content-Type', s3Response.ContentType || 'image/jpeg');
    headers.set('Content-Length', s3Response.ContentLength?.toString() || '');
    headers.set('Cache-Control', 'private, max-age=3600, must-revalidate');
    headers.set('Content-Disposition', 'inline');

    return new NextResponse(s3Response.Body?.transformToWebStream(), {
      headers,
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}