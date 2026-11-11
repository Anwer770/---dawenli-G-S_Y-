import React, { useState } from 'react';
import { Target, CheckCircle, Flame, Plus, Trash2, TrendingUp, History, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Habit, Goal } from '../types.js';

interface WorldHabitsGoalsProps {
  habits: Habit[];
  goals: Goal[];
  onToggleHabit: (id: number) => Promise<void>;
  onAddHabit: (habit: { title: string; habit_type: 'do' | 'quit'; target_days?: number }) => Promise<void>;
  onDeleteHabit: (id: number) => Promise<void>;
  onAddGoal: (goal: { title: string; target_amount: number; current_amount?: number; unit: string; periodicity: string; deadline?: string }) => Promise<void>;
  onUpdateGoal: (id: number, current_amount: number, target_amount?: number) => Promise<void>;
  onDeleteGoal: (id: number) => Promise<void>;
}

export const WorldHabitsGoals: React.FC<WorldHabitsGoalsProps> = ({
  habits,
  goals,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [activeSection, setActiveSection] = useState<'habits' | 'goals'>('habits');
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // New Habit State
  const [habitTitle, setHabitTitle] = useState('');
  const [habitType, setHabitType] = useState<'do' | 'quit'>('do');
  const [targetDays, setTargetDays] = useState('30');

  // New Goal State
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [goalUnit, setGoalUnit] = useState('جنيه');
  const [periodicity, setPeriodicity] = useState('monthly');
  const [deadline, setDeadline] = useState('');

  // Update Goal Dialog State
  const [updateCurrentAmount, setUpdateCurrentAmount] = useState('');

  const handleToggle = async (habit: Habit) => {
    await onToggleHabit(habit.id);
    if (!habit.doneToday) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    await onAddHabit({
      title: habitTitle.trim(),
      habit_type: habitType,
      target_days: Number(targetDays) || 30,
    });
    setHabitTitle('');
    setShowAddHabitModal(false);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !targetAmount) return;
    await onAddGoal({
      title: goalTitle.trim(),
      target_amount: Number(targetAmount),
      current_amount: currentAmount ? Number(currentAmount) : 0,
      unit: goalUnit,
      periodicity,
      deadline: deadline || undefined,
    });
    setGoalTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setShowAddGoalModal(false);
  };

  const handleSaveGoalUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !updateCurrentAmount) return;
    const newAmt = Number(updateCurrentAmount);
    await onUpdateGoal(editingGoal.id, newAmt);
    if (newAmt >= editingGoal.target_amount) {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
      });
    }
    setEditingGoal(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Selector: Habits vs Goals */}
      <div className="flex items-center gap-2 border-b border-[#ECE6D8] pb-2">
        <button
          onClick={() => setActiveSection('habits')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSection === 'habits'
              ? 'bg-[#E3A24A] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>العادات والالتزام اليومي ({habits.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('goals')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSection === 'goals'
              ? 'bg-[#5285A6] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>الأهداف والتقدم الرقمي ({goals.length})</span>
        </button>
      </div>

      {/* Section 1: Habits */}
      {activeSection === 'habits' && (
        <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">متابعة العادات اليومية (Do / Quit)</h3>
              <p className="text-xs text-[#6E665A]">اضغط المربع لتعليم الإنجاز أو دع دوّنلي يعلّمه تلقائياً من صوتك</p>
            </div>
            <button
              onClick={() => setShowAddHabitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E3A24A]/15 hover:bg-[#E3A24A]/25 text-[#A66E1D] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة عادة جديدة</span>
            </button>
          </div>

          {habits.length === 0 ? (
            <p className="text-xs text-center py-8 text-[#9E9689]">لا توجد عادات مسجلة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {habits.map((habit) => {
                const isQuit = habit.habit_type === 'quit';
                return (
                  <div
                    key={habit.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      habit.doneToday
                        ? 'bg-[#E3A24A]/10 border-[#E3A24A]/40 shadow-xs'
                        : 'bg-[#F6F1E4]/50 border-[#E3DCB] hover:bg-[#F6F1E4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(habit)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${
                          habit.doneToday
                            ? 'bg-[#E3A24A] text-white border-[#E3A24A]'
                            : 'bg-[#FFFCF5] text-transparent border-[#E3DCB] hover:border-[#E3A24A]'
                        }`}
                        title="تعليم الإنجاز"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs ${habit.doneToday ? 'line-through text-[#6E665A]' : 'text-[#34302A]'}`}>
                            {habit.title}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isQuit ? 'bg-[#E0705C]/15 text-[#B84E3C]' : 'bg-[#5C8A6B]/15 text-[#4C7459]'
                            }`}
                          >
                            {isQuit ? 'بطّل' : 'اعمل'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6E665A]">
                          <span className="flex items-center gap-1 font-bold text-[#A66E1D]">
                            <Flame className="w-3.5 h-3.5 fill-[#E3A24A] text-[#E3A24A]" />
                            ستريك: {habit.streak || 0} يوم
                          </span>
                          <span className="text-[#9E9689]">• هدف {habit.target_days} يوم</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 rounded-lg text-[#9E9689] hover:text-[#E0705C] hover:bg-[#F6F1E4]"
                      title="حذف العادة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Goals */}
      {activeSection === 'goals' && (
        <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">الأهداف والمستهدفات الرقمية</h3>
              <p className="text-xs text-[#6E665A]">
                يتم زيادة أهداف الادخار المالي آلياً عند تسجيل أي دخل في الفلوس منعاً للازدواجية
              </p>
            </div>
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5285A6]/15 hover:bg-[#5285A6]/25 text-[#376380] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة هدف جديد</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <p className="text-xs text-center py-8 text-[#9E9689]">لا توجد أهداف مسجلة حتى الآن</p>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-2xl bg-[#F6F1E4]/50 border border-[#E3DCB] space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#34302A]">{goal.title}</span>
                        <span className="text-[10px] bg-[#5285A6]/15 text-[#376380] px-2 py-0.5 rounded-md font-semibold">
                          {goal.periodicity === 'monthly' ? 'شهري' : goal.periodicity === 'yearly' ? 'سنوي' : 'محدد'}
                        </span>
                        {goal.deadline && (
                          <span className="text-[10px] text-[#9E9689]">الموعد: {goal.deadline}</span>
                        )}
                      </div>
                      <div className="text-xs text-[#6E665A] mt-1">
                        تم إنجاز: <span className="font-bold text-[#34302A]">{goal.current_amount.toLocaleString()}</span> من{' '}
                        <span className="font-bold text-[#34302A]">{goal.target_amount.toLocaleString()}</span> {goal.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setUpdateCurrentAmount(goal.current_amount.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FFFCF5] hover:bg-[#F6F1E4] border border-[#E3DCB] text-[#34302A]"
                      >
                        تعديل الرقم
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1 rounded-lg text-[#9E9689] hover:text-[#E0705C] hover:bg-[#F6F1E4]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-[#FFFCF5] border border-[#E3DCB] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5285A6] rounded-full transition-all duration-500"
                        style={{ width: `${goal.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#6E665A]">
                      <span>النسبة: {goal.percentage}%</span>
                      <span>
                        المتبقي:{' '}
                        {Math.max(0, goal.target_amount - goal.current_amount).toLocaleString()} {goal.unit}
                      </span>
                    </div>
                  </div>

                  {/* Goal History Snippet */}
                  {goal.history && goal.history.length > 0 && (
                    <div className="pt-2 border-t border-[#E3DCB]/50 flex flex-wrap gap-2 text-[10px] text-[#6E665A]">
                      <span className="flex items-center gap-1 font-semibold text-[#376380]">
                        <History className="w-3 h-3" />
                        آخر التغييرات:
                      </span>
                      {goal.history.slice(0, 2).map((h, i) => (
                        <span key={i} className="bg-[#FFFCF5] px-2 py-0.5 rounded border border-[#E3DCB]/60">
                          {h.change_amount >= 0 ? '+' : ''}{h.change_amount} ({h.source === 'finance_income' ? 'دخل مالي' : 'تحديث'}) في {h.date}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Habit */}
      {showAddHabitModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">تعريف عادة جديدة</h3>
              <button
                onClick={() => setShowAddHabitModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">اسم العادة (قصير وثابت)</label>
                <input
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="مثلاً: رياضة، قراءة، شرب ماء، نوم مبكر"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">نوع العادة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHabitType('do')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      habitType === 'do'
                        ? 'bg-[#5C8A6B] text-white border-[#5C8A6B]'
                        : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB]'
                    }`}
                  >
                    اعمل (عادة إيجابية)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHabitType('quit')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      habitType === 'quit'
                        ? 'bg-[#E0705C] text-white border-[#E0705C]'
                        : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB]'
                    }`}
                  >
                    بطّل (عايز تبطلها)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">المستهدف (عدد الأيام)</label>
                <input
                  type="number"
                  value={targetDays}
                  onChange={(e) => setTargetDays(e.target.value)}
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E3A24A] hover:bg-[#C98B35] text-white text-xs font-bold"
                >
                  حفظ العادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Goal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إنشاء هدف جديد</h3>
              <button
                onClick={() => setShowAddGoalModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">عنوان الهدف</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="مثلاً: توفير 50 ألف جنيه أو قراءة 20 كتاب"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">المستهدف الكلي</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">الوحدة</label>
                  <select
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="جنيه">جنيه (مالي)</option>
                    <option value="دولار">دولار (مالي)</option>
                    <option value="كتاب">كتاب</option>
                    <option value="كيلو">كيلو وزن</option>
                    <option value="ساعة">ساعة</option>
                    <option value="صفحة">صفحة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">الرصيد الابتدائي</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">دورية الهدف</label>
                  <select
                    value={periodicity}
                    onChange={(e) => setPeriodicity(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="fixed_date">بتاريخ محدد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">موعد الإنجاز (اختياري)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5285A6] hover:bg-[#3D6E8D] text-white text-xs font-bold"
                >
                  حفظ الهدف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Goal Value */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">تعديل رصيد: {editingGoal.title}</h3>
              <button
                onClick={() => setEditingGoal(null)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleSaveGoalUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">
                  الرصيد الحالي الجديد ({editingGoal.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={updateCurrentAmount}
                  onChange={(e) => setUpdateCurrentAmount(e.target.value)}
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-sm text-[#34302A] font-bold"
                  required
                />
                <span className="text-[11px] text-[#9E9689] mt-1 block">
                  المستهدف الكلي: {editingGoal.target_amount} {editingGoal.unit}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5285A6] hover:bg-[#3D6E8D] text-white text-xs font-bold"
                >
                  تحديث الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
