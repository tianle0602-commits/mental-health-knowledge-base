import { Link } from 'react-router-dom';
import type { Article } from '@/types';
import { getCategoryInfo } from '@/data/mockData';
import { Clock } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const category = getCategoryInfo(article.category);

  return (
    <Link
      to={`/article/${article.id}`}
      className="group block rounded-2xl overflow-hidden bg-white border border-warm-200 hover:border-sage-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {category && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                backgroundColor: category.color + '18',
                color: category.color,
              }}
            >
              {category.name}
            </span>
          )}
          <span className="text-xs text-ink-50 flex items-center gap-1">
            <Clock size={12} />
            {article.readTime} 分钟
          </span>
        </div>
        <h3 className="font-serif text-lg font-semibold text-ink-700 mb-2 group-hover:text-sage-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-ink-100 leading-relaxed line-clamp-2">
          {article.summary}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs text-ink-50 bg-warm-50 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}