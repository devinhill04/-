export interface Pain {
  slug: string;
  title: string;
  description: string;
}

export interface PainSolution {
  id: string;
  painSlug: string;
  title: string;
  channel: string;
  url: string;
}
