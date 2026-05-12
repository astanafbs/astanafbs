export type NewsStatus = 'draft' | 'published' | 'archived';

export type NewsPost = {
  id: string;
  title: string;
  body?: string;
  imageKey?: string;
  tag?: string;
  status: NewsStatus;
  publishedAt?: string;
};
