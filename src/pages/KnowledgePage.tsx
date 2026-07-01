import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { categories, articles, getCategoryInfo } from '@/data/mockData';
import ArticleCard from '@/components/ArticleCard';

export default function KnowledgePage() {
  const { category } = useParams<{ category?: string }>();
  const [activeCategory, setActiveCategory] = useState<string>(category || 'all');

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') return articles;
    return articles.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-3xl font-bold text-ink-700">知识库</h1>
        <p className="mt-2 text-ink-100">
          选择分类，探索你感兴趣的心理学知识
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        className="flex flex-wrap gap-2 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === 'all'
              ? 'bg-sage-500 text-white shadow-sm'
              : 'bg-white text-ink-100 border border-warm-200 hover:border-sage-200 hover:text-ink-700'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === cat.id
                ? 'text-white shadow-sm'
                : 'bg-white text-ink-100 border border-warm-200 hover:border-sage-200 hover:text-ink-700'
            }`}
            style={
              activeCategory === cat.id
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            {cat.name}
          </button>
        ))}
      </motion.div>

      {/* Article Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-ink-100 text-lg">该分类下暂无文章</p>
              <Link
                to="/knowledge"
                className="inline-block mt-4 text-sage-600 hover:text-sage-700 font-medium"
              >
                查看全部文章
              </Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}