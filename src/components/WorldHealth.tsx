import React, { useState } from 'react';
import { Activity, Heart, Utensils, FileText, Plus, Trash2, ShieldAlert, Sparkles } from 'lucide-react';
import { HealthRecord, Meal, Condition } from '../types.js';

interface WorldHealthProps {
  healthRecords: HealthRecord[];
  meals: Meal[];
  conditions: Condition[];
  selectedDate: string;
  onAddHealth: (record: { category: string; body_region: string; severity: string; details: string; date: string }) => Promise<void>;
  onDeleteHealth: (id: number) => Promise<void>;
  onAddMeal: (meal: { meal_type: string; description: string; calories?: number; date: string }) => Promise<void>;
  onDeleteMeal: (id: number) => Promise<void>;
  onOpenDoctorReport: (conditionId: number) => void;
  onAddCondition: (cond: { title: string; description: string; start_date: string }) => Promise<void>;
}

export const WorldHealth: React.FC<WorldHealthProps> = ({
  healthRecords,
  meals,
  conditions,
  selectedDate,
  onAddHealth,
  onDeleteHealth,
  onAddMeal,
  onDeleteMeal,
  onOpenDoctorReport,
  onAddCondition,
}) => {
  const [activeTab, setActiveTab] = useState<'health' | 'meals' | 'conditions'>('health');
  const [selectedRegion, setSelectedRegion] = useState<string>('الكل');
  const [showAddHealthModal, setShowAddHealthModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showAddConditionModal, setShowAddConditionModal] = useState(false);

  // New Health Form State
  const [category, setCategory] = useState('عرض');
  const [bodyRegion, setBodyRegion] = useState('راس');
  const [severity, setSeverity] = useState('متوسط');
  const [details, setDetails] = useState('');

  // New Meal Form State
  const [mealType, setMealType] = useState('غدا');
  const [mealDesc, setMealDesc] = useState('');
  const [calories, setCalories] = useState('');

  // New Condition Form State
  const [condTitle, setCondTitle] = useState('');
  const [condDesc, setCondDesc] = useState('');

  const bodyRegions = ['الكل', 'راس', 'صدر', 'معدة', 'بطن', 'ذراعين', 'ساقين', 'عام'];

  const filteredHealth = selectedRegion === 'الكل'
    ? healthRecords
    : healthRecords.filter((h) => h.body_region === selectedRegion);

  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;
    await onAddHealth({
      category,
      body_region: bodyRegion,
      severity,
      details: details.trim(),
      date: selectedDate,
    });
    setDetails('');
    setShowAddHealthModal(false);
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealDesc.trim()) return;
    await onAddMeal({
      meal_type: mealType,
      description: mealDesc.trim(),
      calories: calories ? Number(calories) : undefined,
      date: selectedDate,
    });
    setMealDesc('');
    setCalories('');
    setShowAddMealModal(false);
  };

  const handleConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condTitle.trim()) return;
    await onAddCondition({
      title: condTitle.trim(),
      description: condDesc.trim(),
      start_date: selectedDate,
    });
    setCondTitle('');
    setCondDesc('');
    setShowAddConditionModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs: Health & Symptoms, Meals, Follow-up Conditions */}
      <div className="flex items-center gap-2 border-b border-[#ECE6D8] pb-2">
        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'health'
              ? 'bg-[#E0705C] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>الأعراض والصحة النفسية ({healthRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('meals')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'meals'
              ? 'bg-[#E0705C] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>الوجبات والأكل ({meals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('conditions')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'conditions'
              ? 'bg-[#E0705C] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>حالات المتابعة وتقرير الطبيب ({conditions.length})</span>
        </button>
      </div>

      {/* Tab 1: Health & Symptoms */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          {/* Body Region Filter Chips */}
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-2xl p-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#9E9689] font-medium ml-2">منطقة الجسم:</span>
            {bodyRegions.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedRegion === region
                    ? 'bg-[#E0705C] text-white border-[#E0705C]'
                    : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB] hover:bg-[#ECE6D8]'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Health Records List */}
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#34302A]">سجل الصحة والنفسية والتمارين</h3>
                <p className="text-xs text-[#6E665A]">أعراض، أدوية، جودة نوم، تمارين، ونفسية</p>
              </div>
              <button
                onClick={() => setShowAddHealthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0705C]/15 hover:bg-[#E0705C]/25 text-[#B84E3C] text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة ملاحظة صحية</span>
              </button>
            </div>

            {filteredHealth.length === 0 ? (
              <p className="text-xs text-center py-8 text-[#9E9689]">لا توجد تسجيلات صحية في هذا التصنيف</p>
            ) : (
              <div className="divide-y divide-[#ECE6D8]">
                {filteredHealth.map((rec) => (
                  <div key={rec.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#E0705C] bg-[#E0705C]/10 px-2 py-0.5 rounded-lg border border-[#E0705C]/20">
                          {rec.category}
                        </span>
                        <span className="text-xs text-[#6E665A] bg-[#F6F1E4] px-2 py-0.5 rounded-lg border border-[#E3DCB]">
                          المنطقة: {rec.body_region}
                        </span>
                        {rec.severity && (
                          <span className="text-[11px] text-[#9E9689]">({rec.severity})</span>
                        )}
                        <span className="text-[10px] text-[#9E9689]">{rec.date}</span>
                      </div>
                      <p className="text-xs text-[#34302A] leading-relaxed pr-1">{rec.details}</p>
                    </div>

                    <button
                      onClick={() => onDeleteHealth(rec.id)}
                      className="p-1.5 rounded-lg text-[#9E9689] hover:text-[#E0705C] hover:bg-[#F6F1E4] transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Meals Timeline */}
      {activeTab === 'meals' && (
        <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">سجل الوجبات والمشروبات</h3>
              <p className="text-xs text-[#6E665A]">فطار، غدا، عشا، وسناكات مسجلة تلقائياً من سردك</p>
            </div>
            <button
              onClick={() => setShowAddMealModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0705C]/15 hover:bg-[#E0705C]/25 text-[#B84E3C] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة وجبة</span>
            </button>
          </div>

          {meals.length === 0 ? (
            <p className="text-xs text-center py-8 text-[#9E9689]">لم تسجل أي وجبات حتى الآن</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meals.map((m) => (
                <div key={m.id} className="p-3.5 rounded-2xl bg-[#F6F1E4]/50 border border-[#E3DCB] flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#E0705C] bg-[#FFFCF5] px-2.5 py-0.5 rounded-lg border border-[#E0705C]/30">
                        {m.meal_type}
                      </span>
                      <span className="text-[10px] text-[#9E9689]">{m.date}</span>
                      {m.calories && (
                        <span className="text-[10px] text-[#6E665A] font-mono">({m.calories} كالوري)</span>
                      )}
                    </div>
                    <p className="text-xs text-[#34302A] leading-relaxed">{m.description}</p>
                  </div>
                  <button
                    onClick={() => onDeleteMeal(m.id)}
                    className="p-1 rounded-lg text-[#9E9689] hover:text-[#E0705C] hover:bg-[#F6F1E4]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Conditions & Doctor Reports */}
      {activeTab === 'conditions' && (
        <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">حالات المتابعة الصحية (30 يوم)</h3>
              <p className="text-xs text-[#6E665A]">تجميع آلي للأعراض والأكل لتوليد تقرير طبي موثق للطبيب</p>
            </div>
            <button
              onClick={() => setShowAddConditionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0705C]/15 hover:bg-[#E0705C]/25 text-[#B84E3C] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>متابعة حالة جديدة</span>
            </button>
          </div>

          {conditions.length === 0 ? (
            <div className="text-center py-8 text-[#9E9689] space-y-2">
              <Heart className="w-8 h-8 mx-auto text-[#E0705C]/50" />
              <p className="text-xs">لا توجد حالات متابعة صحية نشطة حالياً (مثل: ارتجاع مريء، حساسية، قولون)</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conditions.map((cond) => (
                <div key={cond.id} className="p-4 rounded-2xl bg-[#F6F1E4]/50 border border-[#E3DCB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-[#34302A]">{cond.title}</span>
                      <span className="text-[10px] bg-[#E0705C]/15 text-[#B84E3C] px-2 py-0.5 rounded-full font-medium">
                        بدأت: {cond.start_date}
                      </span>
                    </div>
                    {cond.description && <p className="text-xs text-[#6E665A]">{cond.description}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDoctorReport(cond.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5C8A6B] hover:bg-[#4C7459] text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>توليد تقرير الطبيب 🩺</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medical disclaimer */}
          <div className="p-3 rounded-2xl bg-[#E0705C]/10 border border-[#E0705C]/20 text-[11px] text-[#B84E3C] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#E0705C]" />
            <span>
              تنبيه مهم: دوّنلي رفيق توثيقي يجمع الأعراض والوجبات لمساعدتك أنت وطبيبك، ولا يقدم أي تشخيص أو نصائح طبية بديلة عن الطبيب.
            </span>
          </div>
        </div>
      )}

      {/* Modal: Add Health Record */}
      {showAddHealthModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إضافة ملاحظة صحية / نفسية</h3>
              <button
                onClick={() => setShowAddHealthModal(false)}
                className="text-xs text-[#6E665A] hover:text-[#34302A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleHealthSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">الفئة</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="عرض">عرض صحي</option>
                    <option value="دواء">دواء</option>
                    <option value="نوم">نوم</option>
                    <option value="تمرين">تمرين ورياضة</option>
                    <option value="نفسية">حالة نفسية ومزاج</option>
                    <option value="ملاحظة">ملاحظة عامة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">منطقة الجسم</label>
                  <select
                    value={bodyRegion}
                    onChange={(e) => setBodyRegion(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="راس">راس</option>
                    <option value="صدر">صدر</option>
                    <option value="معدة">معدة</option>
                    <option value="بطن">بطن</option>
                    <option value="ذراعين">ذراعين</option>
                    <option value="ساقين">ساقين</option>
                    <option value="عام">عام</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">الشدة</label>
                <div className="grid grid-cols-3 gap-2">
                  {['خفيف', 'متوسط', 'شديد'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`py-1.5 rounded-xl text-xs font-medium border ${
                        severity === s
                          ? 'bg-[#E0705C] text-white border-[#E0705C]'
                          : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">التفاصيل</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="مثلاً: صداع إجهاد في مقدمة الرأس بعد العمل على الشاشة، تحسن مع شرب الماء"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl p-3 text-xs text-[#34302A] leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddHealthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E0705C] hover:bg-[#C95C48] text-white text-xs font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Meal */}
      {showAddMealModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">تسجيل وجبة جديدة</h3>
              <button
                onClick={() => setShowAddMealModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleMealSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">نوع الوجبة</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="فطار">فطار</option>
                    <option value="غدا">غدا</option>
                    <option value="عشا">عشا</option>
                    <option value="سناك">سناك خفيف</option>
                    <option value="مشروب">مشروب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">سعرات حرارية (اختياري)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="450"
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">محتويات الوجبة</label>
                <textarea
                  rows={3}
                  value={mealDesc}
                  onChange={(e) => setMealDesc(e.target.value)}
                  placeholder="مثلاً: صدور دجاج مشوية مع طبق أرز بني وسلطة خضراء بليمون وزيت زيتون"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl p-3 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddMealModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E0705C] hover:bg-[#C95C48] text-white text-xs font-bold"
                >
                  حفظ الوجبة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Condition */}
      {showAddConditionModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">بدء متابعة حالة صحية</h3>
              <button
                onClick={() => setShowAddConditionModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleConditionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">اسم الحالة أو الشكوى</label>
                <input
                  type="text"
                  value={condTitle}
                  onChange={(e) => setCondTitle(e.target.value)}
                  placeholder="مثلاً: ارتجاع مريء، حساسية طعام، صداع نصفي"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">وصف مبدئي</label>
                <textarea
                  rows={3}
                  value={condDesc}
                  onChange={(e) => setCondDesc(e.target.value)}
                  placeholder="ما هي الأعراض المتكررة وتوقيتها؟"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl p-3 text-xs text-[#34302A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddConditionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E0705C] hover:bg-[#C95C48] text-white text-xs font-bold"
                >
                  بدء المتابعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
