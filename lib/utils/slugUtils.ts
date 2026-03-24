/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug (lowercase, hyphens instead of spaces)
 */
export const generateSlug = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')             // Trim hyphens from start
    .replace(/-+$/, '');            // Trim hyphens from end
};

/**
 * Generate category slug from category name
 * @param categoryName - The category name to convert
 * @returns URL-friendly category slug
 */
export const generateCategorySlug = (categoryName: string): string => {
  return generateSlug(categoryName);
};

/**
 * Examples of slug generation:
 * "Kitchen Accessories" → "kitchen-accessories"
 * "Home Essentials" → "home-essentials"
 * "Baby Essentials" → "baby-essentials"
 * "Electronics & Gadgets" → "electronics-gadgets"
 * "  Health & Beauty  " → "health-beauty"
 */