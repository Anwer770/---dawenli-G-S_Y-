import React, { useState } from 'react';
import { Brain, Plus, Trash2, X, ShieldCheck } from 'lucide-react';
import { ProfileFact } from '../types.js';

interface ProfileMemoryModalProps {
  facts: ProfileFact[];
  onAddFact: (fact: { category: string; key: string; value: string }) => Promise<void>;
  onDeleteFact: (id: number) => Promise<void>;
  onClose: () => void;
}

export const ProfileMemoryModal: React.FC<ProfileMemoryModalProps> = ({
  facts,
  onAddFact,
  onDeleteFact,
  onClose,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState('هوية');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    await onAddFact({
      category,
      key: key.trim(),
      value: value.trim(),
    });
    setKey('');
    setValue('');
    setShowAddForm(false);
  };

  const categoryLabels: Record<string, string> = {
    'هوية': 'الهوية والجنسية والعملات',
    'صحة': 'الصحة والأمراض المزمنة والحساسية',
    'شغل': 'العمل والتخصص والدراسة',
    'علاقات': 'العلاقات والأشخاص المهمين',
    'تفضيلات': 'التفضيلات الشخصية الثابتة',
  };

  // Group facts by category
  const groupedFacts: Record<string, ProfileFact[]> = {};
  facts.forEach((f) => {
    if (!groupedFacts[f.category]) groupedFacts[f.category] = [];
    groupedFacts[f.category].push(f);
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7C6BC9]/15 text-[#7C6BC9] flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">ذاكرة دوّنلي الدائمة عنك</h3>
              <span className="text-[11px] text-[#6E665A]">معلومات ثابتة يعتمد عليها رفيقك في فهمك ومعاملتك</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#9E9689] hover:text-[#34302A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fact list scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* PRD Rule Banner */}
          <div className="p-3 rounded-2xl bg-[#5C8A6B]/10 border border-[#5C8A6B]/20 text-[11px] text-[#4C7459] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#5C8A6B] mt-0.5" />
            <span>
              قاعدة الدقة 100%: يحفظ دوّنلي المعلومات الثابتة فقط عندما تذكرها صراحةً، وممنوع عليه التخمين (مثل استنتاج الجنسية من اللهجة أو العملة من الأسعار).
            </span>
          </div>

          {facts.length === 0 ? (
            <p className="text-xs text-center py-8 text-[#9E9689]">لا توجد معلومات محفوظة في الذاكرة بعد</p>
          ) : (
            Object.entries(groupedFacts).map(([cat, list]) => (
              <div key={cat} className="space-y-2">
                <h4 className="text-xs font-bold text-[#7C6BC9] border-b border-[#ECE6D8] pb-1">
                  {categoryLabels[cat] || cat}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {list.map((fact) => (
                    <div
                      key={fact.id}
                      className="p-3 rounded-xl bg-[#F6F1E4]/60 border border-[#E3DCB] flex items-center justify-between gap-2"
                    >
                      <div className="text-xs">
                        <span className="font-bold text-[#34302A] ml-1">{fact.key}:</span>
                        <span className="text-[#6E665A]">{fact.value}</span>
                      </div>
                      <button
                        onClick={() => onDeleteFact(fact.id)}
                        className="p-1 text-[#9E9689] hover:text-[#E0705C] transition-colors"
                        title="حذف المعلومة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {showAddForm ? (
            <form onSubmit={handleAdd} className="p-3 rounded-2xl bg-[#FFFCF5] border border-[#7C6BC9]/40 space-y-3">
              <span className="font-bold text-xs text-[#34302A]">إضافة معلومة للذاكرة</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E665A] mb-1">الفئة</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-2.5 py-1.5 text-xs text-[#34302A]"
                  >
                    <option value="هوية">هوية / جنسية / عملات</option>
                    <option value="صحة">صحة / مرض مزمن / حساسية</option>
                    <option value="شغل">شغل / دراسة / مجال</option>
                    <option value="علاقات">علاقات مهمة</option>
                    <option value="تفضيلات">تفضيل شخصي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E665A] mb-1">المفتاح</label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="الجنسية / العملات / الوظيفة"
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-2.5 py-1.5 text-xs text-[#34302A]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6E665A] mb-1">القيمة</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="مثلاً: مصري أو الجنيه المصري والدولار"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-2.5 py-1.5 text-xs text-[#34302A]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 rounded-xl text-xs text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#7C6BC9] text-white text-xs font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 rounded-xl border border-dashed border-[#B8B0A0] text-xs font-bold text-[#7C6BC9] hover:bg-[#F6F1E4] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة معلومة دائمة جديدة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
