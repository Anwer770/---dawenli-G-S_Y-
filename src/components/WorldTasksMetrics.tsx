import React, { useState } from 'react';
import { CheckSquare, Clock, Plus, Trash2, Gauge, TrendingUp, Check, AlertCircle } from 'lucide-react';
import { Task, Metric } from '../types.js';

interface WorldTasksMetricsProps {
  tasks: Task[];
  metrics: Metric[];
  selectedDate: string;
  onToggleTask: (id: number) => Promise<void>;
  onAddTask: (task: { title: string; date?: string; time?: string; priority?: string; note?: string }) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  onAddMetric: (metric: { name: string; unit: string; daily_target: number }) => Promise<void>;
  onLogMetricValue: (id: number, value: number) => Promise<void>;
  onDeleteMetric: (id: number) => Promise<void>;
}

export const WorldTasksMetrics: React.FC<WorldTasksMetricsProps> = ({
  tasks,
  metrics,
  selectedDate,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onAddMetric,
  onLogMetricValue,
  onDeleteMetric,
}) => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);

  // New Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskNote, setTaskNote] = useState('');

  // New Metric State
  const [metricName, setMetricName] = useState('');
  const [metricUnit, setMetricUnit] = useState('ساعة');
  const [metricTarget, setMetricTarget] = useState('6');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await onAddTask({
      title: taskTitle.trim(),
      date: selectedDate,
      time: taskTime || undefined,
      priority: taskPriority,
      note: taskNote || undefined,
    });
    setTaskTitle('');
    setTaskTime('');
    setTaskNote('');
    setShowAddTaskModal(false);
  };

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricName.trim()) return;
    await onAddMetric({
      name: metricName.trim(),
      unit: metricUnit.trim(),
      daily_target: Number(metricTarget) || 0,
    });
    setMetricName('');
    setShowAddMetricModal(false);
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-[#E0705C]/15 text-[#B84E3C] border-[#E0705C]/30',
    medium: 'bg-[#E3A24A]/15 text-[#A66E1D] border-[#E3A24A]/30',
    low: 'bg-[#5C8A6B]/15 text-[#4C7459] border-[#5C8A6B]/30',
  };

  return (
    <div className="space-y-6">
      {/* Tasks Section */}
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#34302A] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#5C8A6B]" />
              <span>مهام اليوم والمواعيد القادمة</span>
            </h3>
            <p className="text-xs text-[#6E665A]">المواعيد والمهمات المستخرجة تلقائياً من المحادثة</p>
          </div>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5C8A6B]/15 hover:bg-[#5C8A6B]/25 text-[#4C7459] text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مهمة</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-xs text-center py-6 text-[#9E9689]">لا توجد مهام مسجلة لهذا اليوم</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-[#F6F1E4]/50 border-transparent text-[#9E9689]'
                    : 'bg-[#F6F1E4] border-[#E3DCB] text-[#34302A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors border ${
                      task.completed
                        ? 'bg-[#5C8A6B] text-white border-[#5C8A6B]'
                        : 'bg-white border-[#E3DCB] hover:border-[#5C8A6B]'
                    }`}
                  >
                    {task.completed ? <Check className="w-3.5 h-3.5" /> : null}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                      {task.time && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#FFFCF5] px-2 py-0.5 rounded-md border border-[#E3DCB] text-[#6E665A]">
                          <Clock className="w-3 h-3 text-[#5C8A6B]" />
                          {task.time}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${priorityColors[task.priority] || priorityColors.medium}`}>
                        {task.priority === 'high' ? 'أولوية عالية' : task.priority === 'low' ? 'منخفضة' : 'متوسطة'}
                      </span>
                    </div>
                    {task.note && <p className="text-[11px] text-[#6E665A] mt-0.5">{task.note}</p>}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 rounded-lg text-[#9E9689] hover:text-[#E0705C] hover:bg-[#FFFCF5]"
                  title="حذف المهمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Trackers Section */}
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#34302A] flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#E3A24A]" />
              <span>المتتبِّعات الرقمية اليومية (Metrics)</span>
            </h3>
            <p className="text-xs text-[#6E665A]">أي رقم يتكرر يومياً: ساعات عمل، خطوات، لتر ماء، صفحات</p>
          </div>
          <button
            onClick={() => setShowAddMetricModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E3A24A]/15 hover:bg-[#E3A24A]/25 text-[#A66E1D] text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة متتبع</span>
          </button>
        </div>

        {metrics.length === 0 ? (
          <p className="text-xs text-center py-6 text-[#9E9689]">لا توجد متتبعات يومية معرفة</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.map((m) => {
              const pct = m.daily_target > 0 ? Math.min(100, Math.round((m.todayValue / m.daily_target) * 100)) : 0;
              return (
                <div key={m.id} className="p-4 rounded-2xl bg-[#F6F1E4]/50 border border-[#E3DCB] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#34302A]">{m.name}</h4>
                      <div className="text-lg font-bold font-mono text-[#34302A] mt-1">
                        {m.todayValue}{' '}
                        <span className="text-xs font-normal text-[#6E665A]">{m.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteMetric(m.id)}
                      className="p-1 rounded-lg text-[#9E9689] hover:text-[#E0705C]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Target bar */}
                  {m.daily_target > 0 && (
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-[#FFFCF5] rounded-full overflow-hidden border border-[#E3DCB]">
                        <div
                          className="h-full bg-[#E3A24A] rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#6E665A]">
                        <span>الهدف: {m.daily_target} {m.unit}</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  )}

                  {/* Quick increment/decrement buttons */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => onLogMetricValue(m.id, Math.max(0, m.todayValue - 1))}
                      className="w-7 h-7 rounded-lg bg-[#FFFCF5] hover:bg-[#F6F1E4] border border-[#E3DCB] text-xs font-bold text-[#34302A] flex items-center justify-center"
                      title="-1"
                    >
                      -
                    </button>
                    <button
                      onClick={() => onLogMetricValue(m.id, m.todayValue + 1)}
                      className="w-7 h-7 rounded-lg bg-[#E3A24A] hover:bg-[#C98B35] text-white text-xs font-bold flex items-center justify-center shadow-xs"
                      title="+1"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إضافة مهمة جديدة</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">عنوان المهمة</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="مثلاً: ميتنج مع العميل أو شراء أغراض المنزل"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">الوقت (اختياري)</label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">الأولوية</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">ملاحظة إضافية</label>
                <input
                  type="text"
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="ملاحظة حول المهمة"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5C8A6B] hover:bg-[#4C7459] text-white text-xs font-bold"
                >
                  إضافة المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Metric */}
      {showAddMetricModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إضافة متتبع يومي جديد</h3>
              <button
                onClick={() => setShowAddMetricModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateMetric} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">اسم المتتبع</label>
                <input
                  type="text"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                  placeholder="مثلاً: ساعات عمل عميق، خطوات، شرب مية"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={metricUnit}
                    onChange={(e) => setMetricUnit(e.target.value)}
                    placeholder="ساعة، خطوة، لتر، صفحة"
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">المستهدف اليومي</label>
                  <input
                    type="number"
                    value={metricTarget}
                    onChange={(e) => setMetricTarget(e.target.value)}
                    placeholder="6"
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddMetricModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E3A24A] hover:bg-[#C98B35] text-white text-xs font-bold"
                >
                  حفظ المتتبع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
