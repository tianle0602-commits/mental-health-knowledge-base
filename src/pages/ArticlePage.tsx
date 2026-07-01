import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Lightbulb } from 'lucide-react';
import { getArticleById, getRelatedArticles, getCategoryInfo } from '@/data/mockData';
import ArticleCard from '@/components/ArticleCard';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const article = getArticleById(id || '');
  const category = article ? getCategoryInfo(article.category) : null;
  const relatedArticles = article ? getRelatedArticles(article) : [];

  if (!article) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-2xl text-ink-700 mb-4">文章未找到</h1>
        <Link to="/knowledge" className="text-sage-600 hover:text-sage-700 font-medium">
          返回知识库
        </Link>
      </div>
    );
  }

  // Parse markdown content to HTML-like structure
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="font-serif text-2xl font-bold text-ink-700 mt-10 mb-4">
            {line.replace('## ', '')}
          </h2>
        );
        i++;
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="font-serif text-xl font-semibold text-ink-700 mt-8 mb-3">
            {line.replace('### ', '')}
          </h3>
        );
        i++;
      } else if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ')) {
        const match = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*[:：]?\s*(.*)/);
        if (match) {
          elements.push(
            <div key={i} className="flex gap-3 mt-4 ml-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center text-sm font-semibold">
                {match[1]}
              </span>
              <div>
                <strong className="text-ink-700">{match[2]}</strong>
                {match[3] && <p className="text-ink-100 mt-1">{match[3]}</p>}
              </div>
            </div>
          );
        }
        i++;
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="text-ink-100 ml-6 mt-2 list-disc">
            {line.replace('- ', '')}
          </li>
        );
        i++;
      } else if (line.trim() === '') {
        i++;
        continue;
      } else {
        // For bold text within paragraphs
        const processed = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink-700">$1</strong>');
        if (processed !== line || line.length > 0) {
          elements.push(
            <p key={i} className="text-ink-100 leading-relaxed mt-3" dangerouslySetInnerHTML={{ __html: processed }} />
          );
        }
        i++;
      }
    }

    return elements;
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="max-w-[720px] mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/knowledge"
            className="inline-flex items-center gap-1.5 text-sm text-ink-50 hover:text-ink-700 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            返回知识库
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            {category && (
              <span
                className="text-sm px-3 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: category.color + '18',
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            )}
            <span className="text-sm text-ink-50 flex items-center gap-1">
              <Clock size={14} />
              {article.readTime} 分钟阅读
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-700 leading-tight">
            {article.title}
          </h1>
        </motion.div>

        {/* Cover Image */}
        <motion.div
          className="mt-8 rounded-2xl overflow-hidden aspect-[16/9]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Key Concept Card */}
        {article.keyConcept && (
          <motion.div
            className="mt-8 p-5 rounded-2xl border border-sage-200 bg-sage-50/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={18} className="text-warm-500" />
              <span className="font-serif font-semibold text-ink-700">核心概念：{article.keyConcept.term}</span>
            </div>
            <p className="text-ink-100 text-sm leading-relaxed">
              {article.keyConcept.explanation}
            </p>
          </motion.div>
        )}

        {/* Article Content */}
        <motion.article
          className="mt-8 pb-12 border-b border-warm-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {renderContent(article.content)}
        </motion.article>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm text-ink-50 bg-warm-50 px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-serif text-2xl font-bold text-ink-700 mb-6">
              相关文章
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedArticles.map((ra) => (
                <ArticleCard key={ra.id} article={ra} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}