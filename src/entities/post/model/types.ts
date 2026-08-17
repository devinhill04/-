export interface Post {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  url: string;
  tags: string[];
  publishedAt?: string;
  channel?: string;
}
