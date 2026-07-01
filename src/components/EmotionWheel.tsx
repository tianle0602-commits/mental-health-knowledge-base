import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { CoreEmotion, SubEmotion } from '@/data/emotionWheel';

interface Props {
  emotions: CoreEmotion[];
  selectedCore: CoreEmotion | null;
  onSelectCore: (emotion: CoreEmotion) => void;
  onDeselectCore: () => void;
  onSelectSub: (sub: SubEmotion) => void;
}

/** 计算楔形 SVG 路径 */
function wedgePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const sa = toRad(startAngle - 90);
  const ea = toRad(endAngle - 90);

  const x1 = cx + outerR * Math.cos(sa);
  const y1 = cy + outerR * Math.sin(sa);
  const x2 = cx + outerR * Math.cos(ea);
  const y2 = cy + outerR * Math.sin(ea);
  const x3 = cx + innerR * Math.cos(ea);
  const y3 = cy + innerR * Math.sin(ea);
  const x4 = cx + innerR * Math.cos(sa);
  const y4 = cy + innerR * Math.sin(sa);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

/** 截断过长的名称 */
function shortenName(name: string, max: number): string {
  return name.length > max ? name.slice(0, max) + '…' : name;
}

export default function EmotionWheel({ emotions, selectedCore, onSelectCore, onDeselectCore, onSelectSub }: Props) {
  const [hoveredCore, setHoveredCore] = useState<CoreEmotion | null>(null);
  const [hoveredSub, setHoveredSub] = useState<SubEmotion | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const size = 440;
  const cx = size / 2;
  const cy = size / 2;

  // 内圈（核心情绪）
  const innerOuterR = 128;
  const innerInnerR = 52;
  const innerWedgeAngle = 360 / emotions.length;

  // 外圈（子情绪）
  const outerOuterR = 200;
  const outerInnerR = 136;
  const outerWedgeAngle = selectedCore ? 360 / selectedCore.subEmotions.length : 0;

  // 内圈文字位置
  const innerTextR = (innerInnerR + innerOuterR) / 2;
  // 外圈文字位置
  const outerTextR = (outerInnerR + outerOuterR) / 2;

  return (
    <div className="relative flex flex-col items-center">
      {/* 轮盘标题 */}
      <motion.p
        className="text-center text-ink-100 text-sm mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {selectedCore
          ? '选择一个具体的感受，看看它背后藏着什么'
          : '点击内圈，找到你此刻的核心情绪'}
      </motion.p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="w-[360px] h-[360px] sm:w-[400px] sm:h-[400px] drop-shadow-xl"
      >
        {/* 滤镜 */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {emotions.map((e) => (
            <radialGradient key={`grad-${e.name}`} id={`grad-${e.name}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={e.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={e.color} stopOpacity="0.5" />
            </radialGradient>
          ))}
        </defs>

        {/* ========== 外圈（子情绪）========== */}
        {selectedCore && selectedCore.subEmotions.map((sub, i) => {
          const startAngle = i * outerWedgeAngle;
          const endAngle = startAngle + outerWedgeAngle;
          const isHovered = hoveredSub?.name === sub.name;

          const scale = isHovered ? 1.04 : 1;
          const midAngle = startAngle + outerWedgeAngle / 2;
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const tx = (scale - 1) * outerOuterR * Math.cos(toRad(midAngle - 90));
          const ty = (scale - 1) * outerOuterR * Math.sin(toRad(midAngle - 90));

          return (
            <g
              key={`outer-${sub.name}`}
              transform={isHovered ? `translate(${tx}, ${ty})` : ''}
              style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
              onClick={() => onSelectSub(sub)}
              onMouseEnter={() => setHoveredSub(sub)}
              onMouseLeave={() => setHoveredSub(null)}
            >
              {/* 楔形 */}
              <path
                d={wedgePath(cx, cy, outerInnerR, outerOuterR * scale, startAngle, endAngle)}
                fill={isHovered ? `url(#grad-${selectedCore.name})` : selectedCore.color}
                opacity={isHovered ? 0.85 : 0.55}
                stroke="white"
                strokeWidth="1.5"
                style={{ transition: 'opacity 0.25s ease' }}
              />
              {/* 分隔线 */}
              <line
                x1={cx + outerInnerR * Math.cos(toRad(startAngle - 90))}
                y1={cy + outerInnerR * Math.sin(toRad(startAngle - 90))}
                x2={cx + outerOuterR * Math.cos(toRad(startAngle - 90))}
                y2={cy + outerOuterR * Math.sin(toRad(startAngle - 90))}
                stroke="white"
                strokeWidth="1"
                opacity={0.5}
              />
              {/* 文字 */}
              <text
                x={cx + outerTextR * Math.cos(toRad(midAngle - 90))}
                y={cy + outerTextR * Math.sin(toRad(midAngle - 90))}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fontWeight={isHovered ? 700 : 500}
                fill="white"
                opacity={isHovered ? 1 : 0.85}
                style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              >
                {shortenName(sub.name, 6)}
              </text>
            </g>
          );
        })}

        {/* 外圈未选中时的提示环 */}
        {!selectedCore && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={outerOuterR}
              fill="none"
              stroke="#E2D9C8"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity={0.5}
            />
            <circle
              cx={cx}
              cy={cy}
              r={outerInnerR}
              fill="none"
              stroke="#E2D9C8"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity={0.3}
            />
          </>
        )}

        {/* ========== 内圈（核心情绪）========== */}
        {emotions.map((emotion, i) => {
          const startAngle = emotion.angle;
          const endAngle = startAngle + innerWedgeAngle;
          const isActive = selectedCore?.name === emotion.name;
          const isHovered = hoveredCore?.name === emotion.name;

          const scale = isActive ? 1.05 : isHovered ? 1.03 : 1;
          const midAngle = startAngle + innerWedgeAngle / 2;
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const tx = (scale - 1) * innerOuterR * Math.cos(toRad(midAngle - 90));
          const ty = (scale - 1) * innerOuterR * Math.sin(toRad(midAngle - 90));

          const dimmed = selectedCore && !isActive;

          return (
            <g
              key={emotion.name}
              transform={isActive || isHovered ? `translate(${tx}, ${ty})` : ''}
              style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
              onClick={() => {
                if (isActive) {
                  onDeselectCore();
                } else {
                  onSelectCore(emotion);
                }
              }}
              onMouseEnter={() => setHoveredCore(emotion)}
              onMouseLeave={() => setHoveredCore(null)}
            >
              {/* 楔形主体 */}
              <path
                d={wedgePath(cx, cy, innerInnerR, innerOuterR * scale, startAngle, endAngle)}
                fill={isActive || isHovered ? `url(#grad-${emotion.name})` : emotion.color}
                opacity={isActive ? 1 : isHovered ? 0.9 : dimmed ? 0.3 : 0.75}
                stroke="white"
                strokeWidth="2"
                style={{ transition: 'opacity 0.3s ease' }}
              />
            </g>
          );
        })}

        {/* 内圈分隔线 */}
        {emotions.map((emotion) => {
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const angle = toRad(emotion.angle - 90);
          const x1 = cx + innerInnerR * Math.cos(angle);
          const y1 = cy + innerInnerR * Math.sin(angle);
          const x2 = cx + innerOuterR * Math.cos(angle);
          const y2 = cy + innerOuterR * Math.sin(angle);
          return (
            <line
              key={`line-${emotion.name}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="white"
              strokeWidth="1.5"
              opacity={selectedCore ? 0.3 : 0.6}
            />
          );
        })}

        {/* 内圈文字标签 */}
        {emotions.map((emotion) => {
          const midAngle = emotion.angle + innerWedgeAngle / 2;
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const rad = toRad(midAngle - 90);
          const tx = cx + innerTextR * Math.cos(rad);
          const ty = cy + innerTextR * Math.sin(rad);
          const isActive = selectedCore?.name === emotion.name;
          const dimmed = selectedCore && !isActive;

          return (
            <g key={`text-${emotion.name}`}>
              {/* emoji 稍微靠内 */}
              <text
                x={cx + (innerTextR - 12) * Math.cos(rad)}
                y={cy + (innerTextR - 12) * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="16"
                opacity={dimmed ? 0.3 : 1}
                style={{ pointerEvents: 'none', transition: 'opacity 0.3s' }}
              >
                {emotion.emoji}
              </text>
              {/* 名称 */}
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight={isActive ? 700 : 500}
                fill="white"
                opacity={dimmed ? 0.3 : 0.95}
                style={{ pointerEvents: 'none', transition: 'opacity 0.3s', textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
              >
                {emotion.name.split('·')[0]}
              </text>
            </g>
          );
        })}

        {/* ========== 中心圆 ========== */}
        <circle
          cx={cx}
          cy={cy}
          r={innerInnerR - 2}
          fill="white"
          opacity={0.95}
          stroke="#E2D9C8"
          strokeWidth="1"
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontWeight={600}
          fill="#5C4F3B"
          style={{ pointerEvents: 'none' }}
        >
          {hoveredSub
            ? hoveredSub.name.length > 6
              ? hoveredSub.name.slice(0, 6) + '…'
              : hoveredSub.name
            : selectedCore
              ? selectedCore.emoji
              : '💭'}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="10"
          fill="#8B7E6B"
          style={{ pointerEvents: 'none' }}
        >
          {hoveredSub
            ? '点击查看'
            : selectedCore
              ? '已选择'
              : '感受'}
        </text>
      </svg>

      {/* 选中后的引导语 */}
      {selectedCore && (
        <motion.p
          className="mt-4 text-center text-sm text-ink-100 max-w-xs"
          style={{ color: selectedCore.color }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          key={selectedCore.name}
        >
          {selectedCore.prompt}
        </motion.p>
      )}

      {/* hover 子情绪时显示描述 */}
      {hoveredSub && (
        <motion.p
          className="mt-2 text-center text-xs text-ink-50 max-w-[280px] leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={hoveredSub.name}
        >
          {hoveredSub.description}
        </motion.p>
      )}
    </div>
  );
}