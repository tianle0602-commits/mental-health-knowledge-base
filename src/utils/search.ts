import type { Article, SearchResult } from '@/types';
import { articles } from '@/data/mockData';
import { analyzeEmotion } from './emotionAnalysis';

/**
 * 计算两个字符串的相似度（基于共同字符的简单方法）
 */
function getSimilarityScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // 完全匹配
  if (s1 === s2) return 100;
  // 包含关系
  if (s1.includes(s2) || s2.includes(s1)) return 80;

  // 计算共同字符比例
  const set1 = new Set(s1.replace(/\s+/g, ''));
  const set2 = new Set(s2.replace(/\s+/g, ''));
  let common = 0;
  for (const c of set1) {
    if (set2.has(c)) common++;
  }
  const maxLen = Math.max(set1.size, set2.size);
  if (maxLen === 0) return 0;

  return Math.round((common / maxLen) * 50);
}

/**
 * 将查询词拆分为有意义的词组
 */
function tokenizeQuery(query: string): string[] {
  const cleaned = query.toLowerCase().replace(/[，。！？、；：""''（）【】《》\s]+/g, ' ').trim();
  const rawTokens = cleaned.split(' ').filter(t => t.length > 0);

  // 对长查询也尝试拆分出更短的子词
  const tokens: string[] = [];
  for (const token of rawTokens) {
    tokens.push(token);
    // 对于较长的中文词组，也加入2字子串
    if (token.length >= 4) {
      for (let i = 0; i <= token.length - 2; i++) {
        const sub = token.slice(i, i + 2);
        if (sub.length === 2 && !tokens.includes(sub)) {
          tokens.push(sub);
        }
      }
    }
  }

  return [...new Set(tokens)];
}

/**
 * 改进的文章搜索：结合关键词匹配 + 情绪分析
 */
export function searchArticles(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const queryLower = query.toLowerCase();
  const tokens = tokenizeQuery(query);
  const results: Map<string, { article: Article; score: number; matchedKeywords: string[] }> = new Map();

  // 情绪分析（用于类别加成）
  const emotionAnalysis = analyzeEmotion(query);
  const emotionCategories = new Set(emotionAnalysis.matchedCategories);

  for (const article of articles) {
    const matchedKeywords: string[] = [];
    let score = 0;

    // 1. 关键词匹配（使用分词后的 token 进行更精确匹配）
    for (const keyword of article.keywords) {
      const keywordLower = keyword.toLowerCase();

      // 精确包含
      if (queryLower.includes(keywordLower)) {
        matchedKeywords.push(keyword);
        score += 25;
      }
      // 反向包含（关键词包含查询的部分）
      else if (keywordLower.includes(queryLower) && queryLower.length >= 2) {
        matchedKeywords.push(keyword);
        score += 20;
      }
      // 分词匹配
      else {
        for (const token of tokens) {
          if (token.length >= 2 && (keywordLower.includes(token) || token.includes(keywordLower))) {
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
            score += 12;
            break;
          }
        }
      }
    }

    // 2. 标题匹配
    const titleLower = article.title.toLowerCase();
    if (titleLower.includes(queryLower)) {
      score += 35;
    } else {
      for (const token of tokens) {
        if (token.length >= 2 && titleLower.includes(token)) {
          score += 15;
        }
      }
    }

    // 3. 摘要匹配
    const summaryLower = article.summary.toLowerCase();
    if (summaryLower.includes(queryLower)) {
      score += 20;
    } else {
      for (const token of tokens) {
        if (token.length >= 2 && summaryLower.includes(token)) {
          score += 8;
        }
      }
    }

    // 4. 标签匹配
    for (const tag of article.tags) {
      const tagLower = tag.toLowerCase();
      if (queryLower.includes(tagLower)) {
        score += 15;
      } else {
        for (const token of tokens) {
          if (token.length >= 2 && tagLower.includes(token)) {
            score += 8;
            break;
          }
        }
      }
    }

    // 5. 情绪分析类别加成 —— 这是关键改进！
    // 如果文章类别匹配情绪分析结果，大幅加分
    if (emotionCategories.has(article.category)) {
      score += 30;
    }

    // 6. 情绪语义关联：如果文章的关键词与情绪分析的情绪名称有语义关联，也加分
    // 这里通过情绪分析结果中的类别来间接关联

    if (score > 0) {
      results.set(article.id, {
        article,
        score,
        matchedKeywords: [...new Set(matchedKeywords)],
      });
    }
  }

  // 如果通过上述匹配没有结果，使用情绪分析类别作为兜底
  if (results.size === 0 && emotionCategories.size > 0) {
    for (const article of articles) {
      if (emotionCategories.has(article.category)) {
        results.set(article.id, {
          article,
          score: 40, // 基于情绪分析的兜底匹配
          matchedKeywords: [],
        });
      }
    }
  }

  // 如果还是没有结果，返回所有文章作为参考
  if (results.size === 0) {
    for (const article of articles) {
      results.set(article.id, {
        article,
        score: 15,
        matchedKeywords: [],
      });
    }
  }

  return Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .map(r => ({
      article: r.article,
      matchScore: Math.min(Math.round(r.score), 100),
      matchedKeywords: r.matchedKeywords,
    }));
}

/**
 * 获取情绪分析结果（导出供页面使用）
 */
export { analyzeEmotion };