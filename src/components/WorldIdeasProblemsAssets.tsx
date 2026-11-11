import React, { useState } from 'react';
import { Lightbulb, AlertOctagon, Coins, Plus, Trash2, ArrowRight, CheckCircle2, DollarSign } from 'lucide-react';
import { Idea, Problem, AssetItem } from '../types.js';

interface WorldIdeasProblemsAssetsProps {
  ideas: Idea[];
  problems: Problem[];
  assets: AssetItem[];
  totalNetWorthEGP: number;
  goldPrices: Record<string, number>;
  onAddIdea: (idea: { title: string; description?: string; tags?: string[] }) => Promise<void>;
  onConvertIdeaToTask: (id: number) => Promise<void>;
  onDeleteIdea: (id: number) => Promise<void>;
  onAddProblem: (problem: { title: string; domain: string; severity: string }) => Promise<void>;
  onResolveProblem: (id: number, resolution: string) => Promise<void>;
  onDeleteProblem: (id: number) => Promise<void>;
  onAddAsset: (asset: { type: 'gold' | 'cash'; sub_type: string; amount: number; unit: string; buy_price?: number; notes?: string }) => Promise<void>;
  onDeleteAsset: (id: number) => Promise<void>;
}

export const WorldIdeasProblemsAssets: React.FC<WorldIdeasProblemsAssetsProps> = ({
  ideas,
  problems,
  assets,
  totalNetWorthEGP,
  goldPrices,
  onAddIdea,
  onConvertIdeaToTask,
  onDeleteIdea,
  onAddProblem,
  onResolveProblem,
  onDeleteProblem,
  onAddAsset,
  onDeleteAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'ideas' | 'problems' | 'assets'>('ideas');
  const [showAddIdeaModal, setShowAddIdeaModal] = useState(false);
  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [resolvingProblem, setResolvingProblem] = useState<Problem | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Idea Form State
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaTags, setIdeaTags] = useState('');

  // Problem Form State
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDomain, setProblemDomain] = useState('شغل');
  const [problemSeverity, setProblemSeverity] = useState('متوسط');

  // Asset Form State
  const [assetType, setAssetType] = useState<'gold' | 'cash'>('gold');
  const [assetSubType, setAssetSubType] = useState('21k');
  const [assetAmount, setAssetAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [assetNotes, setAssetNotes] = useState('');

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;
    const tags = ideaTags.split(/[،,]/).map((t) => t.trim()).filter(Boolean);
    await onAddIdea({
      title: ideaTitle.trim(),
      description: ideaDesc.trim() || undefined,
      tags,
    });
    setIdeaTitle('');
    setIdeaDesc('');
    setIdeaTags('');
    setShowAddIdeaModal(false);
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemTitle.trim()) return;
    await onAddProblem({
      title: problemTitle.trim(),
      domain: problemDomain,
      severity: problemSeverity,
    });
    setProblemTitle('');
    setShowAddProblemModal(false);
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingProblem) return;
    await onResolveProblem(resolvingProblem.id, resolutionText.trim());
    setResolvingProblem(null);
    setResolutionText('');
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetAmount || isNaN(Number(assetAmount))) return;
    await onAddAsset({
      type: assetType,
      sub_type: assetSubType,
      amount: Number(assetAmount),
      unit: assetType === 'gold' ? 'gram' : 'currency',
      buy_price: buyPrice ? Number(buyPrice) : undefined,
      notes: assetNotes.trim() || undefined,
    });
    setAssetAmount('');
    setBuyPrice('');
    setAssetNotes('');
    setShowAddAssetModal(false);
  };

  const domainColors: Record<string, string> = {
    'شغل': 'bg-[#5285A6]/15 text-[#376380] border-[#5285A6]/30',
    'صحة': 'bg-[#E0705C]/15 text-[#B84E3C] border-[#E0705C]/30',
    'علاقات': 'bg-[#7C6BC9]/15 text-[#5B4AA8] border-[#7C6BC9]/30',
    'نفسي': 'bg-[#D06A8C]/15 text-[#A14361] border-[#D06A8C]/30',
    'فلوس': 'bg-[#6FA84A]/15 text-[#4A782F] border-[#6FA84A]/30',
    'أخرى': 'bg-[#ECE6D8] text-[#34302A] border-[#E3DCB]',
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ECE6D8] pb-2">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'ideas'
              ? 'bg-[#7C6BC9] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>صندوق الأفكار ({ideas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('problems')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'problems'
              ? 'bg-[#D06A8C] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>الهموم والمشاكل ({problems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'assets'
              ? 'bg-[#6FA84A] text-white shadow-xs'
              : 'text-[#6E665A] hover:bg-[#FFFCF5]'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>خزينة الأصول (ذهب وكاش) ({assets.length})</span>
        </button>
      </div>

      {/* Tab 1: Ideas Inbox */}
      {activeTab === 'ideas' && (
        <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">صندوق الأفكار (Inbox)</h3>
              <p className="text-xs text-[#6E665A]">أفكار ومشاريع للمستقبل بدون موعد محدد، مع زر للتحويل لمهمة</p>
            </div>
            <button
              onClick={() => setShowAddIdeaModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C6BC9]/15 hover:bg-[#7C6BC9]/25 text-[#5B4AA8] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة فكرة</span>
            </button>
          </div>

          {ideas.length === 0 ? (
            <p className="text-xs text-center py-8 text-[#9E9689]">لا توجد أفكار مسجلة في الصندوق</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ideas.map((idea) => {
                let tagsArr: string[] = [];
                try {
                  tagsArr = JSON.parse(idea.tags_json || '[]');
                } catch (e) {}

                return (
                  <div
                    key={idea.id}
                    className="p-4 rounded-2xl bg-[#F6F1E4]/50 border border-[#E3DCB] flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-[#34302A]">{idea.title}</h4>
                        <button
                          onClick={() => onDeleteIdea(idea.id)}
                          className="p-1 rounded-lg text-[#9E9689] hover:text-[#E0705C]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {idea.description && (
                        <p className="text-xs text-[#6E665A] leading-relaxed">{idea.description}</p>
                      )}
                      {tagsArr.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {tagsArr.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-[#FFFCF5] text-[#7C6BC9] px-2 py-0.5 rounded-md border border-[#E3DCB]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E3DCB]/50 flex items-center justify-between">
                      <span className="text-[10px] text-[#9E9689]">
                        {idea.status === 'converted' ? 'تم تحويلها لمهمة ✓' : 'في الصندوق'}
                      </span>
                      {idea.status !== 'converted' && (
                        <button
                          onClick={() => onConvertIdeaToTask(idea.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#5B4AA8] hover:text-[#453782] transition-colors"
                        >
                          <span>تحويل لمهمة</span>
                          <ArrowRight className="w-3 h-3 rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Problems & Worries */}
      {activeTab === 'problems' && (
        <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">الهموم والمشاكل ومتابعة حلها</h3>
              <p className="text-xs text-[#6E665A]">تفريغ القلق وتوثيق الحلول لتجاوز الصعوبات براحة بال</p>
            </div>
            <button
              onClick={() => setShowAddProblemModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D06A8C]/15 hover:bg-[#D06A8C]/25 text-[#A14361] text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل همّ أو مشكلة</span>
            </button>
          </div>

          {problems.length === 0 ? (
            <p className="text-xs text-center py-8 text-[#9E9689]">الحمد لله، لا توجد مشكلات مسجلة</p>
          ) : (
            <div className="space-y-3">
              {problems.map((prob) => {
                const isResolved = prob.status === 'resolved';
                return (
                  <div
                    key={prob.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isResolved
                        ? 'bg-[#5C8A6B]/5 border-[#5C8A6B]/20'
                        : 'bg-[#F6F1E4]/50 border-[#E3DCB]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${domainColors[prob.domain] || domainColors['أخرى']}`}>
                            {prob.domain}
                          </span>
                          <span className="text-[10px] text-[#9E9689]">الشدة: {prob.severity}</span>
                          {isResolved && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-[#5C8A6B] text-white px-2 py-0.5 rounded-full font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              تم الحل
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-[#34302A]">{prob.title}</h4>
                        {prob.resolution && (
                          <div className="mt-2 text-xs bg-[#5C8A6B]/10 text-[#4C7459] p-2.5 rounded-xl border border-[#5C8A6B]/20">
                            <span className="font-bold ml-1">كيف تم الحل:</span>
                            {prob.resolution}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isResolved && (
                          <button
                            onClick={() => {
                              setResolvingProblem(prob);
                              setResolutionText('');
                            }}
                            className="px-3 py-1 rounded-xl bg-[#5C8A6B] hover:bg-[#4C7459] text-white text-xs font-bold transition-colors"
                          >
                            إغلاق وتجاوز
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteProblem(prob.id)}
                          className="p-1 rounded-lg text-[#9E9689] hover:text-[#E0705C]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Assets Vault (Gold & Cash) */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          {/* Net Worth Summary Card */}
          <div className="bg-gradient-to-l from-[#6FA84A]/10 to-[#E3A24A]/10 border border-[#6FA84A]/30 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[#6E665A]">إجمالي الثروة والأصول المقدرة</span>
              <div className="font-bold text-2xl text-[#34302A] tracking-tight mt-0.5 font-mono">
                {totalNetWorthEGP.toLocaleString()} <span className="text-sm font-normal text-[#6E665A]">جنيه مصري</span>
              </div>
              <p className="text-[11px] text-[#9E9689] mt-1">
                تقدير حي لسبائك الذهب بالعيارات (24k/21k/18k) والعملات الأجنبية بسعر الصرف
              </p>
            </div>

            <button
              onClick={() => setShowAddAssetModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6FA84A] hover:bg-[#5D8E3E] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة أصل للخزينة</span>
            </button>
          </div>

          {/* Assets Grid */}
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#34302A]">تفاصيل الخزينة</h3>

            {assets.length === 0 ? (
              <p className="text-xs text-center py-8 text-[#9E9689]">لم تسجل أي أصول في الخزينة بعد</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assets.map((a) => {
                  const isGold = a.type === 'gold';
                  return (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl bg-[#F6F1E4]/50 border border-[#E3DCB] flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                              isGold
                                ? 'bg-[#E3A24A]/20 text-[#A66E1D] border-[#E3A24A]/40'
                                : 'bg-[#6FA84A]/20 text-[#4A782F] border-[#6FA84A]/40'
                            }`}
                          >
                            {isGold ? `ذهب عيار ${a.sub_type}` : `كاش ${a.sub_type}`}
                          </span>
                          <button
                            onClick={() => onDeleteAsset(a.id)}
                            className="p-1 text-[#9E9689] hover:text-[#E0705C]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="mt-2">
                          <div className="text-base font-bold text-[#34302A] font-mono">
                            {a.amount} {isGold ? 'جرام' : a.sub_type}
                          </div>
                          <div className="text-xs text-[#4A782F] font-semibold mt-0.5">
                            القيمة التقديرية: {a.estimatedValueEGP.toLocaleString()} جنيه
                          </div>
                          {a.notes && <p className="text-[11px] text-[#6E665A] mt-1">{a.notes}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Idea */}
      {showAddIdeaModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إضافة فكرة إلى الصندوق</h3>
              <button
                onClick={() => setShowAddIdeaModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">عنوان الفكرة</label>
                <input
                  type="text"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  placeholder="مثلاً: إطلاق قناة يوتيوب للبرمجة"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">تفاصيل وملاحظات</label>
                <textarea
                  rows={3}
                  value={ideaDesc}
                  onChange={(e) => setIdeaDesc(e.target.value)}
                  placeholder="شرح الفكرة والخطوات المقترحة"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl p-3 text-xs text-[#34302A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">وسوم (مفصولة بفواصل)</label>
                <input
                  type="text"
                  value={ideaTags}
                  onChange={(e) => setIdeaTags(e.target.value)}
                  placeholder="محتوى، تقنية، تعليم"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddIdeaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7C6BC9] hover:bg-[#6857B5] text-white text-xs font-bold"
                >
                  حفظ الفكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Problem */}
      {showAddProblemModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">تسجيل همّ أو مشكلة</h3>
              <button
                onClick={() => setShowAddProblemModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">وصف الهم أو المشكلة</label>
                <input
                  type="text"
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  placeholder="ما الذي يثقل تفكيرك أو يزعجك حالياً؟"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">المجال</label>
                  <select
                    value={problemDomain}
                    onChange={(e) => setProblemDomain(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="شغل">شغل وعمل</option>
                    <option value="صحة">صحة وجسد</option>
                    <option value="علاقات">علاقات وأسرة</option>
                    <option value="نفسي">نفسي ومشاعر</option>
                    <option value="فلوس">مالي والتزامات</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">الشدة</label>
                  <select
                    value={problemSeverity}
                    onChange={(e) => setProblemSeverity(e.target.value)}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="خفيف">خفيف</option>
                    <option value="متوسط">متوسط</option>
                    <option value="شديد">شديد</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddProblemModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D06A8C] hover:bg-[#B85373] text-white text-xs font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Problem */}
      {resolvingProblem && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إغلاق المشكلة وتوثيق الحل</h3>
              <button
                onClick={() => setResolvingProblem(null)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-3">
              <div>
                <span className="text-xs font-bold text-[#34302A] block mb-1">
                  «{resolvingProblem.title}»
                </span>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">
                  كيف تم الحل أو التجاوز؟ (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="مثلاً: قمت بتقسيم المهام والحديث بصراحة مع الطرف الآخر"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl p-3 text-xs text-[#34302A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setResolvingProblem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5C8A6B] hover:bg-[#4C7459] text-white text-xs font-bold"
                >
                  تأكيد الإغلاق ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Asset */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
              <h3 className="font-bold text-sm text-[#34302A]">إضافة أصل إلى الخزينة</h3>
              <button
                onClick={() => setShowAddAssetModal(false)}
                className="text-xs text-[#6E665A]"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">نوع الأصل</label>
                  <select
                    value={assetType}
                    onChange={(e) => {
                      const t = e.target.value as 'gold' | 'cash';
                      setAssetType(t);
                      setAssetSubType(t === 'gold' ? '21k' : 'EGP');
                    }}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  >
                    <option value="gold">ذهب ومجوهرات</option>
                    <option value="cash">كاش وعملات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">العيار / العملة</label>
                  {assetType === 'gold' ? (
                    <select
                      value={assetSubType}
                      onChange={(e) => setAssetSubType(e.target.value)}
                      className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                    >
                      <option value="24k">عيار 24 (سبائك نقي)</option>
                      <option value="21k">عيار 21 (الشائع)</option>
                      <option value="18k">عيار 18</option>
                      <option value="14k">عيار 14</option>
                    </select>
                  ) : (
                    <select
                      value={assetSubType}
                      onChange={(e) => setAssetSubType(e.target.value)}
                      className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                    >
                      <option value="EGP">جنيه مصري (EGP)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">
                    الكمية ({assetType === 'gold' ? 'بالجرام' : 'المبلغ'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(e.target.value)}
                    placeholder={assetType === 'gold' ? '35' : '10000'}
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E665A] mb-1">سعر الشراء (اختياري)</label>
                  <input
                    type="number"
                    step="any"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="3600"
                    className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E665A] mb-1">ملاحظة</label>
                <input
                  type="text"
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  placeholder="مثلاً: سبيكة btc في الخزنة"
                  className="w-full bg-[#F6F1E4] border border-[#E3DCB] rounded-xl px-3 py-2 text-xs text-[#34302A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6FA84A] hover:bg-[#5D8E3E] text-white text-xs font-bold"
                >
                  حفظ الأصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
