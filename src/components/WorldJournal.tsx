import React, { useState } from 'react';
import { BookOpen, Edit3, Tag, Smile, Calendar, Trash2, Plus, Sparkles } from 'lucide-react';
import { Entry } from '../types.js';

interface WorldJournalProps {
  currentEntry: Entry | null;
  selectedDate: string;
  allEntries: Entry[];
  onSelectDate: (date: string) => void;
  onSaveEntry: (entryData: { full_text: string; summary?: string; mood?: string; tags?: string[]; date: string }) => Promise<void>;
  onDeleteEntry: (id: number) => Promise<void>;
}

export const WorldJournal: React.FC<WorldJournalProps> = ({
  currentEntry,
  selectedDate,
  allEntries,
  onSelectDate,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editMood, setEditMood] = useState('مرتاح');
  const [editSummary, setEditSummary] = useState('');
  const [editTags, setEditTags] = useState('');

  const startEdit = () => {
    if (currentEntry) {
      setEditText(currentEntry.full_text);
      setEditMood(currentEntry.mood || 'مرتاح');
      setEditSummary(currentEntry.summary || '');
      let tagsArr: string[] = [];
      try {
        tagsArr = JSON.parse(currentEntry.tags_json || '[]');
      } catch (e) {}
      setEditTags(tagsArr.join('، '));
    } else {
      setEditText('');
      setEditMood('مرتاح');
      setEditSummary('');
      setEditTags('');
    }
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    const tags = editTags
      .split(/[،,]/)
      .map((t) => t.trim())
      .filter(Boolean);

    await onSaveEntry({
      full_text: editText.trim(),
      summary: editSummary.trim(),
      mood: editMood,
      tags,
      date: selectedDate,
    });
    setIsEditing(false);
  };

  const moodColors: Record<string, string> = {
    'مرتاح': 'bg-[#5C8A6B]/15 text-[#4C7459] border-[#5C8A6B]/30',
    'سعيد': 'bg-[#E3A24A]/15 text-[#A66E1D] border-[#E3A24A]/30',
    'متحمس': 'bg-[#5285A6]/15 text-[#376380] border-[#5285A6]/30',
    'مجهد': 'bg-[#E0705C]/15 text-[#B84E3C] border-[#E0705C]/30',
    'متوتر': 'bg-[#D06A8C]/15 text-[#A14361] border-[#D06A8C]/30',
    'هادئ': 'bg-[#7C6BC9]/15 text-[#5B4AA8] border-[#7C6BC9]/30',
  };

  let currentTags: string[] = [];
  if (currentEntry?.tags_json) {
    try {
      currentTags = JSON.parse(currentEntry.tags_json);
    } catch (e) {}
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card for Selected Date */}
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECE6D8] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C7355]/15 text-[#8C7355] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#34302A] flex items-center gap-2">
                <span>يوميات {selectedDate}</span>
                {currentEntry && (
                  <span className="text-xs font-normal text-[#9E9689]">
                    ({currentEntry.word_count || 0} كلمة)
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#6E665A]">تدوينة واحدة مدمجة لكل يوم تحفظ سردك وأحداثك ومشاعرك</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E3DCB] hover:bg-[#F6F1E4] text-xs font-semibold text-[#34302A] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#8C7355]" />
              <span>{currentEntry ? 'تعديل التدوينة' : 'كتابة تدوينة اليوم'}</span>
            </button>
            {currentEntry && (
              <button
                onClick={() => onDeleteEntry(currentEntry.id)}
                className="p-1.5 rounded-xl text-[#9E9689] hover:text-[#E0705C] hover:bg-[#F6F1E4] transition-colors"
                title="حذف التدوينة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Current Entry Content or Empty State */}
        {currentEntry ? (
          <div className="space-y-4">
            {/* Mood and Tags Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {currentEntry.mood && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                    moodColors[currentEntry.mood] || 'bg-[#ECE6D8] text-[#34302A] border-[#E3DCB]'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>المزاج: {currentEntry.mood}</span>
                </div>
              )}

              {currentEntry.summary && (
                <div className="text-xs bg-[#5C8A6B]/10 text-[#4C7459] px-3 py-1 rounded-xl font-medium border border-[#5C8A6B]/20">
                  <span className="font-bold ml-1">الملخص:</span>
                  {currentEntry.summary}
                </div>
              )}

              {currentTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] bg-[#F6F1E4] text-[#6E665A] px-2.5 py-0.5 rounded-lg border border-[#E3DCB]"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Entry Narrative */}
            <div className="bg-[#F6F1E4]/50 rounded-2xl p-4 sm:p-5 border border-[#E3DCB]/80 text-[#34302A] text-sm leading-relaxed whitespace-pre-line font-tajawal">
              {currentEntry.full_text}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[#9E9689] space-y-2">
            <BookOpen className="w-10 h-10 mx-auto stroke-1 opacity-40 text-[#8C7355]" />
            <p className="text-sm font-medium text-[#6E665A]">لم تسجل أي يوميات في هذا اليوم بعد</p>
            <p className="text-xs max-w-sm mx-auto">
              يمكنك التحدث بالصوت أو الكتابة في الصندوق العلوي وسيقوم دوّنلي بتسجيل اليومية واستخراج ما فيها تلقائيًا.
            </p>
            <button
              onClick={startEdit}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8C7355]/15 hover:bg-[#8C7355]/25 text-[#735D43] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>كتابة تدوينة يدوية لهذا اليوم</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit or Add Entry Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">تدوين يوميات {selectedDate}</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-[#6E665A] hover:text-[#34302A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">المزاج العام</label>
                <div className="flex flex-wrap gap-1.5">
                  {['مرتاح', 'سعيد', 'متحمس', 'هادئ', 'مجهد', 'متوتر'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditMood(m)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                        editMood === m ? 'bg-[#5C8A6B] text-white border-[#5C8A6B]' : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">ملخص سريع</label>
                <input
                  type="text"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder="مثلاً: يوم مثمر وإنجازات جيدة في العمل"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A] focus:outline-none focus:border-[#5C8A6B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">النص الكامل للسرد</label>
                <textarea
                  rows={5}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="احكِ بالتفصيل كل ما حدث معك في هذا اليوم..."
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl p-3 text-xs text-[#34302A] focus:outline-none focus:border-[#5C8A6B] leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">وسوم الكلمات المفتاحية (مفصولة بفواصل)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="شغل، رياضة، راحة، أصدقاء"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A] focus:outline-none focus:border-[#5C8A6B]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A] hover:bg-[#F6F1E4]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5C8A6B] hover:bg-[#4C7459] text-white text-xs font-bold shadow-xs"
                >
                  حفظ التدوينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Past Entries Navigator */}
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-bold text-sm text-[#34302A] mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#8C7355]" />
          <span>أرشيف التدوينات السابقة</span>
        </h3>

        {allEntries.length === 0 ? (
          <p className="text-xs text-[#9E9689] py-4 text-center">لا توجد تدوينات سابقة محفوظة</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onSelectDate(entry.date)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  entry.date === selectedDate
                    ? 'bg-[#8C7355]/10 border-[#8C7355]/40 shadow-xs'
                    : 'bg-[#F6F1E4]/50 border-[#E3DCB] hover:bg-[#F6F1E4]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#34302A]">{entry.date}</span>
                  {entry.mood && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFCF5] border border-[#E3DCB] text-[#6E665A]">
                      {entry.mood}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6E665A] line-clamp-2 leading-relaxed">
                  {entry.summary || entry.full_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
