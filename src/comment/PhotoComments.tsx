// src/comment/PhotoComments.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx/lite';
import { Comment, CommentDbInsert } from '@/comment';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { createClient } from '@/auth/supabase/client';
import { useAppState } from '@/state/AppState';
import { nanoid } from 'nanoid';
import { parseCommentsFromApi } from './dateUtils';

interface PhotoCommentsProps {
  photoId: string;
  className?: string;
  showTitle?: boolean;
}

export default function PhotoComments({
  photoId,
  className,
  showTitle = true,
}: PhotoCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const { supabaseUser } = useAppState();

  // Fetch current user's profile when component mounts or sign-in state changes
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!supabaseUser) {
        setCurrentUserName(null);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Try to get user's display name from metadata or email
          const displayName = user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'Anonymous';
          setCurrentUserName(displayName);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    getCurrentUser();
  }, [supabaseUser]);

  // Fetch comments for this photo
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both comments and count in parallel
      const [commentsResponse, countResponse] = await Promise.all([
        fetch(`/api/comments/${photoId}`),
        fetch(`/api/comments/${photoId}/count`),
      ]);

      if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
      if (!countResponse.ok) throw new Error('Failed to fetch comment count');

      const commentsData = await commentsResponse.json();
      const countData = await countResponse.json();

      // Parse the comments data using our utility to ensure dates are properly converted
      const parsedComments = parseCommentsFromApi(commentsData.comments || []);

      setComments(parsedComments);
      setCommentCount(countData.count || 0);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
      setComments([]);
      setCommentCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [photoId]);

  // Initial comments load
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle new comment submission
  const handleCommentSubmit = async (content: string) => {
    if (!supabaseUser || !currentUserName) {
      throw new Error('You must be signed in to comment');
    }

    const newComment: CommentDbInsert = {
      id: nanoid(8), // Generate 8-character ID matching your pattern
      photoId,
      content,
      commenterName: currentUserName,
    };

    try {
      const response = await fetch(`/api/comments/${photoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComment),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      // Refresh comments list to show the new comment
      await fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      throw error; // Re-throw so CommentForm can handle it
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={clsx('animate-pulse', className)}>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        <div className="space-y-3">
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={clsx(
        'text-red-600 dark:text-red-400 text-sm',
        'p-3 rounded border border-red-200 dark:border-red-700',
        'bg-red-50 dark:bg-red-900/20',
        className,
      )}>
        {error}
        <button
          onClick={fetchComments}
          className="ml-2 underline hover:no-underline"
        >
            Try again
        </button>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Section title - matches your existing styling patterns */}
      {showTitle && (
        <h3 className="text-medium font-medium">
          {commentCount === 0
            ? 'Comments'
            : commentCount === 1
              ? '1 Comment'
              : `${commentCount} Comments`}
        </h3>
      )}

      {/* Comments list */}
      <CommentList comments={comments} />

      {/* Comment form */}
      <CommentForm
        onSubmit={handleCommentSubmit}
        authorName={currentUserName || undefined}
        disabled={!supabaseUser}
      />
    </div>
  );
}