export interface ArticleMetadata {
  id: string;
  title: string;
  author?: string;
  date?: string;
  tags: string[];
  source: string;
  excerpt: string;
  contentLength?: number;
}

export interface Article extends ArticleMetadata {
  content: string;
}

export interface SearchResult {
  id: string;
  score: number;
}
