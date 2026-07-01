import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Wind, Users, Sprout, Cloud, Sun, Search, Home, Eye, Compass, Zap, Star, MessageCircle, Briefcase, Moon, Bed, HeartCrack, Infinity, Mountain } from 'lucide-react';
import { categories, stats, articles } from '@/data/mockData';
import ArticleCard from '@/components/ArticleCard';

const iconMap: Record<string, React.ElementType> = {
  Heart, Wind, Users, Sprout, Cloud, Sun,
  Home, Eye, Compass, Zap, Star, MessageCircle, Briefcase, Moon,
  Bed, HeartCrack, Infinity, Mountain,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomePage() {
  const featuredArticles = articles.slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative noise-bg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warm-50 via-warm-50 to-sage-50" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-sage-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-warm-500/10 blur-3xl" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 min-h-[85vh] flex items-center">
          <div className="max-w-2xl py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block text-sm font-medium text-sage-600 bg-sage-50 px-4 py-1.5 rounded-full mb-6">
                照见内心，重拾勇气
              </span>
            </motion.div>

            <motion.h1
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-700 leading-tight text-balance"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              你的每一种感受，
              <br />
              <span className="gradient-text">都值得被认真对待</span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-ink-100 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              我们不是心灵鸡汤，而是从专业心理学出发，用通俗易懂的方式帮助你理解自己当下的处境，走出精神内耗的漩涡。
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
            >
              <Link
                to="/search"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-sage-500 text-white rounded-full font-medium hover:bg-sage-600 transition-all duration-300 hover:shadow-lg hover:shadow-sage-500/25 hover:-translate-y-0.5"
              >
                <Search size={18} />
                描述你的感受
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/knowledge"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-ink-500 rounded-full font-medium border border-warm-200 hover:border-sage-200 hover:text-sage-600 transition-all duration-300 hover:shadow-md"
              >
                浏览知识库
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center p-8 rounded-2xl bg-warm-50/50 border border-warm-100/50"
              >
                <div className="font-serif text-4xl font-bold text-sage-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-ink-500 font-medium mb-1">{stat.label}</div>
                <div className="text-xs text-ink-50">{stat.source}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Category Section */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-serif text-3xl font-bold text-ink-700">
              探索心理知识
            </h2>
            <p className="mt-3 text-ink-100">
              选择你感兴趣的方向，开始了解自己
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {categories.map((category) => {
              const Icon = iconMap[category.icon];
              return (
                <motion.div key={category.id} variants={itemVariants}>
                  <Link
                    to={`/knowledge/${category.id}`}
                    className="group flex flex-col items-center p-5 rounded-2xl bg-white border border-warm-200/50 hover:border-sage-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-center"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300"
                      style={{ backgroundColor: category.color + '15' }}
                    >
                      {Icon && (
                        <Icon
                          size={24}
                          color={category.color}
                        />
                      )}
                    </div>
                    <span className="font-serif text-sm font-semibold text-ink-700 group-hover:text-sage-600 transition-colors">
                      {category.name}
                    </span>
                    <span className="text-xs text-ink-50 mt-1 line-clamp-2">
                      {category.description}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div
            className="flex items-end justify-between mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="font-serif text-3xl font-bold text-ink-700">
                精选文章
              </h2>
              <p className="mt-2 text-ink-100">
                从这里开始，读懂自己的内心
              </p>
            </div>
            <Link
              to="/knowledge"
              className="hidden sm:inline-flex items-center gap-1 text-sm text-sage-600 hover:text-sage-700 font-medium transition-colors"
            >
              查看全部 <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {featuredArticles.map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
                <ArticleCard article={article} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/knowledge"
              className="inline-flex items-center gap-1 text-sm text-sage-600 font-medium"
            >
              查看全部文章 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}