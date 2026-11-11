import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Trash2, ShieldCheck, Tag } from 'lucide-react';
import { FinanceItem, FinanceStats } from '../types.js';

interface WorldFinanceProps {
  financeItems: FinanceItem[];
  stats: FinanceStats;
  selectedDate: string;
  onAddFinance: (item: { amount: number; direction: string; category: string; note: string; currency: string; date: string }) => Promise<void>;
  onDeleteFinance: (id: number) => Promise<void>;
}

export const WorldFinance: React.FC<WorldFinanceProps> = ({
  financeItems,
  stats,
  selectedDate,
  onAddFinance,
  onDeleteFinance,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('أكل');
  const [currency, setCurrency] = useState('جنيه');
  const [note, setNote] = useState('');

  const categories = [
    'أكل',
    'مواصلات',
    'فواتير',
    'صحة',
    'تسوق',
    'ترفيه',
    'بيت',
    'شغل',
    'تعليم',
    'أخرى',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    await onAddFinance({
      amount: Number(amount),
      direction,
      category,
      note,
      currency,
      date: selectedDate,
    });
    setAmount('');
    setNote('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Income Card */}
        <div className="bg-[#FFFCF5] border border-[#6FA84A]/30 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6FA84A] mb-2">
            <span className="text-xs font-semibold">إجمالي الدخل</span>
            <div className="w-8 h-8 rounded-xl bg-[#6FA84A]/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-bold text-xl text-[#34302A] tracking-tight">
            +{stats.totalIncome.toLocaleString()} <span className="text-xs font-normal text-[#6E665A]">جنيه</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-[#FFFCF5] border border-[#E0705C]/30 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#E0705C] mb-2">
            <span className="text-xs font-semibold">إجمالي المصاريف</span>
            <div className="w-8 h-8 rounded-xl bg-[#E0705C]/15 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="font-bold text-xl text-[#34302A] tracking-tight">
            -{stats.totalExpenses.toLocaleString()} <span className="text-xs font-normal text-[#6E665A]">جنيه</span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="bg-[#FFFCF5] border border-[#5285A6]/30 rounded-3xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#5285A6] mb-2">
            <span className="text-xs font-semibold">الصافي</span>
            <div className="w-8 h-8 rounded-xl bg-[#5285A6]/15 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`font-bold text-xl tracking-tight ${stats.net >= 0 ? 'text-[#4C7459]' : 'text-[#E0705C]'}`}>
            {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()} <span className="text-xs font-normal text-[#6E665A]">جنيه</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#34302A] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#6FA84A]" />
            <span>توزيع المصاريف حسب البند (الـ 10 بنود)</span>
          </h3>
          <span className="text-xs text-[#9E9689]">
            إجمالي المصاريف: {stats.totalExpenses.toLocaleString()} جنيه
          </span>
        </div>

        {stats.totalExpenses === 0 ? (
          <p className="text-xs text-center py-4 text-[#9E9689]">لا توجد مصاريف مسجلة حتى الآن</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const spent = stats.categoryTotals[cat] || 0;
              if (spent === 0) return null;
              const pct = Math.round((spent / stats.totalExpenses) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#34302A]">{cat}</span>
                    <span className="font-mono text-[#6E665A]">
                      {spent.toLocaleString()} جنيه ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F6F1E4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6FA84A] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#34302A]">سجل المعاملات والقيود المالية</h3>
            <p className="text-xs text-[#6E665A]">كل ما تم استخراجه من الصوت والكتابة مع حماية من التكرار</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6FA84A]/15 hover:bg-[#6FA84A]/25 text-[#4A782F] text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة قيد يدوي</span>
          </button>
        </div>

        {financeItems.length === 0 ? (
          <p className="text-xs text-center py-8 text-[#9E9689]">لا توجد معاملات مسجلة</p>
        ) : (
          <div className="divide-y divide-[#ECE6D8]">
            {financeItems.map((item) => {
              const isIncome = item.direction === 'income';
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isIncome ? 'bg-[#6FA84A]/15 text-[#4A782F]' : 'bg-[#E0705C]/15 text-[#B84E3C]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#34302A]">{item.category}</span>
                        <span className="text-[10px] text-[#9E9689]">{item.date}</span>
                      </div>
                      {item.note && <p className="text-xs text-[#6E665A] mt-0.5">{item.note}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-sm font-mono ${
                        isIncome ? 'text-[#4A782F]' : 'text-[#B84E3C]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{item.amount.toLocaleString()} {item.currency}
                    </span>
                    <button
                      onClick={() => onDeleteFinance(item.id)}
                      className="p-1.5 rounded-lg text-[#9E9689] hover:text-[#E0705C] hover:bg-[#F6F1E4] transition-colors"
                      title="حذف القيد"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Protection Note */}
        <div className="p-3 rounded-2xl bg-[#5C8A6B]/10 border border-[#5C8A6B]/20 text-[11px] text-[#4C7459] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#5C8A6B]" />
          <span>
            طبقة الحماية النشطة: يطابق دوّنلي النصوص المطبّعة والمبالغ لمنع تسجيل أي مصروف مرتين، ويحدّث أهداف الادخار تلقائيًا مع أي دخل.
          </span>
        </div>
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إضافة قيد مالي جديد</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-[#6E665A] hover:text-[#34302A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Income vs Expense Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('expense')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    direction === 'expense'
                      ? 'bg-[#E0705C] text-white border-[#E0705C]'
                      : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB]'
                  }`}
                >
                  مصروف (صرفت/دفعت)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('income')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    direction === 'income'
                      ? 'bg-[#6FA84A] text-white border-[#6FA84A]'
                      : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB]'
                  }`}
                >
                  دخل (كسبت/جالي)
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">المبلغ</label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="150"
                    required
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-sm text-[#34302A] font-bold focus:outline-none focus:border-[#6FA84A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">العملة</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-2 py-2 text-xs text-[#34302A] focus:outline-none focus:border-[#6FA84A]"
                  >
                    <option value="جنيه">جنيه</option>
                    <option value="دولار">دولار</option>
                    <option value="ريال">ريال</option>
                    <option value="درهم">درهم</option>
                    <option value="يورو">يورو</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">البند</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A] focus:outline-none focus:border-[#6FA84A]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">ملاحظة أو وصف</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثلاً: غدا مشاوي أو بنزين السيارة"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A] focus:outline-none focus:border-[#6FA84A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A] hover:bg-[#F6F1E4]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6FA84A] hover:bg-[#5D8E3E] text-white text-xs font-bold shadow-xs"
                >
                  حفظ القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
