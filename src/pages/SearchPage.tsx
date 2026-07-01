import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, BookOpen, Sparkles, RotateCcw, Lightbulb, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmotionWheel from '@/components/EmotionWheel';
import EmotionCards from '@/components/EmotionCards';
import { emotionWheel, type CoreEmotion, type SubEmotion } from '@/data/emotionWheel';
import { searchArticles } from '@/utils/search';
import { getKnowledgeSnippets, type KnowledgeSnippet } from '@/utils/knowledgeSnippets';
import { emotionFragments } from '@/utils/conversationEngine';

// ==================== 类型 ====================

interface ResultState {
  coreEmotion: CoreEmotion;
  subEmotion: SubEmotion;
  tag: string;
  articles: { id: string; title: string; summary: string }[];
  snippet: KnowledgeSnippet | null;
  understanding: string;
  suggestions: string[];
}

// ==================== 工具函数 ====================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildResult(
  coreEmotion: CoreEmotion,
  subEmotion: SubEmotion,
  tag: string,
): ResultState {
  const articleResults = searchArticles(tag + ' ' + subEmotion.name);
  const articles = articleResults.slice(0, 4).map(r => ({
    id: r.article.id,
    title: r.article.title,
    summary: r.article.summary,
  }));

  if (articles.length === 0) {
    const fallback = searchArticles(subEmotion.emotionKey);
    const fallbackArticles = fallback.slice(0, 4).map(r => ({
      id: r.article.id,
      title: r.article.title,
      summary: r.article.summary,
    }));
    articles.push(...fallbackArticles);
  }

  const snippets = getKnowledgeSnippets([subEmotion.emotionKey], 1);
  const snippet = snippets.length > 0 ? snippets[0] : null;

  const frags = emotionFragments[subEmotion.emotionKey];
  const understanding = frags
    ? pick(frags.validations)
    : `你选择了"${tag}"——这种感觉很真实，也很值得被认真对待。`;
  const suggestions = frags
    ? frags.suggestions.slice(0, 4)
    : ['试着把这种感受写下来，越具体越好', '找一个信任的人聊聊', '给自己一点时间，不要急着"好起来"', '如果持续很久，考虑寻求专业帮助'];

  return {
    coreEmotion,
    subEmotion,
    tag,
    articles,
    snippet,
    understanding,
    suggestions,
  };
}

// ==================== 组件 ====================

export default function SearchPage() {
  const [selectedCore, setSelectedCore] = useState<CoreEmotion | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubEmotion | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  const handleSelectCore = (emotion: CoreEmotion) => {
    setSelectedCore(emotion);
    setSelectedSub(null);
    setResult(null);
  };

  const handleDeselectCore = () => {
    setSelectedCore(null);
    setSelectedSub(null);
    setResult(null);
  };

  const handleSelectSub = (sub: SubEmotion) => {
    setSelectedSub(sub);
    setResult(null);
  };

  const handleBackFromCards = () => {
    setSelectedSub(null);
  };

  const handleSelectTag = (tag: string) => {
    if (!selectedCore || !selectedSub) return;
    const built = buildResult(selectedCore, selectedSub, tag);
    setResult(built);
  };

  const handleReset = () => {
    setSelectedCore(null);
    setSelectedSub(null);
    setResult(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-[800px] mx-auto px-4 py-6">
      {/* 页面标题 */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-700 mb-2">
          情绪罗盘
        </h1>
        <p className="text-sm text-ink-100 max-w-md mx-auto leading-relaxed">
          有时候，把自己的感受说出来本身就是一种治愈。
          从内圈开始，一步步找到此刻最贴近你的心情。
        </p>
      </motion.div>

      {/* 情绪轮盘 + 卡片区域 */}
      <AnimatePresence mode="wait">
        {!result && (
          <motion.div
            key="wheel-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
          >
            {/* 双层轮盘 */}
            <EmotionWheel
              emotions={emotionWheel}
              selectedCore={selectedCore}
              onSelectCore={handleSelectCore}
              onDeselectCore={handleDeselectCore}
              onSelectSub={handleSelectSub}
            />

            {/* 子情绪标签卡片 */}
            <AnimatePresence>
              {selectedSub && selectedCore && (
                <EmotionCards
                  key={selectedSub.name}
                  subEmotion={selectedSub}
                  coreEmotion={selectedCore}
                  onSelectTag={handleSelectTag}
                  onBack={handleBackFromCards}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* 结果展示 */}
        {result && (
          <motion.div
            key="result-area"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* 顶部导航 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{result.coreEmotion.emoji}</span>
                <div className="flex flex-wrap items-center gap-x-1">
                  <span className="text-xs text-ink-50">{result.coreEmotion.name}</span>
                  <span className="text-xs text-ink-30">→</span>
                  <span className="text-xs font-medium" style={{ color: result.coreEmotion.color }}>
                    {result.subEmotion.name}
                  </span>
                  <span className="text-xs text-ink-30">→</span>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: result.coreEmotion.lightColor,
                      color: result.coreEmotion.color,
                    }}
                  >
                    {result.tag}
                  </span>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-ink-50 hover:text-ink-100 hover:bg-warm-100 transition-colors"
              >
                <RotateCcw size={13} />
                重新选择
              </button>
            </div>

            {/* 情绪理解卡片 */}
            <motion.div
              className="p-5 rounded-2xl border shadow-sm"
              style={{
                borderColor: result.coreEmotion.lightColor,
                backgroundColor: `${result.coreEmotion.lightColor}40`,
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} style={{ color: result.coreEmotion.color }} />
                <h3 className="font-serif font-semibold text-ink-700">关于你的感受</h3>
              </div>
              <p className="text-sm text-ink-100 leading-relaxed">
                {result.understanding}
              </p>
            </motion.div>

            {/* 知识片段 */}
            {result.snippet && (
              <motion.div
                className="p-5 rounded-2xl border bg-white shadow-sm"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-warm-500" />
                  <h3 className="font-serif font-semibold text-ink-700">心理学视角</h3>
                </div>
                <p className="text-sm text-ink-100 leading-relaxed mb-2">
                  {result.snippet.text}
                </p>
                <p className="text-xs text-ink-50">
                  —— {result.snippet.source}
                </p>
              </motion.div>
            )}

            {/* 建议列表 */}
            <motion.div
              className="p-5 rounded-2xl border bg-white shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-sage-500" />
                <h3 className="font-serif font-semibold text-ink-700">你可以试试</h3>
              </div>
              <ul className="space-y-2.5">
                {result.suggestions.map((s, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-ink-100 leading-relaxed"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                      style={{ backgroundColor: result.coreEmotion.color }}
                    >
                      {i + 1}
                    </span>
                    {s}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* 推荐文章 */}
            {result.articles.length > 0 && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-sage-500" />
                  <h3 className="font-serif font-semibold text-ink-700">推荐文章</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.articles.map((article, i) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + i * 0.06 }}
                    >
                      <Link
                        to={`/article/${article.id}`}
                        className="block p-4 rounded-2xl border border-warm-150 bg-white hover:border-sage-200 hover:shadow-md hover:shadow-sage-500/5 transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-serif font-medium text-sm text-ink-700 group-hover:text-sage-600 transition-colors leading-snug">
                            {article.title}
                          </h4>
                          <ExternalLink
                            size={14}
                            className="text-ink-30 group-hover:text-sage-400 transition-colors flex-shrink-0 ml-2 mt-0.5"
                          />
                        </div>
                        <p className="text-xs text-ink-50 mt-1.5 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 底部 */}
            <motion.div
              className="text-center pt-4 pb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-ink-50 mb-3">
                如果这些不太符合你的感受，可以重新选择
              </p>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  backgroundColor: result.coreEmotion.lightColor,
                  color: result.coreEmotion.color,
                }}
              >
                <RotateCcw size={14} className="inline mr-1.5" />
                回到情绪轮盘
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      {!result && (
        <motion.p
          className="text-center text-xs text-ink-40 mt-10 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          你的感受是真实的，也是值得被认真对待的。
        </motion.p>
      )}
    </div>
  );
}