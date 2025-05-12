import {
  sql,
  query,
} from '@/platforms/postgres';
import {
  CommentDb,
  CommentDbInsert,
  Comment,
  parseCommentFromDb,
  GetCommentsOptions,
} from '@/comment';

// Create the comments table with JIT creation pattern
const createCommentsTable = () =>
  sql`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(8) PRIMARY KEY,
      photo_id VARCHAR(8) NOT NULL,
      content TEXT NOT NULL,
      commenter_name VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create an index for efficient photo-based queries
    CREATE INDEX IF NOT EXISTS idx_comments_photo_created 
    ON comments(photo_id, created_at DESC);
  `;

// Safe wrapper for comment queries with JIT table creation
const safelyQueryComments = async <T>(
  callback: () => Promise<T>,
  queryLabel: string,
): Promise<T> => {
  let result: T;

  try {
    result = await callback();
  } catch (e: any) {
    // Handle table creation on first access
    if (/relation "comments" does not exist/i.test(e.message)) {
      console.log('Creating comments table ...');
      await createCommentsTable();
      result = await callback();
    } else if (/endpoint is in transition/i.test(e.message)) {
      console.log('SQL query error: endpoint is in transition (setting timeout)');
      await new Promise(resolve => setTimeout(resolve, 5000));
      try {
        result = await callback();
      } catch (e: any) {
        console.log(`SQL query error on retry (after 5000ms): ${e.message}`);
        throw e;
      }
    } else {
      console.log(`SQL query error (${queryLabel}): ${e.message}`);
      throw e;
    }
  }

  return result;
};

// Insert a new comment
export const insertComment = (comment: CommentDbInsert) =>
  safelyQueryComments(() => sql`
    INSERT INTO comments (
      id,
      photo_id,
      content,
      commenter_name
    )
    VALUES (
      ${comment.id},
      ${comment.photoId},
      ${comment.content},
      ${comment.commenterName}
    )
  `, 'insertComment');

// Update an existing comment
export const updateComment = (comment: CommentDbInsert) =>
  safelyQueryComments(() => sql`
    UPDATE comments SET
      content=${comment.content},
      commenter_name=${comment.commenterName},
      updated_at=${new Date().toISOString()}
    WHERE id=${comment.id}
  `, 'updateComment');

// Delete a comment
export const deleteComment = (id: string) =>
  safelyQueryComments(() => sql`
    DELETE FROM comments WHERE id=${id}
  `, 'deleteComment');

// Get all comments for a specific photo
export const getComments = async (
  photoId: string,
  options: GetCommentsOptions = {},
): Promise<Comment[]> =>
  safelyQueryComments(async () => {
    const { limit = 50, offset = 0, orderBy = 'asc' } = options;

    // Build the order clause based on the orderBy option
    const orderClause = orderBy === 'desc' ? 'ORDER BY created_at DESC' : 'ORDER BY created_at ASC';

    return query<CommentDb>(
      `SELECT * FROM comments 
       WHERE photo_id = $1 
       ${orderClause}
       LIMIT $2 OFFSET $3`,
      [photoId, limit, offset],
    )
      .then(({ rows }) => rows.map(parseCommentFromDb));
  }, 'getComments');

// Get comment count for a photo
export const getCommentCount = async (photoId: string): Promise<number> =>
  safelyQueryComments(() => sql`
    SELECT COUNT(*) FROM comments WHERE photo_id=${photoId}
  `
    .then(({ rows }) => parseInt(rows[0].count, 10))
  , 'getCommentCount');

// Get a single comment by ID
export const getComment = async (id: string): Promise<Comment | undefined> =>
  safelyQueryComments(async () => {
    return sql<CommentDb>`SELECT * FROM comments WHERE id=${id} LIMIT 1`
      .then(({ rows }) => rows.map(parseCommentFromDb))
      .then(comments => comments.length > 0 ? comments[0] : undefined);
  }, 'getComment');

// Get the most recent comment from all photos (useful for activity feeds)
export const getMostRecentComments = async (limit: number = 10): Promise<Comment[]> =>
  safelyQueryComments(async () => {
    return query<CommentDb>(
      `SELECT * FROM comments 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit],
    )
      .then(({ rows }) => rows.map(parseCommentFromDb));
  }, 'getMostRecentComments');

// Delete all comments for a photo (useful when deleting photos)
export const deleteCommentsForPhoto = async (photoId: string) =>
  safelyQueryComments(() => sql`
    DELETE FROM comments WHERE photo_id=${photoId}
  `, 'deleteCommentsForPhoto');