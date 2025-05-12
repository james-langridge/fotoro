// src/comment/dateUtils.ts

/**
 * Safely converts a value that might be a Date object or a date string into a Date object
 * This is useful when dealing with data from APIs where dates get serialized as strings
 */
export const ensureDateObject = (dateValue: Date | string): Date => {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    // Check if the parsed date is valid
    if (isNaN(parsed.getTime())) {
      console.warn('Invalid date string provided:', dateValue);
      return new Date(); // Fallback to current date
    }
    return parsed;
  }

  console.warn('Unexpected date type:', typeof dateValue);
  return new Date(); // Fallback to current date
};

/**
 * Parse comments data from API response, ensuring dates are properly converted
 */
export const parseCommentsFromApi = (apiResponse: any[]): any[] => {
  return apiResponse.map(comment => ({
    ...comment,
    createdAt: ensureDateObject(comment.createdAt),
    updatedAt: ensureDateObject(comment.updatedAt),
  }));
};