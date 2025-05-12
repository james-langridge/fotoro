'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx/lite';
import LoaderButton from '@/components/primitives/LoaderButton';
import { LuMessageSquare } from 'react-icons/lu';
import { useAppState } from '@/state/AppState';

interface CommentFormProps {
    onSubmit: (content: string) => Promise<void>;
    authorName?: string;
    className?: string;
    disabled?: boolean;
}

export default function CommentForm({
  onSubmit,
  authorName,
  className,
  disabled = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { supabaseUser } = useAppState();

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Please enter a comment');
      textareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedContent);
      setContent('');
      setError(null);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show sign-in prompt if user is not authenticated
  if (!supabaseUser) {
    return (
      <div className={clsx(
        'text-dim text-sm text-center p-4',
        'rounded border border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-800/50',
        className,
      )}>
                Please sign in to leave a comment.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={clsx('space-y-3', className)}>
      {/* Show who's commenting */}
      {authorName && (
        <div className="text-sm text-medium">
                    Commenting as <span className="font-medium text-main">{authorName}</span>
        </div>
      )}

      {/* Comment textarea */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          disabled={disabled || isSubmitting}
          rows={3}
          className={clsx(
            'w-full px-3 py-2 rounded',
            'border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800',
            'text-main placeholder-gray-500',
            'focus:border-gray-500 dark:focus:border-gray-400',
            'focus:outline-none focus:ring-0',
            'resize-none overflow-hidden',
            'transition-colors duration-200',
            (disabled || isSubmitting) && 'opacity-50 cursor-not-allowed',
          )}
          style={{ minHeight: 'auto' }}
        />

        {/* Character counter and error message */}
        <div className="flex justify-between items-center text-sm">
          <div className={clsx(
            'text-extra-dim',
            content.length > 1000 && 'text-red-500 dark:text-red-400',
          )}>
            {content.length} / 1000
          </div>
          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <LoaderButton
          type="submit"
          disabled={disabled || !content.trim() || content.length > 1000}
          isLoading={isSubmitting}
          icon={<LuMessageSquare size={14} />}
          className="bg-main text-white hover:bg-main/90 disabled:bg-gray-300"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </LoaderButton>
      </div>
    </form>
  );
}