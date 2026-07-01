/**
 * 中文NLP工具模块
 * 提供分词、否定词检测、同义词扩展、关键短语提取等功能
 * 用于增强感觉搜索的情绪识别和对话理解能力
 */

// ==================== 否定词检测 ====================

/** 中文否定词列表 */
const NEGATION_WORDS = [
  '不', '没', '无', '非', '别', '未', '莫', '勿', '休', '否',
  '没有', '不是', '不会', '不能', '不想', '不要', '不敢',
  '从不', '从未', '绝不', '毫无', '并非',
];

/** 否定+正向词 = 负向情绪的映射 */
const NEGATION_TO_EMOTION: Record<string, string> = {
  '不开心': '难过',
  '不快乐': '难过',
  '不高兴': '难过',
  '不舒服': '焦虑',
  '不好受': '难过',
  '不对劲': '焦虑',
  '不安': '焦虑',
  '不踏实': '焦虑',
  '不满意': '失望',
  '不喜欢': '烦躁',
  '不想动': '疲惫',
  '不想说话': '压抑',
  '不想理人': '烦躁',
  '不想活了': '崩溃',
  '没意思': '空虚',
  '没劲': '空虚',
  '没兴趣': '空虚',
  '没动力': '疲惫',
  '没希望': '无助',
  '没办法': '无助',
  '没人在乎': '孤独',
  '没人理解': '孤独',
  '没人懂': '孤独',
  '没价值': '自责',
  '没用': '自责',
  '不行': '自责',
  '不配': '羞耻',
  '不好': '难过',
  '不能': '无助',
  '不敢': '恐惧',
  '不会': '迷茫',
  '不知道': '迷茫',
  '不确定': '迷茫',
};

/**
 * 检测否定词模式，返回对应的情绪标签
 */
export function detectNegationPatterns(text: string): string | null {
  const cleaned = text.toLowerCase().replace(/\s+/g, '');
  for (const [pattern, emotion] of Object.entries(NEGATION_TO_EMOTION)) {
    if (cleaned.includes(pattern)) {
      return emotion;
    }
  }
  return null;
}

/**
 * 检查文本是否包含否定词
 */
export function hasNegation(text: string): boolean {
  return NEGATION_WORDS.some(w => text.includes(w));
}

// ==================== 同义词扩展 ====================

/** 情绪同义词库 */
const EMOTION_SYNONYMS: Record<string, string[]> = {
  '焦虑': ['紧张', '心慌', '不安', '担心', '惶恐', '惶惶不安', '七上八下', '忐忑', '揪心'],
  '难过': ['伤心', '悲伤', '心痛', '心碎', '酸楚', '不是滋味', '难受', '好想哭', '想哭'],
  '愤怒': ['生气', '火大', '暴躁', '恼火', '愤慨', '发怒', '怒火', '气不过', '窝火'],
  '恐惧': ['害怕', '惊恐', '畏惧', '胆小', '发怵', '恐慌', '惊惧', '提心吊胆'],
  '孤独': ['寂寞', '孤单', '独处', '冷清', '落寞', '凄凉', '形单影只', '孑然一身'],
  '压抑': ['憋屈', '闷', '堵', '憋着', '说不出', '不敢说', '强颜欢笑', '伪装'],
  '疲惫': ['累', '累垮', '筋疲力尽', '没力气', '不想动', '没精神', '困', '乏'],
  '迷茫': ['困惑', '不知道', '不确定', '迷失', '彷徨', '彷徨失措', '摸不着头脑'],
  '自责': ['内疚', '愧疚', '对不起', '怪自己', '恨自己', '厌恶自己', '觉得自己没用'],
  '无助': ['绝望', '没办法', '无能为力', '走投无路', '束手无策', '求救无门'],
  '空虚': ['空洞', '空落落', '没意思', '无聊', '乏味', '索然无味', '行尸走肉'],
  '低自尊': ['自卑', '不自信', '不如人', '比不上', '配不上', '我不行', '我不配'],
  '失望': ['失落', '灰心', '心寒', '寒心', '大失所望', '期望落空', '不指望'],
  '崩溃': ['撑不住', '受不了', '扛不住', '绷不住', '破防', '失控', '决堤'],
  '烦躁': ['烦', '心烦', '心乱', '静不下来', '坐不住', '没耐心', '不耐烦'],
  '委屈': ['冤枉', '被误解', '被误会', '不公平', '不服', '憋屈', '替罪羊'],
  '羞耻': ['丢脸', '丢人', '尴尬', '难为情', '见不得人', '抬不起头', '无地自容'],
  '麻木': ['无感', '没感觉', '无动于衷', '冷漠', '不悲不喜', '像机器人'],
  '社交恐惧': ['社恐', '怕人', '不敢社交', '社交紧张', '怕说话', '怕被关注'],
  '嫉妒': ['眼红', '酸', '不平衡', '羡慕嫉妒恨', '吃醋', '攀比'],
};

/**
 * 扩展情绪词 → 匹配所有同义词
 */
export function expandEmotionKeywords(emotion: string): string[] {
  return EMOTION_SYNONYMS[emotion] || [emotion];
}

/**
 * 将用户输入中的同义词映射到标准情绪标签
 */
export function normalizeEmotion(text: string): string[] {
  const result: string[] = [];
  const cleaned = text.toLowerCase();
  for (const [emotion, synonyms] of Object.entries(EMOTION_SYNONYMS)) {
    for (const syn of synonyms) {
      if (cleaned.includes(syn)) {
        result.push(emotion);
        break;
      }
    }
  }
  return [...new Set(result)];
}

// ==================== 关键短语提取 ====================

/**
 * 从用户输入中提取有意义的关键短语
 * 用于在回复中回应用户的原话
 */
export function extractKeyPhrases(text: string, maxPhrases: number = 3): string[] {
  if (!text || text.length < 2) return [];

  const cleaned = text.replace(/[，。！？、；：""''（）【】《》\s\n]+/g, '|').trim();
  const segments = cleaned.split('|').filter(s => s.length >= 2);

  const phrases: { text: string; score: number }[] = [];

  for (const seg of segments) {
    // 滑动窗口提取2-6字短语
    for (let len = 2; len <= Math.min(6, seg.length); len++) {
      for (let i = 0; i <= seg.length - len; i++) {
        const phrase = seg.slice(i, i + len);
        // 过滤纯虚词和标点
        if (isMeaningfulPhrase(phrase)) {
          const score = scorePhrase(phrase);
          phrases.push({ text: phrase, score });
        }
      }
    }
  }

  // 去重、按分数排序、取前N个
  const seen = new Set<string>();
  const unique: string[] = [];
  phrases.sort((a, b) => b.score - a.score);

  for (const p of phrases) {
    if (!seen.has(p.text) && !isSubstringOf(p.text, unique)) {
      seen.add(p.text);
      unique.push(p.text);
      if (unique.length >= maxPhrases) break;
    }
  }

  return unique;
}

/** 判断短语是否有意义（非纯虚词） */
function isMeaningfulPhrase(text: string): boolean {
  const stopWords = new Set([
    '的', '了', '是', '在', '我', '你', '他', '她', '它', '们',
    '这', '那', '哪', '什', '么', '怎', '样', '吗', '吧', '呢',
    '啊', '哦', '嗯', '唉', '但', '和', '与', '或', '就', '也',
    '都', '很', '太', '还', '又', '再', '才', '刚', '已', '要',
    '会', '能', '可', '以', '对', '从', '到', '把', '被', '让',
    '给', '为', '向', '往', '用', '有', '没', '说', '想', '看',
    '去', '来', '做', '吃', '喝', '睡', '觉', '时', '候', '所',
    '一', '二', '三', '个', '些', '点', '下', '上', '中', '里',
    '外', '前', '后', '左', '右', '过', '着', '得', '地', '之',
    '其', '因', '所', '以', '而', '且', '但', '虽', '然', '如',
    '果', '比', '较', '最', '更', '只', '一', '种', '次', '回',
    '天', '年', '月', '日', '今', '明', '昨', '刚', '常', '每',
    '多', '少', '大', '小', '好', '坏', '真', '假', '新', '旧',
    '去', '来', '到', '出', '进', '开', '关', '起', '走', '跑',
    '只是', '还是', '就是', '不是', '可是', '总是', '一直',
    '可能', '应该', '已经', '所以', '因为', '但是', '虽然',
    '如果', '然后', '或者', '而且', '不过', '只是', '毕竟',
  ]);

  // 纯虚词跳过
  if (stopWords.has(text)) return false;

  // 纯标点或数字跳过
  if (/^[\d\s\p{P}]+$/u.test(text)) return false;

  return true;
}

/** 给短语打分（越长、越具体得分越高） */
function scorePhrase(phrase: string): number {
  let score = phrase.length * 2;
  // 含情绪词加分
  if (/[喜怒哀乐悲恐惊忧烦闷慌乱痛苦累疲急焦躁恼恨怨愧羞耻妒孤寂寞空虚麻木]/u.test(phrase)) {
    score += 10;
  }
  // 含具体名词加分
  if (/[工作学习考试家庭父母朋友恋人钱身体睡眠饮食]/u.test(phrase)) {
    score += 8;
  }
  return score;
}

/** 检查 phrase 是否已被已选短语包含 */
function isSubstringOf(phrase: string, selected: string[]): boolean {
  return selected.some(s => s.includes(phrase));
}

// ==================== 简单中文分词 ====================

/**
 * 简单中文分词（基于词典的最大匹配）
 * 用于更好的关键词匹配
 */
export function segmentChinese(text: string): string[] {
  if (!text) return [];

  // 先按标点切分
  const sentences = text.split(/[，。！？、；：""''（）【】《》\s\n]+/);
  const words: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length === 0) continue;
    if (sentence.length <= 2) {
      words.push(sentence);
      continue;
    }

    // 简单2-gram切分
    for (let i = 0; i < sentence.length - 1; i++) {
      words.push(sentence.slice(i, i + 2));
    }

    // 3-gram
    for (let i = 0; i < sentence.length - 2; i++) {
      words.push(sentence.slice(i, i + 3));
    }

    // 保留原句
    words.push(sentence);
  }

  return [...new Set(words.filter(w => w.length >= 2 && !/^\d+$/.test(w)))];
}

// ==================== 情绪强度词检测 ====================

/** 程度副词 → 强度系数 */
const INTENSITY_MODIFIERS: Record<string, number> = {
  '非常': 1.5, '特别': 1.5, '极其': 1.8, '极度': 1.8, '万分': 1.8,
  '很': 1.3, '太': 1.3, '好': 1.2, '真': 1.2, '实在': 1.3,
  '有点': 0.7, '稍微': 0.6, '略微': 0.5, '一点': 0.6, '一点点': 0.5,
  '越来越': 1.4, '更加': 1.3, '愈发': 1.4,
  '完全': 1.5, '彻底': 1.6, '根本': 1.4, '简直': 1.5,
  '总是': 1.3, '一直': 1.2, '老是': 1.3, '永远': 1.4,
  '再也': 1.5, '从来': 1.3, '从不': 1.3,
};

/**
 * 检测文本中的情绪强度修饰词
 * 返回强度系数（1.0为基准）
 */
export function detectIntensityModifier(text: string): number {
  let maxModifier = 1.0;
  for (const [word, coefficient] of Object.entries(INTENSITY_MODIFIERS)) {
    if (text.includes(word) && coefficient > maxModifier) {
      maxModifier = coefficient;
    }
  }
  return maxModifier;
}

// ==================== 情绪复合检测 ====================

/**
 * 检测用户是否表达了多种情绪的混合
 * 返回所有匹配的情绪标签
 */
export function detectMixedEmotions(text: string): string[] {
  const emotions: string[] = [];
  const negationEmotion = detectNegationPatterns(text);
  if (negationEmotion) {
    emotions.push(negationEmotion);
  }
  const normalized = normalizeEmotion(text);
  for (const e of normalized) {
    if (!emotions.includes(e)) {
      emotions.push(e);
    }
  }
  return emotions;
}

// ==================== 文本情绪色彩判断 ====================

const POSITIVE_WORDS = new Set([
  '开心', '快乐', '高兴', '幸福', '满足', '轻松', '平静', '舒服',
  '好多了', '好一些', '没事了', '还行', '还不错', '还可以',
  '有希望', '有动力', '有信心', '有力量', '感谢', '感恩',
  '进步', '成长', '变好', '好起来', '松一口气',
]);

const NEGATIVE_WORDS = new Set([
  '难过', '伤心', '痛苦', '焦虑', '害怕', '恐惧', '愤怒', '生气',
  '绝望', '无助', '崩溃', '撑不住', '受不了', '不想活了',
  '越来越差', '更糟了', '恶化', '更难受', '更痛苦',
]);

/**
 * 判断文本的整体情绪色彩
 */
export function getSentimentPolarity(text: string): 'positive' | 'negative' | 'neutral' {
  let posCount = 0;
  let negCount = 0;

  for (const word of POSITIVE_WORDS) {
    if (text.includes(word)) posCount++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (text.includes(word)) negCount++;
  }

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}