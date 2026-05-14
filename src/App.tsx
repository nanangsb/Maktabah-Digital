/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Search, Tag, BookOpen, Clock, Globe, Menu, X, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import fm from 'front-matter';
import { searchService } from './services/searchService';
import { ArticleMetadata, Article } from './types';
import { cn } from './lib/utils';

// This will be replaced by your real files later
const rawArticles = import.meta.glob('./data/**/*.md', { query: '?raw', import: 'default', eager: true });

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Parse articles on mount
  const articles = useMemo(() => {
    const parsed: Article[] = Object.entries(rawArticles).map(([path, content]) => {
      const { attributes, body: text } = fm(content as string);
      const data = attributes as any;
      
      // Buat ID berdasarkan path relatif dari folder data agar unik
      // Contoh: ./data/2024/05/artikel.md -> 2024/05/artikel
      const id = path
        .replace('./data/', '')
        .replace('.md', '');
      
      const article: Article = {
        id,
        title: data.title || 'Untitled',
        author: data.author,
        date: data.date,
        tags: data.tags || [],
        source: data.source || 'Unknown',
        excerpt: data.excerpt || text.substring(0, 200) + '...',
        content: text,
        contentLength: text.length,
      };
      
      searchService.addArticle(article);
      return article;
    });
    return parsed;
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const t = params.get('t');
    const id = params.get('id');

    if (q) setSearchTerm(q);
    if (t) setSelectedTag(t);
    if (id) setSelectedArticleId(id);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('t');
    url.searchParams.delete('id');

    if (searchTerm) url.searchParams.set('q', searchTerm);
    if (selectedTag) url.searchParams.set('t', selectedTag);
    if (selectedArticleId) url.searchParams.set('id', selectedArticleId);

    window.history.replaceState({}, '', url.toString());
  }, [searchTerm, selectedTag, selectedArticleId]);

  useEffect(() => {
    // Simulate index loading
    setTimeout(() => setIsLoading(false), 800);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (searchTerm) {
      return searchService.search(searchTerm) as ArticleMetadata[];
    }
    if (selectedTag) {
      return articles.filter(a => a.tags.includes(selectedTag));
    }
    return articles;
  }, [searchTerm, selectedTag, articles]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    articles.forEach(a => a.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [articles]);

  const selectedArticle = useMemo(() => 
    articles.find(a => a.id === selectedArticleId),
    [selectedArticleId, articles]
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -256, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -256, opacity: 0 }}
            className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm"
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center rounded-lg shadow-sm">
                  <BookOpen className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">Maktabah</h1>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Digital Library</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              <section>
                <h3 className="px-3 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">Navigasi</h3>
                <div className="space-y-1">
                  <button 
                    onClick={() => { setSelectedTag(null); setSelectedArticleId(null); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all",
                      !selectedTag && !selectedArticleId 
                        ? "bg-emerald-50 text-emerald-700 shadow-xs" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Semua Artikel
                  </button>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between px-3 mb-3">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Kategori</h3>
                  <Tag className="w-3 h-3 text-slate-300" />
                </div>
                <div className="space-y-1">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => { setSelectedTag(tag); setSelectedArticleId(null); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group transition-all",
                        selectedTag === tag 
                          ? "bg-emerald-50 text-emerald-700 font-semibold" 
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60" />
                        {tag}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full transition-colors",
                        selectedTag === tag ? "bg-emerald-200" : "bg-slate-100 text-slate-400"
                      )}>
                        {articles.filter(a => a.tags.includes(tag)).length}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
            
            <div className="p-4 mt-auto">
              <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
                <p className="text-[9px] mb-2 text-slate-400 uppercase font-bold tracking-widest">DEPLOYMENT STATUS</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-400">{articles.length} Dimuat</span>
                </div>
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors">
                  GitHub Synced
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full bg-slate-50/50">
        {/* Header/Search */}
        <header className="h-20 px-8 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-6 flex-1 max-w-3xl">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="Cari ribuan artikel dengan Elasticsearch..."
                className="w-full pl-12 pr-6 py-3 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-6 pl-6 border-l border-slate-200 sm:flex hidden">
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-slate-900 leading-none">42.8ms</span>
               <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">KECEPATAN</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300" />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedArticle ? (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto py-16 px-8"
            >
              <button 
                onClick={() => setSelectedArticleId(null)}
                className="mb-10 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors uppercase tracking-widest"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> KEMBALI KE DAFTAR
              </button>
              
              <div className="mb-12">
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedArticle.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-widest border border-slate-200">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-4xl sm:text-5xl font-serif italic text-slate-900 mb-8 leading-tight underline decoration-emerald-500/20 decoration-8 underline-offset-4">
                  {selectedArticle.title}
                </h2>
                <div className="flex flex-wrap items-center gap-8 text-xs text-slate-500 font-mono">
                  {selectedArticle.author && (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                        {selectedArticle.author.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{selectedArticle.author}</span>
                    </div>
                  )}
                  {selectedArticle.date && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 opacity-40" />
                      {selectedArticle.date}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 opacity-40" />
                    <span className="text-emerald-600 font-bold">{selectedArticle.source}</span>
                  </div>
                </div>
              </div>
              
              <div className="prose prose-slate max-w-none prose-p:text-lg prose-p:leading-relaxed prose-headings:font-serif prose-headings:italic prose-a:text-emerald-600 prose-img:rounded-xl">
                <Markdown>{selectedArticle.content}</Markdown>
              </div>
            </motion.div>
          ) : (
            <div className="p-8 max-w-[1400px] mx-auto">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-lg font-bold text-slate-900 border-b-2 border-emerald-500 pb-1">Artikel Terbaru</h3>
                <div className="flex gap-2">
                  <div className="p-2 border border-slate-200 rounded text-slate-400 cursor-not-allowed">
                    <Menu className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredArticles.map((article, idx) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedArticleId(article.id)}
                    className="group bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between cursor-pointer hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {article.tags[0] || 'UMUM'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">markdown • {Math.round((article.contentLength || 0) / 1024)}kb</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors leading-snug">
                        {article.title}
                      </h3>
                      
                      <p className="text-xs text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-900">{article.source}</span>
                        <span className="text-[10px] text-slate-400">{article.date || 'Januari 2024'}</span>
                      </div>
                      <button className="text-emerald-600 text-[11px] font-black uppercase tracking-widest group-hover:underline">BACA ARTIKEL</button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredArticles.length === 0 && (
                <div className="py-32 text-center bg-white rounded-2xl border border-slate-100 shadow-sm mt-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-serif italic mb-3 text-slate-900">Hasil tidak ditemukan</h3>
                  <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                    Coba gunakan kata kunci yang lebih umum atau periksa kembali filter kategori Anda.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <footer className="h-12 bg-white border-t border-slate-200 flex items-center px-8 justify-between z-10">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">GitHub: Synced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Elasticsearch: OK</span>
            </div>
          </div>
          <div className="flex gap-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total: {articles.length} Artikel</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Versi: 2.1.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
