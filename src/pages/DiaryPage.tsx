import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronLeft, ChevronRight, Smile, Frown, Meh, Heart, Angry } from 'lucide-react';
import type { DiaryEntry } from '@/types';

const STORAGE_KEY = 'xinjing_diary';

const moodConfig = {
  great: { icon: Heart, label: '很棒', color: '#F59E9E', bg: '#FEF2F2' },
  good: { icon: Smile, label: '开心', color: '#F0C75E', bg: '#FFFDF5' },
  okay: { icon: Meh, label: '还好', color: '#7DA08A', bg: '#F4F8F5' },
  sad: { icon: Frown, label: '难过', color: '#8B9DC3', bg: '#F5F7FA' },
  terrible: { icon: Angry, label: '很差', color: '#B8A9C9', bg: '#F8F6FA' },
};

function loadEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: DiaryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekDays[d.getDay()]}`;
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>(loadEntries);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedMood, setSelectedMood] = useState<DiaryEntry['mood']>('okay');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const paginatedEntries = entries.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const openEditor = (entry?: DiaryEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setSelectedMood(entry.mood);
      setContent(entry.content);
    } else {
      setEditingId(null);
      setSelectedMood('okay');
      setContent('');
    }
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!content.trim()) return;

    const now = new Date().toISOString();
    if (editingId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, mood: selectedMood, content: content.trim() }
            : e
        )
      );
    } else {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: now,
        mood: selectedMood,
        content: content.trim(),
      };
      setEntries((prev) => [newEntry, ...prev]);
      setCurrentPage(0);
    }
    setShowEditor(false);
    setContent('');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (paginatedEntries.length <= 1 && currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="max-w-[640px] mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-serif text-3xl font-bold text-ink-700">
            心灵日记
          </h1>
          <p className="mt-3 text-ink-100 leading-relaxed">
            写下此刻的心情，记录每一天的感受。日记是给自己的礼物，也是情绪的出口。
          </p>
        </motion.div>

        {/* New Entry Button */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            onClick={() => openEditor()}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-sage-500 text-white rounded-full font-medium hover:bg-sage-600 transition-all duration-300 hover:shadow-lg hover:shadow-sage-500/25 hover:-translate-y-0.5"
          >
            <Plus size={18} />
            写一篇新日记
          </button>
        </motion.div>

        {/* Editor Modal */}
        <AnimatePresence>
          {showEditor && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm"
                onClick={() => setShowEditor(false)}
              />
              <motion.div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="p-6">
                  <h2 className="font-serif text-xl font-semibold text-ink-700 mb-5">
                    {editingId ? '编辑日记' : '新日记'}
                  </h2>

                  {/* Mood Selector */}
                  <div className="mb-5">
                    <p className="text-sm text-ink-50 mb-3">今天的心情如何？</p>
                    <div className="flex gap-3">
                      {(Object.entries(moodConfig) as [DiaryEntry['mood'], typeof moodConfig['great']][]).map(
                        ([key, config]) => {
                          const Icon = config.icon;
                          const isSelected = selectedMood === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedMood(key)}
                              style={{
                                backgroundColor: isSelected ? config.bg : 'transparent',
                              }}
                              className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                isSelected
                                  ? 'ring-2 ring-sage-500 ring-offset-1 scale-110'
                                  : 'hover:scale-105 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <Icon size={28} color={config.color} />
                              <span
                                className="text-xs font-medium"
                                style={{ color: config.color }}
                              >
                                {config.label}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-5">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="写下你想说的话……今天发生了什么？你感受到了什么？"
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-50/50 text-ink-700 placeholder-ink-50/60 resize-none focus:outline-none focus:border-sage-500 focus:ring-4 focus:ring-sage-500/10 transition-all duration-200 text-base leading-relaxed"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowEditor(false)}
                      className="px-5 py-2.5 rounded-full text-sm text-ink-100 hover:bg-warm-100 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!content.trim()}
                      className="px-6 py-2.5 bg-sage-500 text-white rounded-full text-sm font-medium hover:bg-sage-600 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      保存日记
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries List */}
        <AnimatePresence mode="wait">
          {entries.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-50 flex items-center justify-center">
                <Heart size={24} className="text-warm-200" />
              </div>
              <p className="text-ink-100 text-lg mb-1">还没有写日记</p>
              <p className="text-ink-50 text-sm">写下你的第一篇日记吧</p>
            </motion.div>
          ) : (
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {paginatedEntries.map((entry) => {
                const mood = moodConfig[entry.mood];
                const Icon = mood.icon;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    className="p-5 rounded-2xl bg-white border border-warm-200/50 hover:border-sage-200 hover:shadow-sm transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: mood.bg }}
                        >
                          <Icon size={18} color={mood.color} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-ink-700">
                            {mood.label}
                          </span>
                          <span className="text-xs text-ink-50 ml-2">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditor(entry)}
                          className="p-1.5 rounded-lg text-ink-50 hover:text-sage-600 hover:bg-sage-50 transition-colors"
                          title="编辑"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 rounded-lg text-ink-50 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-ink-100 leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-full text-ink-50 hover:text-ink-700 hover:bg-warm-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-ink-50">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-full text-ink-50 hover:text-ink-700 hover:bg-warm-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}