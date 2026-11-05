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

// Тег: подборка постов для вкладки «Поиск по тегам». У постов-картинок (комиксы) подписи может не быть — title: null
export interface AppTagPost {
  url: string;
  title: string | null;
}

export interface AppTag {
  tag: string; // без «#»
  posts: AppTagPost[];
}

export interface AppContent {
  appId: string;
  channel: string;
  categories: AppCategory[];
  tags?: AppTag[];
}
