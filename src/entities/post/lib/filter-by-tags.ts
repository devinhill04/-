import { Post } from '../model/types';

/**
 * Clean tag string by removing leading '#' and trimming whitespace
 */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, '').toLowerCase();
}

/**
 * Filter posts by selected hashtags.
 * Case-insensitive match on post.tags array as well as hashtags in title/description.
 * Ensures exact tag matching without false partial-word substring matches.
 */
export function filterPostsByTags(posts: Post[], selectedTags: string[]): Post[] {
  if (!selectedTags || selectedTags.length === 0) return posts;

  const normalizedSelected = selectedTags.map(normalizeTag).filter(Boolean);
  if (normalizedSelected.length === 0) return posts;

  return posts.filter((post) => {
    const postNormalizedTags = (post.tags || []).map(normalizeTag);

    // Check if post has any of the selected tags in its tags array
    const hasMatchingTag = normalizedSelected.some((selTag) =>
      postNormalizedTags.includes(selTag)
    );

    if (hasMatchingTag) return true;

    // Check if post title or description contains exact hashtag (e.g. #music)
    const textToSearch = `${post.title} ${post.description}`.toLowerCase();
    return normalizedSelected.some((selTag) => {
      // Regex for exact hashtag match: #selTag followed by word boundary or space/punctuation
      const hashtagRegex = new RegExp(`#${selTag}\\b`, 'i');
      return hashtagRegex.test(textToSearch);
    });
  });
}
