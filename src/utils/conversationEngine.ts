import type { ConversationSession, ConversationResponse, ConversationStage, ChatMessage } from '@/types';
import { analyzeEmotion } from './emotionAnalysis';
import { searchArticles } from './search';
import {
  extractKeyPhrases,
  detectNegationPatterns,
  normalizeEmotion,
  detectIntensityModifier,
  getSentimentPolarity,
  hasNegation,
} from './chineseNLP';
import { getRandomKnowledgeSnippet, getKnowledgeSnippets } from './knowledgeSnippets';

// ==================== 工具函数 ====================

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ==================== 对话上下文追踪 ====================

interface ConversationContext {
  /** 用户所有消息 */
  userMessages: string[];
  /** 历次检测到的情绪 */
  emotionHistory: string[];
  /** 情绪强度历史 */
  intensityHistory: number[];
  /** 情绪色彩历史 */
  sentimentHistory: ('positive' | 'negative' | 'neutral')[];
  /** 提取的关键主题 */
  keyThemes: string[];
  /** 对话阶段 */
  stage: ConversationStage;
  /** 已使用的知识片段 */
  usedSnippets: Set<string>;
  /** 助手消息数 */
  turnCount: number;
}

function buildContext(session: ConversationSession): ConversationContext {
  const userMessages = session.messages.filter(m => m.role === 'user').map(m => m.content);
  const assistantMessages = session.messages.filter(m => m.role === 'assistant');

  // 汇总所有检测到的情绪
  const emotionHistory: string[] = [];
  const intensityHistory: number[] = [];
  const sentimentHistory: ('positive' | 'negative' | 'neutral')[] = [];

  for (const msg of userMessages) {
    const result = analyzeEmotion(msg);
    emotionHistory.push(result.primaryEmotion);
    intensityHistory.push(result.intensity);
    sentimentHistory.push(getSentimentPolarity(msg));
  }

  // 提取所有消息的关键主题
  const allThemes: string[] = [];
  for (const msg of userMessages) {
    allThemes.push(...extractKeyPhrases(msg, 2));
  }

  return {
    userMessages,
    emotionHistory,
    intensityHistory,
    sentimentHistory,
    keyThemes: [...new Set(allThemes)].slice(0, 8),
    stage: session.stage,
    usedSnippets: new Set(),
    turnCount: assistantMessages.length,
  };
}

// ==================== 开场白 ====================

const GREETINGS = [
  '嗨，我在这里。你可以放心地说任何你想说的话——不管是开心的、难过的、混乱的，还是连你自己都说不清楚的那种感觉。我都会认真听。',
  '嗯，你来了。先不用急着说"重点"，想到什么就说什么。有时候那些看起来"不重要"的碎碎念，反而最接近心里真正的声音。',
  '你好啊。这里没有评判，没有"你应该怎样"，只有一个愿意认真听你说话的人。今天是什么感觉把你带到了这里？',
  '嘿，你来了。不管你现在心里是乱糟糟的、空落落的，还是说不上来的那种不舒服——都没关系。你可以从这里开始，随便说点什么。',
];

// ==================== 回应片段库 ====================

/** 开头句 */
const OPENERS = [
  '我听到了。',
  '嗯，你说的这些，我感受到了。',
  '谢谢你愿意说出来。',
  '我仔细听了你说的话。',
  '你说的这些，让我心里有了画面。',
];

/** 用户原话反射模板（{phrase} 会被替换为提取的关键短语） */
const REFLECTION_TEMPLATES = [
  '你说"{phrase}"——这种感觉一定很真实吧？',
  '"{phrase}"这几个字，让我觉得你承受了很多。',
  '当你提到"{phrase}"的时候，我好像能感受到那种重量。',
  '"{phrase}"——光是说出来，就已经需要很大的勇气了。',
];

/** 情绪验证过渡句 */
const VALIDATION_TRANSITIONS = [
  '其实，',
  '说实话，',
  '你知道吗，',
  '我想说的是，',
  '嗯，',
];

/** 上下文关联模板 */
const CONTEXT_LINK_TEMPLATES = [
  '这让我想起你之前提到的"{theme}"——这两个之间，是不是有什么关联？',
  '你之前说过"{theme}"，现在又说到这个……好像有一条线连着。',
  '我注意到，你之前也提到过"{theme}"。这可能是你内心一直在关注的一个点。',
];

/** 情绪变化感知模板 */
const SENTIMENT_SHIFT_TEMPLATES = {
  improving: [
    '我注意到，你刚才说的感觉比之前轻了一些。这个变化，你感觉到了吗？',
    '好像比之前好一点了？哪怕只是一点点，也值得被看见。',
    '你现在的状态和刚才不太一样了——是发生了什么吗？',
  ],
  worsening: [
    '我感觉你现在的情绪比刚才更重了。是说到什么让你更难受了吗？',
    '你现在的感受好像比之前更强烈了……没关系，我们可以慢一点。',
    '如果这个话题让你更不舒服了，我们可以换个方向聊。不用勉强自己。',
  ],
  stable: [
    '这个话题好像一直在你心里——我们来多聊聊。',
    '这种感受，好像已经跟着你一段时间了。',
  ],
};

/** 知识片段插入模板 */
const KNOWLEDGE_TEMPLATES = [
  '这让我想到{snippet}',
  '说到这个，{snippet}',
  '其实心理学上有一个说法——{snippet}',
  '你知道吗，{snippet}',
];

/** 通用收尾 */
const CLOSINGS = [
  '如果你还想继续聊，我随时在这里。如果觉得今天差不多了，也没关系——照顾好自己的节奏。',
  '今天聊到这里，你觉得怎么样？有什么是你之前没想到但现在有点感觉了的吗？',
  '我想说的差不多就是这些了。但如果你还有想聊的，或者有新的感受冒出来，随时可以继续。',
  '嗯，我不想像教科书一样给你一个"总结"。我只想说，你愿意花时间面对自己的感受，这本身就很了不起。需要的时候，我都在。',
];

// ==================== 情绪专项模板（片段化） ====================

export interface EmotionFragments {
  validations: string[];
  deepening: string[];
  insights: string[];
  suggestions: string[];
  followUps: string[];
}

export const emotionFragments: Record<string, EmotionFragments> = {
  '焦虑': {
    validations: [
      '你现在心里好像有一个停不下来的警报器，一直在响。这种感觉真的很消耗人——明明身体已经累了，但脑子就是不肯休息。你不是"想太多"，你只是太在乎了，在乎到你的大脑不敢放松警惕。',
      '焦虑是一种很折磨人的感觉——它不像难过那样可以哭出来，也不像愤怒那样可以发泄，它就是悬在那里，让你坐也不是、站也不是。',
      '你描述的这种感觉，我懂。焦虑有时候就像你在一片雾里走路，看不清前面有什么，但总觉得有什么不好的东西在等着你。这不是你的错——这是你的大脑在用一种过度保护的方式在照顾你。',
    ],
    deepening: [
      '我注意到一个模式：你好像一直在试图"控制"什么——控制结果、控制别人的看法、控制未来的不确定性。但控制是一件很累的事，因为世界上有太多事情是我们控制不了的。焦虑的本质，其实就是"想要控制那些控制不了的事情"。',
      '你的焦虑可能不只是"担心"，里面还藏着一种很深的责任感。你怕自己做得不够好，怕让在乎的人失望。这种责任感本身是好的，但它不该变成你24小时背着的包袱。',
      '你的焦虑背后可能有一个"不允许自己犯错"的声音。这个声音可能来自很久以前——来自某个对你有很高期待的人。但人不是机器，人会犯错，会失控，会不确定——这恰恰是活着的一部分。',
    ],
    insights: [
      '罗洛·梅说过，焦虑是"对未知的恐惧，但同时也是对可能性的兴奋"。适度的焦虑其实是一种动力——它让我们提前准备、认真对待。问题不是焦虑本身，而是当它超过了"有用"的程度。',
      '你的大脑把一些不确定的事情标记成了"危险"，然后启动了原始的"战斗或逃跑"反应。问题是，现代社会的大多数焦虑源不是一只老虎，而是一封邮件、一条消息——你的身体在用对付老虎的方式来对付一封邮件，当然会觉得累。',
    ],
    suggestions: [
      '试试给自己设定一个"焦虑时间"——每天固定15分钟，专门用来焦虑。把担心的事写下来。其他时间，当焦虑冒出来的时候，告诉自己"留到焦虑时间再处理"。这不是逃避，而是给焦虑划一个边界。',
      '当焦虑来袭的时候，试试"5-4-3-2-1"感官练习：看5样东西、摸4样东西、听3种声音、闻2种气味、尝1种味道。这个练习能帮你把注意力从脑子里拉回到当下。',
      '做一个"担忧记录表"——把你担心的事写下来，过一周再看看，有多少真的发生了？你会发现，大多数我们担心的事，根本不会发生。',
      '焦虑的时候，你的身体也在"战斗模式"。试试用运动来"用完"这些应激激素——快走、跑步、甚至只是用力甩甩手。',
    ],
    followUps: [
      '你焦虑的时候，身体有什么感觉？比如心跳快、手心出汗、还是胃不舒服？',
      '这种焦虑，有没有特定的触发点？比如某个场景、某个人、或者某个时间？',
      '你觉得你的焦虑，最核心的"怕"是什么？怕失败、怕被抛弃、还是怕失控？',
      '最近有没有什么时候，焦虑突然减轻了？那时候发生了什么？',
    ],
  },
  '难过': {
    validations: [
      '你现在心里好像有一块很重的东西，压得你有点喘不过气。难过的时候，世界好像变得灰蒙蒙的，平时喜欢的东西也提不起劲了。这不是你"太脆弱"——你只是正在经历一些让你受伤的事。',
      '难过是一种很诚实的情绪。它不像愤怒那样有力量，也不像焦虑那样有方向——它就是单纯地疼。你可能已经听了很多"别难过了"、"想开点"，但说实话，难过的时候最不需要的就是这些话。',
      '你愿意把这些说出来，本身就很难得。很多人难过的时候会把自己关起来，假装没事。但你选择了说出来——这说明你在照顾自己，在向外界伸出手。',
    ],
    deepening: [
      '你的难过不只是"难过"——里面好像还夹着一些别的东西。可能是失望、可能是委屈、可能是对某个人或某件事的怀念。难过很少是纯粹的，它通常是一个"情绪包裹"，里面装着好多层。',
      '你好像不太允许自己难过太久。你可能会觉得"都这么久了，我应该好了吧"。但难过没有时间表——它不是你"应该"控制的东西，而是需要被允许、被看见、被陪伴的过程。',
    ],
    insights: [
      '卡尔·罗杰斯说过，当一个人被真正地倾听和理解时，他的内心会开始自然地愈合。你不需要"解决"难过，你只需要允许它被表达。眼泪不是软弱，它是你的身体在帮你释放压力荷尔蒙。',
      '悲伤有一个很重要的功能：它让我们慢下来。当你难过的时候，你的身体在告诉你"我需要休息，我需要被照顾"。在这个快节奏的世界里，难过可能是唯一能让你停下来的信号。',
    ],
    suggestions: [
      '给自己一个"难过时间"——不是让你一直难过，而是允许自己在这段时间里不假装坚强。想哭就哭，想躺着就躺着。然后做一件很小的事：洗个热水澡、出门走五分钟、或者吃一口你喜欢的东西。',
      '试试把难过写下来——不是写"我很难过"，而是写具体的事、具体的感受、具体的身体反应。把抽象的情绪变成具体的文字，你会发现它变得没那么可怕了。',
      '找一个安全的人，哪怕只说一句"我最近不太好"。说出来本身就是一种释放。你不需要对方给你建议，你只需要被听见。',
    ],
    followUps: [
      '这种难过，是有具体的原因，还是说不清道不明的？',
      '你难过的时候，身体哪个地方最不舒服？是胸口、喉咙、还是眼睛？',
      '最近有没有哭过？哭完之后感觉怎么样？',
      '你难过的时候，最想做什么？最不想做什么？',
    ],
  },
  '愤怒': {
    validations: [
      '你现在心里有一团火，烧得你难受。愤怒常常被看作"不好的情绪"，但说实话，愤怒只是在告诉你：你的边界被踩了，你的需求被忽视了，或者你受到了不公正的对待。生气不是你的问题，它是在帮你说"这不对"。',
      '你现在可能想骂人、想摔东西、想大声喊出来——这些冲动都很正常。愤怒是一种能量，它需要出口。真正的问题不是"你生气了"，而是"你要怎么把这股能量释放出来，同时不伤害自己、不伤害别人"。',
    ],
    deepening: [
      '你的愤怒下面可能藏着更柔软的东西——可能是委屈，可能是伤心，可能是害怕。愤怒常常是一层"保护色"，它让你看起来很强，但里面可能是一个受伤的自己。',
      '你好像不太敢表达愤怒——你可能会忍着，会告诉自己"算了"。但忍着的愤怒不会消失，它只会变成别的东西：变成对自己的攻击、变成身体的不舒服、或者变成某一天突然的爆发。',
    ],
    insights: [
      '哈丽特·勒纳在《愤怒之舞》里说，愤怒是值得被倾听的信号。它不是需要被扑灭的火焰，而是需要被阅读的信件。你的愤怒在告诉你：你的某个需求没有被满足，你的某个边界被侵犯了。',
      '从生理学角度来说，愤怒会激活你的交感神经系统——你的身体真的在"准备战斗"。运动是最好的"发泄"方式，因为它让你的身体做它本来准备好的事。',
    ],
    suggestions: [
      '当你感到愤怒要爆发的时候，先给自己一个"缓冲空间"——离开现场，哪怕只是去另一个房间、去楼下走一圈。等身体降温了，再决定怎么回应。',
      '试试用"我感到……因为我需要……"来表达愤怒，而不是"你总是……"。前者是沟通，后者是攻击。',
      '把愤怒"运动"出来——跑步、快走、打枕头、撕废纸。让身体把那股能量释放掉。',
      '写一封"不寄出的信"——把你想骂的话、想说的狠话全部写下来，不需要修饰。写完之后，你可以选择撕掉、烧掉。',
    ],
    followUps: [
      '你生气的背后，是什么感觉？是觉得不公平、被冒犯、还是被忽视？',
      '这股愤怒，是指向一个具体的人或事，还是说不上来为什么？',
      '你平时怎么处理愤怒？是憋着、发出来、还是自己消化？',
    ],
  },
  '恐惧': {
    validations: [
      '你现在心里有一种很真实的害怕。恐惧不是你的弱点——它是人类最原始的保护机制，是在提醒你"注意安全"。只是有时候，这个保护系统太敏感了，把一些不危险的事情也当成了威胁。',
      '恐惧会让你心跳加快、身体紧绷，好像随时准备逃跑。这种感觉非常真实，也非常消耗人。你不是"胆小"，你只是有一个特别敏感的警报系统。',
    ],
    deepening: [
      '你的恐惧不是凭空来的——它可能跟过去的某次经历有关。我们的身体会记住那些让我们害怕的事情，即使脑子已经"忘了"，身体还记得。',
      '你好像会回避让你害怕的事情。这个策略在短期内有效——避开就没有痛苦。但长期来看，回避会让恐惧越来越大，因为你没有机会去验证"其实没那么可怕"。',
    ],
    insights: [
      '恐惧和兴奋在生理上非常相似——心跳加速、呼吸变快、肾上腺素升高。区别只在于你的大脑给这个感觉贴了什么标签。',
      '苏珊·杰弗斯有一本书叫《感觉害怕，但还是去做》。她说勇气不是不害怕，而是带着害怕依然往前迈一步。',
    ],
    suggestions: [
      '把恐惧具体化——你怕的到底是什么？把它写下来，越具体越好。模糊的恐惧最吓人，一旦具体化，它就变小了。',
      '试试"最坏情况"思维：如果真的发生了你最怕的事，你能承受吗？你能怎么应对？大多数时候你会发现，你能。',
      '从最小的一步开始——如果害怕社交，就先从对便利店员说"谢谢"开始。如果害怕失败，就先做一件"做不好也没关系"的事。',
    ],
    followUps: [
      '你恐惧的，具体是什么？是一个人、一件事、一个场景，还是说不上来的不安？',
      '这种恐惧，是从什么时候开始的？有没有一个触发的事件？',
      '你以前有没有过类似的恐惧？那时候你是怎么过来的？',
    ],
  },
  '孤独': {
    validations: [
      '你现在的孤独感很真实。孤独不是说你身边没人——而是你觉得没有人真正懂你。这种感觉就像站在人群里，却和所有人隔着一层玻璃。这不是你的错，也不是因为你"不够好"。',
      '孤独是一种很特别的痛。它不是尖锐的，而是钝钝的、闷闷的。你可能已经习惯了"一个人扛着"，习惯了"说了也没人懂"。但我想告诉你，你愿意在这里说出来，就已经在打破这种孤独了。',
    ],
    deepening: [
      '你的孤独可能不只是"缺人陪"，而是"缺一种深度的连接"。你可能有很多熟人，但很少有能说真心话的人。这种孤独不是靠"多交朋友"能解决的——它需要的是"对的连接"。',
      '你好像习惯了在孤独中自己消化一切。你变得很独立，很能扛，但有时候，独立和孤独之间只隔着一层纸。独立是选择，孤独是无奈。',
    ],
    insights: [
      '约翰·鲍尔比的研究发现，人类天生就需要"安全基地"——一个让你感到被接纳、被理解的人或地方。这不是软弱，而是我们作为社会性动物的基本需求。',
      '欧文·亚隆把孤独分为三种：人际孤独、心理孤独、存在孤独。了解自己属于哪一种，能帮你找到对的方向。',
    ],
    suggestions: [
      '从"找一个人"开始——不需要一群朋友，一个能聊得来的人就够了。也许是一个同学、一个同事、一个网友，或者一个心理咨询师。',
      '学会和自己相处：孤独的时候，做一件你真正喜欢的事——看书、画画、听音乐、散步。享受独处和感到孤独是两回事。',
      '养一盆植物或一只宠物——照顾另一个生命的过程，会让你感受到真实的连接。',
      '加入一个兴趣小组或社群——共同的兴趣是最好的连接桥梁。哪怕只是线上的，也能让你感受到"我不是一个人"。',
    ],
    followUps: [
      '你的孤独，是"没有人陪"的孤独，还是"没有人懂"的孤独？',
      '你什么时候感觉最孤独？是晚上一个人的时候，还是在人群中反而更孤独？',
      '你有没有过"不孤独"的时刻？那时候发生了什么？',
    ],
  },
  '压抑': {
    validations: [
      '你现在好像有很多话堵在心里，想说却说不出来——或者不敢说、不能说。这种压抑的感觉就像嘴里含着一块石头，吞不下去也吐不出来。',
      '压抑是一种很消耗人的状态。你不是没有情绪，而是有太多情绪，但不敢表达。可能是因为怕别人不理解，可能是因为怕说出来会破坏关系。但你的感受值得被听见。',
    ],
    deepening: [
      '你的压抑不是一天两天了——它可能是一种习惯，一种从小养成的"生存策略"。你可能很早就学会了"懂事"、"听话"、"不给别人添麻烦"。但懂事的人，往往最委屈。',
      '你好像把"表达自己"和"伤害别人"混在一起了。你觉得说出真实感受会让别人不舒服，所以选择不说。但长期的压抑，伤害的其实是你自己。',
    ],
    insights: [
      '唐纳德·温尼科特提出了"真实自我"和"虚假自我"的概念——当你长期压抑真实的感受去迎合外界，你就在强化"虚假自我"，表面上看起来很好，但内心越来越空。',
      '压抑情绪不是让情绪消失了——它只是被"储存"起来了。这些储存的情绪会在身体里积累，变成慢性疼痛、疲劳、失眠。',
    ],
    suggestions: [
      '找一个完全私密的方式表达——写日记、录一段只有自己听的语音、或者对着空房间把想说的话都说出来。不需要逻辑，不需要修饰，就是释放。',
      '从"小范围真实"开始——不用对所有人坦诚，但可以找一个你觉得安全的人，试着说一句"其实我不太好"。',
      '练习"我感受"句式：不是"你让我生气"，而是"我感到生气"。把情绪说出来，本身就是一种释放。',
      '用创作来释放——画画、写诗、做手工、跳舞。有时候身体和手比嘴巴更擅长表达。',
    ],
    followUps: [
      '你压抑的，是具体什么事？还是笼统的"不敢表达自己"？',
      '你压抑的时候，身体有什么感觉？是胸口闷、喉咙堵、还是肩膀紧？',
      '你压抑自己，是因为怕什么？怕冲突、怕被讨厌、还是怕失控？',
    ],
  },
  '疲惫': {
    validations: [
      '你现在累到连解释"为什么累"的力气都快没有了。这种疲惫不一定是身体上的——更多时候是心理上的。你可能一直在消耗自己，像一个不停转的陀螺，却从来没有好好停下来过。',
      '疲惫就是这样——它不是突然来的，而是一点一点积攒的，直到有一天你发现自己连起床的力气都没有了。你不是懒，你只是被耗尽了。',
    ],
    deepening: [
      '你的疲惫不是一两天的——它可能是一种"慢性消耗"。你一直在输出，但很少给自己充电。你可能觉得"停下来"是浪费时间，但事实上，停下来是为了走更远。',
      '你好像把"休息"和"懈怠"搞混了。你觉得休息是不应该的，是偷懒。但休息不是懈怠——它是维护，就像手机需要充电一样，人也需要。',
    ],
    insights: [
      '赫伯特·弗洛伊登伯格提出了"倦怠"的概念：当一个人长期处于高要求、低回报的环境中，就会进入情绪耗竭状态。这种状态不是"休息一天"能解决的。',
      '长期压力会让你的皮质醇水平持续升高，干扰睡眠、降低免疫力、让你感觉"怎么睡都累"。你的身体在发出信号——它需要被认真对待。',
    ],
    suggestions: [
      '给自己放半天假——不是"等忙完这阵子"，而是"现在"。不学习、不工作、不回消息，就是纯粹地休息。躺平不是罪过。',
      '建立"恢复仪式"——每天固定做一件能让你感到放松的事：泡脚、听音乐、冥想、散步，哪怕只有10分钟。',
      '检查一下你的"精力消耗源"——是什么在持续消耗你？能不能减少或暂停其中一些？',
      '睡得够不等于睡得好——试试睡前放下手机、调暗灯光、做几个深呼吸，给身体一个"要休息了"的信号。',
    ],
    followUps: [
      '你的疲惫，是身体累还是心累？还是两者都有？',
      '是什么在持续消耗你？工作、学习、人际关系，还是自己给自己的压力？',
      '你最近一次真正"休息"是什么时候？不是刷手机，而是什么都不做的那种休息。',
    ],
  },
  '迷茫': {
    validations: [
      '你现在好像站在一个十字路口，不知道往哪走。迷茫不是因为你"不够聪明"或"不够努力"——而是因为人生本身就没有标准答案。每个人在成长的某个阶段都会经历迷茫，它甚至可以说是一个人开始认真思考"我到底想要什么"的标志。',
      '迷茫的感觉就是——你好像被丢进了一片雾里，看不清方向，也不知道下一步该踩在哪里。但迷茫的人，往往是在认真对待自己人生的人。那些从不迷茫的人，可能只是从来没问过自己"我到底想要什么"。',
    ],
    deepening: [
      '你的迷茫不是"没有想法"，而是"想法太多，不知道哪个是对的"。你可能有很多可能性，但每一个都有不确定性，于是你停在原地，不敢迈出任何一步。',
      '你好像一直在等一个"确定"——等一个保证会成功的选择。但说实话，人生里没有哪种选择是100%确定的。迷茫的时候，最好的策略不是"想清楚"，而是"先做点什么"。',
    ],
    insights: [
      '詹姆斯·马西亚提出了"身份状态"理论，其中"延缓状态"——正在探索但尚未决定——是年轻人最正常的阶段。迷茫不是问题，它是通往"身份达成"的必经之路。',
      '存在主义心理学认为，迷茫源于"自由"——因为你有选择的自由，所以你才会迷茫。如果一切都安排好了，你反而不会迷茫，但那也不是你真正想要的人生。',
    ],
    suggestions: [
      '暂时放下"找答案"的执念，先做一件你稍微有点兴趣的小事。行动比思考更能帮你看清方向——你不需要看清整条路，只需要看清下一步。',
      '回顾你过去的经历——哪些时刻让你感到充实和快乐？答案可能就藏在你的过往里。',
      '给自己一个"探索期"——允许自己暂时不需要有答案，去尝试不同的东西。',
      '和不同的人聊聊——老师、朋友、家人，或者一个你欣赏的前辈。别人的经历和视角可能会给你启发。',
    ],
    followUps: [
      '你的迷茫，是关于什么方面的？工作、学业、人际关系，还是人生的方向？',
      '有没有什么事情，是你做的时候会忘记时间、忘记自己的？',
      '如果可以完全自由地选择，你想做什么？',
    ],
  },
  '自责': {
    validations: [
      '你心里可能有一个声音一直在批评你——"你又做错了"、"你不够好"、"你凭什么"。这个声音可能已经陪伴你很久了，久到你甚至以为它就是你自己。但如果你最好的朋友犯了同样的错误，你会用这样的话去说他吗？不会吧？',
      '自责是一种很消耗人的情绪。你对自己太苛刻了。但你知道吗？自责的背后，往往藏着很深的自省和责任感——你是一个认真的人，只是想做得更好。只是这份追求，不该变成对自己的攻击。',
    ],
    deepening: [
      '你的自责不是针对某件事，而是针对"你自己"。这很不一样——如果你自责的是"我这次没做好"，那下次可以改进。但如果你自责的是"我这个人不行"，那你就把自己困住了。',
      '你好像有一个"完美标准"——你觉得自己必须做到怎样才算"够好"。但这个标准是谁定的？是你自己定的，还是别人塞给你的？',
    ],
    insights: [
      '克里斯汀·内夫提出了"自我同情"的概念：对自己温柔，不等于给自己找借口。自我同情的人反而更愿意承担责任，因为他们不害怕面对错误——他们知道，犯错不等于"我是个错误"。',
      '认知行为疗法里有一个概念叫"认知扭曲"——自责的人往往有"过度概括"的倾向，把"我做错了一件事"扭曲成"我是一个失败的人"。学会区分这两者，是走出自责的第一步。',
    ],
    suggestions: [
      '给那个批评你的声音取个名字，比如"老张"或"小刺"。当它又开始说话时，你可以说："哦，老张又在唠叨了"——这能帮你和那个声音保持距离。',
      '练习"朋友视角"：下次自责时，问自己"如果是我最好的朋友遇到同样的事，我会怎么安慰他？"然后用同样的语气对自己说话。',
      '每天睡前写下今天做对的三件事，哪怕再小——"我今天按时起床了"也算。',
      '把"我太蠢了"改成"我这次没做好，下次可以怎么做？"——前者是攻击，后者是成长。',
    ],
    followUps: [
      '你自责的时候，具体在想什么？是"我做错了某件事"，还是"我这个人不行"？',
      '这个批评你的声音，是从什么时候开始出现的？',
      '如果把你对自己的要求，用在别人身上，你觉得公平吗？',
    ],
  },
  '无助': {
    validations: [
      '你现在可能觉得没有人能帮你，好像被关在一个房间里，所有的门都锁上了。这种感觉非常绝望，非常孤独。但无助感不等于你真的无助——它更像是一种情绪上的"近视"，让你看不到身边其实还有资源和选择。',
      '无助感是一种很沉重的感觉。你可能已经尝试了很多方法，但都不管用，于是你开始觉得"算了，没办法了"。但在你"算了"之前，你已经一个人扛了多久？',
    ],
    deepening: [
      '你的无助感可能来自于"一个人扛了太久"。你习惯了靠自己，习惯了不麻烦别人，但当事情超过一个人能承受的范围时，你就崩溃了。',
      '你好像把"求助"和"软弱"挂钩了。但敢于求助的人，往往是最有勇气的人——因为他们要面对"被拒绝"的风险，要承认"我需要帮助"。',
    ],
    insights: [
      '马丁·塞利格曼通过"习得性无助"实验发现，当一个人反复经历无法控制的负面事件后，就会放弃尝试。但"习得性无助"是"习得的"——意味着它也可以被"习得性乐观"替代。',
      '人类是群居动物——我们天生就需要互相帮助。独自面对一切，不是"坚强"，而是违背了我们的天性。',
    ],
    suggestions: [
      '列一个"求助清单"——想想你身边有哪些人、哪些资源可以帮到你。哪怕只是帮你分担一点点。',
      '从最小的求助开始——比如请朋友帮你带一份饭、请同事帮你看一下文件。练习接受帮助，也是练习相信自己值得被帮助。',
      '把问题拆开——你现在面对的事情，有没有哪一小部分是你现在就能处理的？哪怕只解决一点点，也会让你重新获得掌控感。',
      '如果身边暂时没有可以求助的人，可以试试心理热线。它们是免费的、匿名的，随时可以接住你。',
    ],
    followUps: [
      '你觉得无助，是关于什么具体的事？还是笼统的"什么都做不了"？',
      '你尝试过什么方法？哪怕很小的尝试也算。',
      '你身边有没有人，是你觉得可以开口求助的？',
    ],
  },
  '空虚': {
    validations: [
      '你现在可能觉得生活像一杯白开水——没什么味道，也没什么期待。空虚感不是因为你"缺少什么"，而是因为你和你自己内心深处的连接断了。你一直在忙、在应付、在满足别人的期待，却没有停下来问问自己"我到底想要什么"。',
      '空虚是一种很特别的感觉——它不像难过那样有明确的痛感，也不像焦虑那样有方向。它就是"空"的。你可能会觉得"我是不是出了什么问题"，但其实，空虚只是在提醒你：是时候重新和自己建立连接了。',
    ],
    deepening: [
      '你的空虚可能跟"被动生活"有关——你一直在应付外界的要求，但很少主动做自己想做的事。你像一个被水流推着走的船，而不是自己在划桨。',
      '你好像把自己的需求排在了最后。你一直在满足别人的期待，但从来没有问过自己"我想要什么"。空虚，可能是因为你太久没有听见自己的声音了。',
    ],
    insights: [
      '米哈里·契克森米哈伊提出了"心流"的概念——当你全身心投入一件有挑战性但又可控的事情时，你会忘记时间、忘记自己，感到充实和满足。空虚的反面不是"开心"，而是"投入"。',
      '维克多·弗兰克尔在《活出生命的意义》中说，意义感来自于三件事：创造、体验和态度。空虚，往往是因为这三条路都暂时被堵住了。',
    ],
    suggestions: [
      '尝试一些"没用但有趣"的事——画画、弹琴、做手工、看云发呆。不需要任何目的，只是享受过程本身。',
      '减少被动消费（刷手机、看视频），增加主动创造（写东西、做东西、学东西）。创造比消费更能填补空虚。',
      '做一件需要"用心"而不是"用脑"的事：做饭、种花、整理房间、写一封信。投入的过程会让你感到充实。',
      '试着帮助别人——哪怕是帮朋友拿一个快递、给陌生人一个微笑。给予和连接是空虚最好的解药。',
    ],
    followUps: [
      '你的空虚，是"什么都没意思"的空虚，还是"热闹完了更空"的空虚？',
      '你上一次感到"充实"是什么时候？那时候你在做什么？',
      '有没有什么事情，是你一直想做但一直没做的？',
    ],
  },
  '低自尊': {
    validations: [
      '你心里好像有一个声音一直在说"你不够好"。这个声音可能来自过去的某个经历，可能来自成长中反复听到的否定。但你会用同样的标准去评判一个你爱的人吗？如果不会，那你为什么要这样对自己？',
      '觉得自己"不够好"是一种很消耗人的感觉。你可能一直在努力证明自己，但无论怎么努力，那个"不够好"的声音都不会消失——因为它不是基于事实，而是基于你的自我认知。',
    ],
    deepening: [
      '你的低自尊不是"你不够好"，而是你一直在用别人的尺子量自己。你可能从小被拿来和别人比较，被要求达到某个标准，慢慢地，你开始以为"只有达到标准才值得被爱"。',
      '你很擅长看别人的优点，但对自己却只看到缺点。这不是客观评价，这是"选择性注意"——你只看到了自己不够好的部分，而忽略了已经很好的部分。',
    ],
    insights: [
      '纳撒尼尔·布兰登说，自尊是"相信自己有能力应对生活的基本挑战，并相信自己值得幸福"。它不是"比别人好"，而是"我相信自己，我值得"。',
      '从依恋理论的角度来看，低自尊往往源于早期的关系体验——如果你小时候得到的爱是有条件的，你就会学会"只有满足条件才值得被爱"。但这不是真的。',
    ],
    suggestions: [
      '做一个"自我认可清单"——每天写下至少一件你今天为自己感到骄傲的事，哪怕很小。',
      '当自我批评的声音出现时，问自己：如果是我最好的朋友遇到同样的事，我会怎么说？然后用同样的语气对自己说。',
      '停止和社交媒体上的"完美人生"比较——你看到的是别人的高光时刻，但你在比较的是自己的日常。',
      '区分"我不擅长这件事"和"我是一个失败的人"——前者是事实，后者是过度概括。',
    ],
    followUps: [
      '你觉得自己"不够好"，是跟谁比？跟别人比，还是跟自己的标准比？',
      '你最早觉得自己"不够好"是什么时候？那时候发生了什么？',
      '如果你什么都不用证明，你觉得自己是一个什么样的人？',
    ],
  },
  '失望': {
    validations: [
      '你现在心里可能有一种"落空"的感觉——你期待了什么，但没有得到。失望往往源于期待，而期待源于在乎。你之所以失望，是因为你曾经真正在乎过某件事或某个人。',
      '失望的感觉就像你伸出手去够什么东西，以为快够到了，却突然发现还差很远。这种落差很不好受。你不是"太当真了"——你只是认真对待了你在乎的东西。',
    ],
    deepening: [
      '你的失望不只是"这一次"，而可能是一种模式——你总是在付出、在期待，然后失望，然后再付出，再失望。这个循环可能需要被打破。',
      '你好像很少表达自己的期待——你希望对方"自动"知道你要什么。但没有人会读心术。你的期待是合理的，但如果不说出来，别人可能永远不知道。',
    ],
    insights: [
      '约翰·戈特曼在研究亲密关系时发现，失望往往源于"未表达的期待"。我们以为对方应该知道，但对方真的不知道。学会表达期待，是减少失望的第一步。',
    ],
    suggestions: [
      '允许自己失望——不要急着"想开"。失望是一种健康的情绪，它告诉你"这件事对我来说很重要"。',
      '把期待说出来——与其期待别人猜，不如直接告诉对方你要什么。这需要勇气，但能减少很多误会。',
      '问自己：这件事，我能从中学到什么？失望里往往藏着成长的线索。',
      '如果是对自己失望，请记住：你已经做了当时能做到的最好选择。',
    ],
    followUps: [
      '你失望的，是关于什么？一个人、一件事、还是你自己？',
      '你的期待，是明确说出来的，还是藏在心里默认的？',
      '失望之后，你通常会怎么做？是降低期待，还是重新出发？',
    ],
  },
  '崩溃': {
    validations: [
      '你现在可能已经到了一个极限——所有压在身上的东西，好像在这一刻全部垮下来了。崩溃不是软弱，而是你撑了太久之后的自然反应。就像一根弦绷得太久了，终有一天会断——这不是弦的问题，而是它承受了太多。',
      '崩溃的时候，你可能会觉得自己很糟糕、很失败。但恰恰相反——崩溃说明你一直在努力，一直在坚持，只是身体和心灵在告诉你：真的需要休息了。你撑了这么久，已经很了不起了。',
    ],
    deepening: [
      '这次崩溃不是"莫名其妙"的——它可能是你长期压抑之后的必然结果。你一直在撑着，告诉自己"再坚持一下就好"，但那个"一下"变成了很久很久。',
      '你好像不习惯让别人看到你"不好的样子"。你习惯了在别人面前坚强，但坚强的人也需要卸下盔甲。崩溃，有时候就是你的身体在帮你卸下盔甲。',
    ],
    insights: [
      '从生理学来看，崩溃是神经系统在长期高压后的一种"强制关机"。你的交感神经已经超负荷运转了太久，身体需要进入"休息和恢复"模式。',
      '崩溃不是终点，而是转折点——它是在告诉你，旧的方式已经行不通了，你需要新的方式来应对生活。',
    ],
    suggestions: [
      '首先，允许自己崩溃。想哭就哭出来，想喊就喊出来。崩溃是身体在释放压力，不需要为此感到羞耻。',
      '崩溃之后，先照顾基本的生理需求：喝一杯温水、吃一点东西、躺下来休息。不要急着"振作"。',
      '当你平静一些后，想一想：是什么导致了这次崩溃？找到根源才能更好地保护自己。',
      '告诉一个你信任的人"我最近不太好"。你不需要一个人扛着。',
    ],
    followUps: [
      '这次崩溃，是突然发生的，还是积压了很久？',
      '崩溃之后，你感觉怎么样？是释放了，还是更累了？',
      '你身边有没有人知道你现在状态不好？',
    ],
  },
  '烦躁': {
    validations: [
      '你现在可能处于一种"刺刺的"状态——看什么都不顺眼，做什么都静不下来，好像有一团无名火在胸口烧。烦躁不是"脾气不好"，而是你的身体在告诉你：有些东西需要被处理了。',
      '烦躁的时候，你可能会对身边的人发脾气，然后又后悔——这让你更烦躁了。但烦躁本身不是问题，它只是在提醒你：停下来，看看心里到底在乱什么。',
    ],
    deepening: [
      '你的烦躁可能是多种情绪混合的结果——一点焦虑、一点疲惫、一点压抑，再加上一点对生活琐事的厌倦。烦躁就像一锅粥，什么都有，但什么都说不清楚。',
      '你的烦躁可能跟"失控"有关——有些事情不在你的掌控之中，你改变不了，但又不甘心，于是烦躁就来了。',
    ],
    insights: [
      '从生理学来看，烦躁常常是身体在告诉你：我需要运动、需要新鲜空气、需要休息。有时候，烦躁的原因不是心理上的，而是生理上的。',
    ],
    suggestions: [
      '先做5分钟"什么都不做"——不刷手机、不思考、不做事。闭上眼睛，专注于呼吸。让大脑从混乱中暂停一下。',
      '把烦的事情写在纸上，一条一条列出来。你会发现，烦的不是"所有事"，而是其中一两件事在辐射。',
      '用身体来释放——快走10分钟、做几个深蹲、或者用力甩甩手。',
      '检查一下基本需求：你是不是饿了？渴了？累了？缺觉了？',
    ],
    followUps: [
      '你的烦躁，有具体的触发点吗？还是说不上来为什么？',
      '你最近睡得好吗？吃得怎么样？',
      '你烦躁的时候，做什么能让你稍微好一点？',
    ],
  },
  '委屈': {
    validations: [
      '你现在的委屈感很真实——明明不是你的错，却被误解和指责；明明已经尽力了，却没人看到你的付出。委屈是一种混合了伤心、愤怒和无力感的复杂情绪。',
      '委屈的时候，你可能会反复回想那些不公平的瞬间，越想越难受。但你的感受是真实的——即使别人不承认，你也不需要否定自己的感受。',
    ],
    deepening: [
      '你的委屈背后可能有一个"公平感"的需求——你希望自己的付出被看见，希望规则对所有人都一样。这个需求是合理的，但有时候，世界不会按照"公平"来运转。',
      '你可能习惯了"做好自己的事，不说什么"，但当你发现没人注意到你的付出时，委屈就来了。你不需要大声喊，但至少要让别人知道你在做什么。',
    ],
    insights: [
      '人们不仅关心自己得到了什么，还关心自己得到的和别人相比是否公平。委屈，本质上是对"不公平"的情绪反应。',
    ],
    suggestions: [
      '如果条件允许，找一个合适的时机，用"我感受"的方式表达你的委屈。',
      '把委屈写在纸上，把所有想说但没说的话都写下来，不需要修饰，不需要逻辑，只是释放。',
      '做一件让你感到"被善待"的小事：吃一顿好的、买一个喜欢的小东西。',
      '如果对方不值得沟通，那就选择"放下"——不是原谅对方，而是放过自己。',
    ],
    followUps: [
      '你委屈的，是关于一件具体的事，还是长期积累的？',
      '你有没有机会把自己的感受说出来？',
      '你委屈的时候，最需要什么？是被理解、被道歉、还是被看见？',
    ],
  },
  '社交恐惧': {
    validations: [
      '社交对你来说可能不是放松，而是一场需要提前准备的"考试"。你的脑子里可能有一个"内在评判"，在社交场合里不断地给你打分。但说实话，大多数人在社交场合最关注的其实不是你，而是他们自己。',
      '社恐不是"内向"——内向的人享受独处，社恐的人害怕社交。你害怕的不是"社交"本身，而是"被评判"、"被拒绝"、"被看穿"。这种恐惧很真实，但它不是你的全部。',
    ],
    deepening: [
      '你的社恐可能跟"过度自我关注"有关——你太在意自己的一举一动，以为所有人都在看着你。但事实上，别人也在关注他们自己。',
      '你可能有一些"回避"的行为——为了避免社交焦虑，你选择了不社交。这在短期内有效，但长期来看，回避会让恐惧越来越大。',
    ],
    insights: [
      '大卫·克拉克提出了社交焦虑的认知模型：社恐的人会过度关注自己的内部感受，然后假设别人也注意到了。但实际上，别人根本看不出来——这就是"聚光灯效应"。',
      '在远古时代，被群体排斥确实意味着生存危险。但现代社会，一次社交尴尬不会让你被"赶出部落"。',
    ],
    suggestions: [
      '把注意力从"别人怎么看我"转移到"我对他人的好奇心"——当你真心想了解一个人时，你的焦虑会自动减弱。',
      '设定"不完美目标"：今天和同事聊天，目标不是"表现完美"，而是"说一句自己真正想说的话"。',
      '渐进式练习：从对便利店店员微笑说"谢谢"开始，到和同事聊两句天气，一步步扩大舒适圈。',
      '当"内在评判"开始说话时，给它起个名字——比如"老张又在唠叨了"——然后继续做你的事。',
    ],
    followUps: [
      '你社交的时候，最怕什么？是怕说错话、怕尴尬、还是怕被拒绝？',
      '有没有什么社交场合，是你觉得相对舒服的？',
      '你一个人待着的时候，感觉怎么样？',
    ],
  },
  '羞耻': {
    validations: [
      '你现在可能被一种"我不配"的感觉压着。这不是你做错了什么，而是你觉得自己"整个人都是错的"。这种感觉很沉重，因为它让你想藏起来、想消失。但羞耻感最大的谎言就是"只有你一个人这样"。',
      '羞耻感是一种特别孤独的情绪——它让你觉得自己是全世界唯一一个"有问题"的人，于是你不敢说、不敢问。但羞耻感最怕的就是"被说出来"——一旦说出来，它就失去了大半的力量。',
    ],
    deepening: [
      '你的羞耻感可能来自很深的"自我否定"——你觉得自己不配被爱、不配被接纳。但这个信念不是天生的，它可能来自过去的某个经历。',
      '你把"做了一件不太好的事"和"我是一个不好的人"混在一起了。前者是内疚，后者是羞耻——它们是两种完全不同的情绪。',
    ],
    insights: [
      '布琳·布朗用了十年研究羞耻感，她发现：羞耻感需要三样东西才能生长——评判、沉默和秘密。而它的解药是共情——当你把羞耻感说出来，被一个不带评判的人接纳时，羞耻感就失去了力量。',
    ],
    suggestions: [
      '把那个让你羞耻的事情说出来——找一个你绝对信任的人，或者写在一张纸上。',
      '区分"我做了不好的事"和"我是不好的人"——你犯的错不等于你这个人。',
      '问自己：如果这件事发生在你最好的朋友身上，你会怎么对他说？用同样的语气对自己说。',
      '允许自己"不完美"——你不需要做一个没有瑕疵的人，你只需要做一个真实的、完整的人。',
    ],
    followUps: [
      '你羞耻的，是关于什么？一件具体的事，还是笼统的"觉得自己不够好"？',
      '如果这件事发生在你最好的朋友身上，你会怎么看他？',
    ],
  },
  '嫉妒': {
    validations: [
      '嫉妒是一种让人很不舒服但又非常普遍的情绪。看到别人拥有你渴望的东西——心里酸酸的，这并不意味着你是一个"坏人"。嫉妒其实是一面镜子，它照出了你真正在意和渴望的东西。',
      '嫉妒的时候，你可能会觉得自己很"阴暗"。但嫉妒是人类最普遍的情绪之一——几乎所有人在某个时刻都会嫉妒。区别只在于，你怎么对待它。',
    ],
    deepening: [
      '你的嫉妒可能不是"恨别人有"，而是"恨自己没有"。嫉妒的对面，是你对自己现状的不满——这其实是一个信号，告诉你可以往哪个方向努力。',
      '你可能会因为嫉妒而感到羞耻——觉得自己"不应该嫉妒"。但嫉妒本身不是问题，问题是你不允许自己承认它。',
    ],
    insights: [
      '布琳·布朗说，如果你把嫉妒转成"我想要那个，我要怎么才能得到？"，嫉妒就变成了动力。',
      '社会比较理论告诉我们，人类天生就会比较。但社交媒体让我们每天看到无数人的"高光时刻"，大大增加了不必要的比较。',
    ],
    suggestions: [
      '把嫉妒当作"愿望探测器"——你嫉妒别人什么，说明你可能也想要那个东西。把它写下来，变成你自己的目标。',
      '减少社交媒体上的比较——你看到的都是别人精心剪辑的"高光时刻"，不是真实的全部。',
      '关注自己的进步——和昨天的自己比，而不是和别人的今天比。',
      '把嫉妒转成欣赏——试着对让你嫉妒的人说"你做得真好，我能问问你是怎么做到的吗？"',
    ],
    followUps: [
      '你嫉妒的，是具体什么人？还是笼统的"别人的生活"？',
      '你嫉妒的东西，是你真正想要的，还是你觉得"应该"想要的？',
    ],
  },
  '麻木': {
    validations: [
      '你现在可能处于一种"什么都感觉不到"的状态——不快乐也不悲伤，不愤怒也不兴奋，好像一台关掉了情感开关的机器。麻木其实是一种自我保护——当情绪太强烈、太痛苦的时候，大脑会自动"关闭"感受通道。',
      '麻木有时候比难过更可怕——因为难过至少说明你还在感受，而"没有感觉"让你觉得自己像一潭死水。这不是你"冷血"——这是你的情绪系统在经历了太多之后，给自己按下了暂停键。',
    ],
    deepening: [
      '你的麻木可能是一种"情绪冻结"——你的大脑为了保护你，把所有的情绪都锁起来了。这是一种聪明的生存策略，但长期处于这种状态，也会让你失去感受快乐的能力。',
      '你可能已经习惯了麻木，甚至觉得"这样也挺好，至少不会痛"。但麻木不是终点——它只是你的心暂时休息的方式。',
    ],
    insights: [
      '贝塞尔·范德科尔克在《身体从未忘记》中说，创伤会让人与自己的身体"失联"。麻木，就是这种失联的表现。重新连接身体感受，是走出麻木的第一步。',
      '长期的压力和创伤会让大脑的"情绪中枢"和"理智中枢"之间的连接变弱，导致情绪麻木。这就像大脑的"保险丝"烧断了。',
    ],
    suggestions: [
      '从身体感受开始——洗一个热水澡、吃一口辣的东西、摸一摸不同材质的布料。身体的感觉比情绪更容易被唤醒。',
      '做一些能让你"动起来"的事——运动、跳舞、散步。身体的活动会激活内啡肽，让被"冻结"的情感慢慢融化。',
      '尝试接触艺术——听一首能触动你的歌、看一部感人的电影、读一首诗。别人的表达，有时候能帮你唤醒自己的感受。',
      '如果麻木持续很久，请考虑寻求专业帮助。长期的麻木可能是抑郁的信号。',
    ],
    followUps: [
      '你从什么时候开始有这种"麻木"的感觉的？',
      '在这之前，你有没有经历过特别强烈的情绪或者压力？',
      '有没有什么事情，是能让你稍微有点感觉的？',
    ],
  },
};

// ==================== 通用模板 ====================

function getGenericFragments(emotion: string): EmotionFragments {
  return {
    validations: [
      `你说的这种感觉——"${emotion}"——我感受到了。谢谢你愿意说出来。`,
      `我感受到了，你现在心里可能有一些说不清道不明的东西。这种感觉不是"矫情"，它是你内心真实的反应。`,
    ],
    deepening: [
      '你说的这些，让我对你的感受有了更深的理解。这种感受不是凭空来的——它可能跟你的处境、经历、或者长期积累的东西有关。',
      '听了你的补充，我好像更明白了一些。你现在的感受，可能是因为你一直在某个地方消耗自己，但从来没有停下来好好照顾自己。',
    ],
    insights: [
      '从心理学来看，情绪本身没有好坏——它们都是你的内心在传递信息。关键不是"消除"这种情绪，而是理解它在告诉你什么。',
      '每一种情绪背后都有一个需求。焦虑是在说"我需要安全感"，愤怒是在说"我需要被尊重"，悲伤是在说"我需要被安慰"。你现在的感受，是在告诉你什么？',
    ],
    suggestions: [
      '试着把这种感受写下来——不是"我很X"，而是具体描述发生了什么、想到了什么、身体有什么反应。',
      '找一个你信任的人，哪怕只说一句"我最近不太好"。说出来本身就是一种释放。',
      '做一件能让你感到"被照顾"的小事——泡一杯热茶、听一首喜欢的歌、或者出门走走。',
      '如果这种感受持续很久，严重影响到了你的生活，请考虑寻求专业帮助。',
    ],
    followUps: [
      '这种感觉，最近有没有什么具体的事情触发了它？',
      '你身体的哪个部位感受最明显？比如胸口闷、肩膀紧、还是胃不舒服？',
      '当你感到这种情绪的时候，你通常会做什么？',
      '如果可以的话，你希望现在有什么改变？',
    ],
  };
}

// ==================== 动态回复组装引擎 ====================

/**
 * 组装回复 —— 核心函数
 * 根据上下文动态拼接回复片段，实现非模板化的自然对话
 */
function assembleResponse(
  fragments: EmotionFragments,
  context: ConversationContext,
  userMessage: string,
  primaryEmotion: string,
  isComplex: boolean,
): {
  message: string;
  newStage: ConversationStage;
  followUpQuestions: string[];
} {
  const { stage, turnCount, keyThemes, emotionHistory, sentimentHistory } = context;
  const parts: string[] = [];
  let newStage: ConversationStage = stage;
  let followUpQuestions: string[] = [];

  switch (stage) {
    case 'greeting':
    case 'listening': {
      // 第一阶段：开场 → 共情 + 用户原话反射 + 追问
      const opener = pick(OPENERS);

      // 提取用户原话并反射
      const phrases = extractKeyPhrases(userMessage, 2);
      let reflection = '';
      if (phrases.length > 0) {
        const template = pick(REFLECTION_TEMPLATES);
        reflection = template.replace('{phrase}', phrases[0]);
      }

      // 情绪验证
      const validation = isComplex
        ? '你说的这些，我感受到了一种比较复杂的状态——可能混合了好几种情绪，不太容易用一两个词来概括。这很正常，人的情绪本来就不是非黑即白的。'
        : pick(fragments.validations);

      // 拼接
      parts.push(opener);
      if (reflection) parts.push(reflection);
      parts.push(validation);

      // 追问
      const followUp = pick(fragments.followUps);
      parts.push(followUp);

      newStage = 'exploring';
      followUpQuestions = fragments.followUps.slice(0, 4);
      break;
    }

    case 'validating':
    case 'exploring': {
      // 第二阶段：用户补充了信息 → 深层理解 + 知识片段 + 追问
      const deepening = pick(fragments.deepening);

      // 上下文关联：检查是否与之前的主题相关
      let contextLink = '';
      if (keyThemes.length > 1 && turnCount >= 1) {
        const previousTheme = keyThemes[Math.floor(Math.random() * Math.min(3, keyThemes.length))];
        const currentPhrases = extractKeyPhrases(userMessage, 1);
        if (currentPhrases.length > 0 && previousTheme !== currentPhrases[0]) {
          const linkTemplate = pick(CONTEXT_LINK_TEMPLATES);
          contextLink = linkTemplate.replace('{theme}', previousTheme);
        }
      }

      // 知识片段
      const allEmotions = [...new Set([primaryEmotion, ...emotionHistory])];
      const snippet = getRandomKnowledgeSnippet(allEmotions);
      let knowledgePart = '';
      if (snippet && !context.usedSnippets.has(snippet.text)) {
        context.usedSnippets.add(snippet.text);
        const kTemplate = pick(KNOWLEDGE_TEMPLATES);
        knowledgePart = kTemplate.replace('{snippet}', snippet.text);
      }

      const hasEnoughContext = context.userMessages.length >= 2;

      parts.push(deepening);
      if (contextLink) parts.push(contextLink);
      if (knowledgePart) parts.push(knowledgePart);

      if (hasEnoughContext) {
        // 信息够多，进入洞察阶段
        const insight = pick(fragments.insights);
        parts.push(insight);
        const followUp = pick(fragments.followUps);
        parts.push(followUp);
        newStage = 'deepening';
        followUpQuestions = fragments.followUps.slice(0, 3);
      } else {
        const followUp = pick(fragments.followUps);
        parts.push(followUp);
        newStage = 'exploring';
        followUpQuestions = fragments.followUps.slice(0, 4);
      }
      break;
    }

    case 'deepening': {
      // 第三阶段：引入心理学知识和建议
      const insight = pick(fragments.insights);

      // 知识片段
      const allEmotions = [...new Set([primaryEmotion, ...emotionHistory])];
      const snippet = getRandomKnowledgeSnippet(allEmotions);
      let knowledgePart = '';
      if (snippet && !context.usedSnippets.has(snippet.text)) {
        context.usedSnippets.add(snippet.text);
        const kTemplate = pick(KNOWLEDGE_TEMPLATES);
        knowledgePart = kTemplate.replace('{snippet}', snippet.text);
      }

      // 情绪变化感知
      let sentimentNote = '';
      if (sentimentHistory.length >= 2) {
        const current = sentimentHistory[sentimentHistory.length - 1];
        const previous = sentimentHistory[sentimentHistory.length - 2];
        if (current === 'positive' && previous === 'negative') {
          sentimentNote = pick(SENTIMENT_SHIFT_TEMPLATES.improving);
        } else if (current === 'negative' && previous === 'negative') {
          sentimentNote = pick(SENTIMENT_SHIFT_TEMPLATES.stable);
        }
      }

      const suggestions = fragments.suggestions.slice(0, 3).join('\n\n');
      const closing = pick(CLOSINGS);

      parts.push(insight);
      if (knowledgePart) parts.push(knowledgePart);
      if (sentimentNote) parts.push(sentimentNote);
      parts.push(`我这里有几点想法，你看看有没有对你胃口的：\n\n${suggestions}`);
      parts.push(closing);

      newStage = 'suggesting';
      followUpQuestions = ['嗯，我想再聊聊这个', '可以推荐一些相关的文章给我看吗', '我还想说说别的感受', '谢谢，我感觉好一些了'];
      break;
    }

    case 'insight':
    case 'suggesting': {
      // 用户继续聊 → 给更多建议或文章推荐
      if (userMessage.includes('文章') || userMessage.includes('推荐') || userMessage.includes('阅读')) {
        // 文章推荐在外部处理
        parts.push('好的，我帮你找找相关的文章……');
      } else {
        const suggestion = pick(fragments.suggestions);
        const closing = pick(CLOSINGS);
        parts.push(suggestion);
        parts.push(closing);
      }
      newStage = 'closing';
      followUpQuestions = ['我还想聊聊别的', '可以推荐一些文章吗', '谢谢，今天就到这里'];
      break;
    }

    case 'closing': {
      // 用户想继续聊 → 重新开始一轮
      if (userMessage.includes('继续') || userMessage.includes('再聊') || userMessage.includes('别的')) {
        if (isComplex) {
          parts.push('好的，我在这里。你想聊什么？不用想太多，随便从哪里开始都可以。');
        } else {
          const validation = pick(fragments.validations);
          parts.push('嗯，我还在听。' + validation);
        }
        newStage = 'listening';
        followUpQuestions = [];
      } else {
        parts.push(pick(CLOSINGS));
        newStage = 'closing';
        followUpQuestions = ['我还想聊聊别的', '谢谢，今天就到这里'];
      }
      break;
    }

    default: {
      const opener = pick(OPENERS);
      const validation = isComplex
        ? '你说的这些，我感受到了一种比较复杂的状态。'
        : pick(fragments.validations);
      const followUp = pick(fragments.followUps);
      parts.push(opener, validation, followUp);
      newStage = 'exploring';
      followUpQuestions = fragments.followUps.slice(0, 4);
    }
  }

  return {
    message: parts.filter(Boolean).join('\n\n'),
    newStage,
    followUpQuestions,
  };
}

// ==================== 增强情绪检测 ====================

/**
 * 增强版情绪分析：结合原有关键词匹配 + NLP增强
 */
function enhancedEmotionAnalysis(userMessage: string): {
  primaryEmotion: string;
  allEmotions: string[];
  intensity: number;
} {
  // 原有分析
  const baseResult = analyzeEmotion(userMessage);

  // NLP增强：否定词检测
  const negationEmotion = detectNegationPatterns(userMessage);

  // NLP增强：同义词扩展
  const normalizedEmotions = normalizeEmotion(userMessage);

  // NLP增强：强度修正
  const intensityModifier = detectIntensityModifier(userMessage);

  // 合并所有检测到的情绪
  const allEmotions = new Set<string>();
  if (baseResult.primaryEmotion && baseResult.primaryEmotion !== '不确定' && baseResult.primaryEmotion !== '复杂情绪') {
    allEmotions.add(baseResult.primaryEmotion);
  }
  if (negationEmotion) allEmotions.add(negationEmotion);
  for (const e of normalizedEmotions) allEmotions.add(e);

  // 确定主要情绪
  let primaryEmotion: string;
  if (negationEmotion) {
    primaryEmotion = negationEmotion;
  } else if (normalizedEmotions.length > 0) {
    primaryEmotion = normalizedEmotions[0];
  } else {
    primaryEmotion = baseResult.primaryEmotion;
  }

  // 修正强度
  const intensity = Math.min(10, Math.round(baseResult.intensity * intensityModifier));

  return {
    primaryEmotion,
    allEmotions: [...allEmotions],
    intensity,
  };
}

// ==================== 文章匹配 ====================

function findRelevantArticles(
  query: string,
  emotion: string,
  count: number,
): { id: string; title: string; summary: string }[] {
  if (count <= 0) return [];

  const results = searchArticles(query);
  if (results.length === 0) {
    const fallbackResults = searchArticles(emotion);
    return fallbackResults.slice(0, count).map(r => ({
      id: r.article.id,
      title: r.article.title,
      summary: r.article.summary,
    }));
  }

  return results.slice(0, count).map(r => ({
    id: r.article.id,
    title: r.article.title,
    summary: r.article.summary,
  }));
}

// ==================== 核心入口 ====================

/**
 * 处理用户消息，返回助手回复
 */
export function processMessage(
  userMessage: string,
  session: ConversationSession,
): ConversationResponse {
  const trimmed = userMessage.trim();

  // 1. 增强情绪分析
  const emotionResult = enhancedEmotionAnalysis(trimmed);
  const primaryEmotion = emotionResult.primaryEmotion;
  const isComplex = primaryEmotion === '复杂情绪' || primaryEmotion === '不确定';

  // 2. 构建对话上下文
  const context = buildContext(session);

  // 3. 获取情绪模板
  const fragments = emotionFragments[primaryEmotion] || getGenericFragments(primaryEmotion);

  // 4. 动态组装回复
  const { message, newStage, followUpQuestions } = assembleResponse(
    fragments,
    context,
    trimmed,
    primaryEmotion,
    isComplex,
  );

  // 5. 推荐文章
  const suggestedArticles = findRelevantArticles(
    trimmed,
    primaryEmotion,
    newStage === 'suggesting' || newStage === 'closing' ? 3 : newStage === 'deepening' ? 1 : 0,
  );

  // 6. 如果用户要求推荐文章
  if (trimmed.includes('文章') || trimmed.includes('推荐') || trimmed.includes('阅读')) {
    const articles = findRelevantArticles(trimmed, primaryEmotion, 5);
    if (articles.length > 0) {
      const articleList = articles.map(a => `《${a.title}》——${a.summary}`).join('\n\n');
      return {
        message: `嗯，根据我们聊的这些，我为你找了几篇可能对你有帮助的文章：\n\n${articleList}\n\n你可以点进去看看，觉得哪篇有感觉就读哪篇，不需要全部读完。如果看了之后有什么想法，随时回来跟我说。`,
        detectedEmotion: primaryEmotion,
        suggestedArticles: articles,
        followUpQuestions: ['我还想聊聊别的', '谢谢，今天就到这里'],
        newStage: 'closing',
      };
    }
    return {
      message: '我翻了翻知识库，暂时没找到特别匹配的文章。不过没关系的——我们可以继续聊，或者你也可以去知识库随便逛逛，说不定会碰到让你有感觉的内容。',
      detectedEmotion: primaryEmotion,
      suggestedArticles: [],
      followUpQuestions: ['我还想聊聊别的', '谢谢，今天就到这里'],
      newStage: 'closing',
    };
  }

  return {
    message,
    detectedEmotion: primaryEmotion,
    suggestedArticles,
    followUpQuestions,
    newStage,
  };
}

// ==================== 会话管理 ====================

export function createSession(): ConversationSession {
  return {
    id: genId(),
    title: '新的对话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stage: 'greeting',
    detectedEmotions: [],
  };
}

export function getGreetingMessage(): ChatMessage {
  return {
    id: genId(),
    role: 'assistant',
    content: pick(GREETINGS),
    timestamp: Date.now(),
    followUpQuestions: [
      '我最近有些焦虑……',
      '我感觉很累，什么都不想做',
      '我心里很乱，说不清楚',
      '我很难过，想找人聊聊',
    ],
  };
}