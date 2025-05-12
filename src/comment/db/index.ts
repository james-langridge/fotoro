// Re-export all database query functions
export {
  insertComment,
  updateComment,
  deleteComment,
  getComments,
  getCommentCount,
  getComment,
  getMostRecentComments,
  deleteCommentsForPhoto,
} from './query';

// Export types and utilities from the main comment module
export type {
  Comment,
  CommentDb,
  CommentDbInsert,
  GetCommentsOptions,
} from '../index';

export {
  parseCommentFromDb,
  convertCommentToDb,
} from '../index';