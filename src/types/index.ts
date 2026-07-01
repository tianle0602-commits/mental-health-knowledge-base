export type Category =
  | 'emotion'
  | 'stress'
  | 'relationship'
  | 'self-growth'
  | 'anxiety'
  | 'teenager'
  | 'family-origin'
  | 'mindfulness'
  | 'self-awareness'
  | 'procrastination'
  | 'self-esteem'
  | 'social-anxiety'
  | 'workplace'
  | 'grief'
  | 'trauma-healing'
  | 'sleep-mental-health'
  | 'meaning-purpose'
  | 'attachment';

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: Category;
  tags: string[];
  keywords: string[];
  readTime: number;
  coverImage: string;
  keyConcept?: {
    term: string;
    explanation: string;
  };
  relatedIds: string[];
  createdAt: string;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface SearchResult {
  article: Article;
  matchScore: number;
  matchedKeywords: string[];
}

export interface EmotionAnalysis {
  /** 检测到的核心情绪 */
  primaryEmotion: string;
  /** 情绪强度 (1-10) */
  intensity: number;
  /** 对用户处境的理解与解读（个性化文本，200-300字） */
  understanding: string;
  /** 推荐的行动建议（3-5条，每条30-50字） */
  suggestions: string[];
  /** 匹配的文章分类 */
  matchedCategories: string[];
  /** 一句温暖的鼓励语 */
  encouragement: string;
}

export interface SearchPageState {
  query: string;
  emotionAnalysis: EmotionAnalysis | null;
  results: SearchResult[];
  isAnalyzing: boolean;
  hasSearched: boolean;
}

export interface StatItem {
  value: string;
  label: string;
  source: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'sad' | 'terrible';
  content: string;
}

// ==================== 对话系统类型 ====================

/** 对话阶段 */
export type ConversationStage =
  | 'greeting'       // 初始问候
  | 'listening'      // 用户第一次描述感受
  | 'validating'     // 接住情绪、共情回应
  | 'exploring'      // 追问、深入了解
  | 'deepening'      // 更深层的理解
  | 'insight'        // 引入心理学知识
  | 'suggesting'     // 给出建议和方向
  | 'closing';       // 收尾

/** 对话消息 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** 助手消息附带的情绪分析 */
  emotionDetected?: string;
  /** 助手消息附带的推荐文章 */
  suggestedArticles?: {
    id: string;
    title: string;
    summary: string;
  }[];
  /** 助手消息附带的追问选项 */
  followUpQuestions?: string[];
}

/** 对话会话 */
export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  stage: ConversationStage;
  detectedEmotions: string[];
}

/** 对话引擎处理结果 */
export interface ConversationResponse {
  /** 助手回复文本 */
  message: string;
  /** 检测到的情绪 */
  detectedEmotion: string;
  /** 推荐的文章 */
  suggestedArticles: {
    id: string;
    title: string;
    summary: string;
  }[];
  /** 追问问题（供快捷回复） */
  followUpQuestions: string[];
  /** 更新后的对话阶段 */
  newStage: ConversationStage;
}