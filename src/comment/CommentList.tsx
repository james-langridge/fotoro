// src/comment/CommentList.tsx
'use client';

import { clsx } from 'clsx/lite';
import { Comment } from '@/comment';
import { formatDate } from '@/utility/date';
import Tooltip from '@/components/Tooltip';

interface CommentListProps {
  comments: Comment[];
  className?: string;
}

function CommentItem({ comment, isFirst }: { comment: Comment; isFirst: boolean }) {
  // Format the date for display - showing short time with tooltip for long time
  // Using your existing formatDate utility with different lengths
  const relativeTime = formatDate({ date: comment.createdAt, length: 'short' });
  const exactTime = formatDate({ date: comment.createdAt, length: 'long' });

  return (
    <div className={clsx(
      'space-y-1',
      !isFirst && 'pt-3',
    )}>
      {/* Comment header with author name and date */}
      <div className="flex items-center gap-2 text-extra-dim text-sm">
        {comment.commenterName && (
          <span className="font-medium text-dim">
            {comment.commenterName}
          </span>
        )}
        <Tooltip content={exactTime} sideOffset={3}>
          <time
            dateTime={comment.createdAt.toISOString()}
            className="hover:text-medium cursor-help"
          >
            {relativeTime}
          </time>
        </Tooltip>
      </div>

      {/* Comment content */}
      <div className="text-medium leading-relaxed">
        {comment.content}
      </div>
    </div>
  );
}

export default function CommentList({ comments, className }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className={clsx(
        'text-dim text-sm italic',
        'p-3 rounded border border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-800/50',
        className,
      )}>
          No comments yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div className={clsx(
      'space-y-0 divide-y divide-gray-200 dark:divide-gray-700',
      className,
    )}>
      {comments.map((comment, index) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          isFirst={index === 0}
        />
      ))}
    </div>
  );
}