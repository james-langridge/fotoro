export interface CommentDb {
    id: string;
    photo_id: string;
    content: string;
    commenter_name?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Comment {
    id: string;
    photoId: string;
    content: string;
    commenterName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CommentDbInsert {
    id: string;
    photoId: string;
    content: string;
    commenterName?: string;
}

// Options for querying comments
export interface GetCommentsOptions {
    limit?: number;
    offset?: number;
    orderBy?: 'asc' | 'desc';
}

// Parse function to convert database row to frontend Comment object
export const parseCommentFromDb = (dbComment: CommentDb): Comment => ({
  id: dbComment.id,
  photoId: dbComment.photo_id,
  content: dbComment.content,
  commenterName: dbComment.commenter_name,
  createdAt: dbComment.created_at,
  updatedAt: dbComment.updated_at,
});

// Convert Comment back to database format for updates
export const convertCommentToDb = (comment: CommentDbInsert): CommentDb => ({
  id: comment.id,
  photo_id: comment.photoId,
  content: comment.content,
  commenter_name: comment.commenterName,
  created_at: new Date(),
  updated_at: new Date(),
});