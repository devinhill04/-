import { Post } from '../model/types';

export function filterPosts(posts: Post[], query: string, selectedTags: string[] = []): Post[] {
  return posts.filter((post) => {
    const matchesQuery = query.trim() === '' || 
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.description.toLowerCase().includes(query.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every((t) => post.tags.map((pt) => pt.toLowerCase()).includes(t.toLowerCase()));

    return matchesQuery && matchesTags;
  });
}
