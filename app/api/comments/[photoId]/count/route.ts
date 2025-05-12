import { NextRequest, NextResponse } from 'next/server';
import { getCommentCount } from '@/comment/db';

// GET: Get the count of comments for a specific photo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    const { photoId } = await params;

    // Fetch comment count from database
    const count = await getCommentCount(photoId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comment count' },
      { status: 500 },
    );
  }
}