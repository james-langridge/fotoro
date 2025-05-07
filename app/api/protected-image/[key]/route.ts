import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { awsS3Client} from '@/platforms/storage/aws-s3';
import { createServerClient } from '@supabase/ssr';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  let { key } = await params;

  // Handle key format if needed (similar to your getPresignedUrl function)
  if (key.startsWith('http')) {
    key = key.split('/').pop() || '';
  }

  // Check authentication
  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() { /* We only need to read cookies here */ },
        },
      },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Authentication required', { status: 401 });
  }

  try {
    // Use your existing S3 client
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET!,
      Key: key,
    });

    const s3Response = await awsS3Client().send(command);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', s3Response.ContentType || 'image/jpeg');
    headers.set('Content-Length', s3Response.ContentLength?.toString() || '');
    headers.set('Cache-Control', 'private, max-age=3600, must-revalidate');
    headers.set('Content-Disposition', 'inline');

    // Return the image data directly
    return new NextResponse(s3Response.Body?.transformToWebStream(), {
      headers,
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
}