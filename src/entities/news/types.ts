export type NewsStatus = 'draft' | 'published' | 'archived';

export type NewsPost = {
  id: string;
  title: string;
  body?: string | null;
  image_key?: string | null;
  status: NewsStatus;
  published_at?: string | null;
  created_at?: string | null;
};
