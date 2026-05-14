import FlexSearch from 'flexsearch';
import { ArticleMetadata } from '../types';

class SearchService {
  private index: any;
  private metadata: Map<string, ArticleMetadata> = new Map();

  constructor() {
    this.index = new FlexSearch.Document({
      document: {
        id: 'id',
        index: ['title', 'excerpt', 'tags', 'source'],
        store: true,
      },
      tokenize: 'forward',
      cache: true,
    });
  }

  public async addArticle(article: ArticleMetadata) {
    this.index.add(article);
    this.metadata.set(article.id, article);
  }

  public search(query: string) {
    if (!query) return [];
    
    const results = this.index.search(query, {
      limit: 20,
      enrich: true,
    });

    if (results.length === 0) return [];
    
    // FlexSearch returns results grouped by field if searching multiple fields
    // We need to flatten and deduplicate
    const flatResults = results.flatMap((r: any) => r.result);
    const uniqueIds = Array.from(new Set(flatResults));
    
    return uniqueIds.map(id => this.metadata.get(id as string)).filter(Boolean);
  }

  public getAll() {
    return Array.from(this.metadata.values());
  }

  public getById(id: string) {
    return this.metadata.get(id);
  }
}

export const searchService = new SearchService();
