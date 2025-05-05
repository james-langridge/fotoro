import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl} from '@/platforms/storage/aws-s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const {key} = await params;

  if (!key) {
    return NextResponse.json(
      { error: 'Missing key parameter' },
      { status: 400 },
    );
  }

  try {
    console.log('Generating presigned URL for key:', key); // Debug log
    const url = await getPresignedUrl(key);
    console.log('Generated URL:', url.substring(0, 50) + '...'); // Debug log (truncated for security)
    return new NextResponse(url);
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate pre-signed URL' },
      { status: 500 },
    );
  }
}