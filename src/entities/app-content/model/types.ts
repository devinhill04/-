export interface AppCategoryPost {
  title: string;
  url: string;
}

export interface AppCategory {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  subtitle: string;
  pain: string | null; // «Боль»: цитата пользователя, показывается на экране категории
  posts: AppCategoryPost[];
}

export interface AppContent {
  appId: string;
  channel: string;
  categories: AppCategory[];
}
