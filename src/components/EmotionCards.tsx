import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Tag, ArrowLeft } from 'lucide-react';
import type { CoreEmotion, SubEmotion } from '@/data/emotionWheel';

interface Props {
  subEmotion: SubEmotion;
  coreEmotion: CoreEmotion;
  onSelectTag: (tag: string) => void;
  onBack: () => void;
}

export default function EmotionCards({ subEmotion, coreEmotion, onSelectTag, onBack }: Props) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  return (
    <motion.div
      className="w-full max-w-[640px] mx-auto mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{coreEmotion.emoji}</span>
          <div>
            <span className="text-xs text-ink-50">{coreEmotion.name}</span>
            <span className="text-xs text-ink-30 mx-1.5">→</span>
            <h3 className="inline font-serif text-lg font-semibold" style={{ color: coreEmotion.color }}>
              {subEmotion.name}
            </h3>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-ink-50 hover:text-ink-100 transition-colors underline underline-offset-4"
        >
          <ArrowLeft size={14} />
          返回外圈
        </button>
      </div>

      <p className="text-sm text-ink-100 mb-6 leading-relaxed">
        {subEmotion.description}
      </p>

      {/* 标签选择 */}
      <div
        className="p-4 rounded-2xl border"
        style={{
          borderColor: coreEmotion.lightColor,
          backgroundColor: `${coreEmotion.lightColor}60`,
        }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <Tag size={13} className="text-ink-40" />
          <span className="text-xs text-ink-50">选择最贴近你的描述：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {subEmotion.tags.map((tag) => {
            const isTagHovered = hoveredTag === tag;
            return (
              <motion.button
                key={tag}
                onClick={() => onSelectTag(tag)}
                onMouseEnter={() => setHoveredTag(tag)}
                onMouseLeave={() => setHoveredTag(null)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1"
                style={{
                  backgroundColor: isTagHovered ? coreEmotion.color : 'white',
                  color: isTagHovered ? 'white' : coreEmotion.color,
                  borderColor: coreEmotion.lightColor,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isTagHovered && <Sparkles size={10} />}
                {tag}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}