import { NextRequest, NextResponse } from 'next/server';
import {
  getComments,
  insertComment,
  deleteComment,
  updateComment,
} from '@/comment/db';
import { CommentDbInsert } from '@/comment';
import { createClient } from '@/auth/supabase/server';

// GET: Fetch all comments for a photo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    const { photoId } = await params;

    // Parse query parameters for pagination and ordering
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('orderBy') === 'desc' ? 'desc' : 'asc';

    // Fetch comments from database
    const comments = await getComments(photoId, {
      limit,
      offset,
      orderBy,
    });

    return NextResponse.json({
      comments,
      count: comments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

// POST: Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    // Verify user is authenticated with Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { photoId } = await params;
    const body = await request.json();

    // Validate required fields
    const { content, commenterName } = body;
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 },
      );
    }

    // Validate content length
    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be less than 1000 characters' },
        { status: 400 },
      );
    }

    // Create the comment in the database
    const comment: CommentDbInsert = {
      id: body.id,
      photoId,
      content: content.trim(),
      commenterName: commenterName || 'Anonymous',
    };

    await insertComment(comment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 },
    );
  }
}

// PUT: Update an existing comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, content, commenterName } = body;

    if (!id || !content?.trim()) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 },
      );
    }

    // Validate content length
    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be less than 1000 characters' },
        { status: 400 },
      );
    }

    const { photoId } = await params;

    const comment: CommentDbInsert = {
      id,
      photoId,
      content: content.trim(),
      commenterName,
    };

    await updateComment(comment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 },
    );
  }
}

// DELETE: Remove a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 },
      );
    }

    await deleteComment(commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 },
    );
  }
}