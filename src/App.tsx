import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Wallet,
  Activity,
  Target,
  CheckSquare,
  Lightbulb,
  BarChart3,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Header } from './components/Header.js';
import { AgentInput } from './components/AgentInput.js';
import { ReceiptsBanner } from './components/ReceiptsBanner.js';
import { WorldJournal } from './components/WorldJournal.js';
import { WorldFinance } from './components/WorldFinance.js';
import { WorldHealth } from './components/WorldHealth.js';
import { WorldHabitsGoals } from './components/WorldHabitsGoals.js';
import { WorldTasksMetrics } from './components/WorldTasksMetrics.js';
import { WorldIdeasProblemsAssets } from './components/WorldIdeasProblemsAssets.js';
import { AskDawenliModal } from './components/AskDawenliModal.js';
import { CheckinModal } from './components/CheckinModal.js';
import { DoctorReportModal } from './components/DoctorReportModal.js';
import { ProfileMemoryModal } from './components/ProfileMemoryModal.js';
import { ComprehensiveReportModal } from './components/ComprehensiveReportModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import {
  User,
  Entry,
  FinanceItem,
  FinanceStats,
  AssetItem,
  HealthRecord,
  Meal,
  Condition,
  Habit,
  Goal,
  Task,
  Metric,
  Idea,
  Problem,
  ProfileFact,
  NotificationItem,
} from './types.js';

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active World Tab
  const [activeTab, setActiveTab] = useState<
    'journal' | 'finance' | 'health' | 'habits_goals' | 'tasks_metrics' | 'ideas_assets'
  >('journal');

  // Core Data States
  const [user, setUser] = useState<User | null>(null);
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([]);
  const [financeStats, setFinanceStats] = useState<FinanceStats>({
    totalIncome: 0,
    totalExpenses: 0,
    net: 0,
    categoryTotals: {},
  });
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [totalNetWorthEGP, setTotalNetWorthEGP] = useState(0);
  const [goldPrices, setGoldPrices] = useState<Record<string, number>>({});
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [profileFacts, setProfileFacts] = useState<ProfileFact[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Agent Interaction States
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [agentReply, setAgentReply] = useState<string | null>(null);
  const [agentReceipts, setAgentReceipts] = useState<string[]>([]);
  const [agentTranscript, setAgentTranscript] = useState<string | null>(null);

  // Modals Visibility
  const [showAskModal, setShowAskModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState('');
  const [activeDoctorReportCondId, setActiveDoctorReportCondId] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showComprehensiveReport, setShowComprehensiveReport] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Refresh all application data
  const loadAllData = useCallback(async () => {
    try {
      // 1. Me
      const meRes = await fetch('/api/me');
      if (meRes.ok) setUser(await meRes.json());

      // 2. Entries for selected date and all
      const [entryRes, allEntriesRes] = await Promise.all([
        fetch(`/api/entries?date=${selectedDate}`),
        fetch('/api/entries'),
      ]);
      if (entryRes.ok) setCurrentEntry(await entryRes.json());
      if (allEntriesRes.ok) setAllEntries(await allEntriesRes.json());

      // 3. Finance
      const finRes = await fetch(`/api/finance?date=${selectedDate}`);
      if (finRes.ok) {
        const finData = await finRes.json();
        setFinanceItems(finData.items || []);
        setFinanceStats(finData.stats || { totalIncome: 0, totalExpenses: 0, net: 0, categoryTotals: {} });
      }

      // 4. Assets
      const assetsRes = await fetch('/api/assets');
      if (assetsRes.ok) {
        const assData = await assetsRes.json();
        setAssets(assData.assets || []);
        setTotalNetWorthEGP(assData.totalNetWorthEGP || 0);
        setGoldPrices(assData.goldPrices || {});
      }

      // 5. Health, Meals, Conditions
      const [healthRes, mealsRes, condRes] = await Promise.all([
        fetch(`/api/health?date=${selectedDate}`),
        fetch(`/api/meals?date=${selectedDate}`),
        fetch('/api/conditions'),
      ]);
      if (healthRes.ok) setHealthRecords(await healthRes.json());
      if (mealsRes.ok) setMeals(await mealsRes.json());
      if (condRes.ok) setConditions(await condRes.json());

      // 6. Habits & Goals
      const [habitsRes, goalsRes] = await Promise.all([
        fetch(`/api/habits?date=${selectedDate}`),
        fetch('/api/goals'),
      ]);
      if (habitsRes.ok) setHabits(await habitsRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());

      // 7. Tasks & Metrics
      const [tasksRes, metricsRes] = await Promise.all([
        fetch(`/api/tasks?date=${selectedDate}`),
        fetch(`/api/metrics?date=${selectedDate}`),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());

      // 8. Ideas & Problems
      const [ideasRes, probRes] = await Promise.all([
        fetch('/api/ideas'),
        fetch('/api/problems'),
      ]);
      if (ideasRes.ok) setIdeas(await ideasRes.json());
      if (probRes.ok) setProblems(await probRes.json());

      // 9. Profile Facts & Notifications
      const [profRes, notifRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/notifications'),
      ]);
      if (profRes.ok) setProfileFacts(await profRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
    } catch (err) {
      console.error('Data load error', err);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle User Input Submission to Agent (Text)
  const handleSendText = async (text: string) => {
    setIsAgentLoading(true);
    setAgentTranscript(null);
    try {
      const res = await fetch('/api/ai/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, date: selectedDate }),
      });
      const data = await res.json();
      setAgentReply(data.reply);
      setAgentReceipts(data.receipts || []);
      await loadAllData();
    } catch (err) {
      console.error('Agent text error:', err);
      setAgentReply('حدث خطأ أثناء معالجة التدوين. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Handle User Voice Input Submission to Agent (Audio Blob)
  const handleSendAudio = async (audioBlob: Blob) => {
    setIsAgentLoading(true);
    setAgentTranscript(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_record.webm');
      formData.append('date', selectedDate);

      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setAgentTranscript(data.transcript || null);
      setAgentReply(data.reply || 'تم استلام التسجيل وترتيبه بنجاح');
      setAgentReceipts(data.receipts || []);
      await loadAllData();
    } catch (err) {
      console.error('Agent voice error:', err);
      setAgentReply('حدث خطأ أثناء تفريغ ومعالجة الصوت.');
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Trigger Evening Check-in Modal
  const handleTriggerCheckin = async () => {
    try {
      const res = await fetch('/api/ai/checkin', { method: 'POST' });
      const data = await res.json();
      setCheckinMessage(data.message || 'كيف كان يومك وما الذي ينقصك لتدوينه؟');
      setShowCheckinModal(true);
      await loadAllData();
    } catch (err) {
      console.error('Checkin trigger failed', err);
    }
  };

  // Calculate highest habit streak for display
  const maxHabitStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  return (
    <div className="min-h-screen bg-[#F6F1E4] text-[#34302A] flex flex-col font-tajawal selection:bg-[#5C8A6B]/20">
      {/* 1. Header Bar */}
      <Header
        user={user}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        notifications={notifications}
        onMarkNotificationRead={async (id) => {
          await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
          loadAllData();
        }}
        onOpenAskModal={() => setShowAskModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onTriggerCheckin={handleTriggerCheckin}
        habitStreakMax={maxHabitStreak}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* 2. The Heart of Dawenli: Central Agent Voice & Text Recorder */}
        <section aria-label="صندوق التدوين والتحدث">
          <AgentInput
            onSendText={handleSendText}
            onSendAudio={handleSendAudio}
            isLoading={isAgentLoading}
            selectedDate={selectedDate}
          />
        </section>

        {/* 3. Action Receipts & Agent Voice Reply Banner */}
        {agentReply && (
          <section aria-label="رد دوّنلي وشريط الإيصالات">
            <ReceiptsBanner
              reply={agentReply}
              receipts={agentReceipts}
              transcript={agentTranscript || undefined}
              onClose={() => setAgentReply(null)}
            />
          </section>
        )}

        {/* 4. Worlds Navigation Tabs Bar */}
        <nav aria-label="العوالم الستة" className="bg-[#FFFCF5] border border-[#E3DCB] rounded-2xl p-1.5 shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                activeTab === 'journal'
                  ? 'bg-[#8C7355] text-white shadow-xs'
                  : 'text-[#6E665A] hover:bg-[#F6F1E4]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>اليوميات</span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                activeTab === 'finance'
                  ? 'bg-[#6FA84A] text-white shadow-xs'
                  : 'text-[#6E665A] hover:bg-[#F6F1E4]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>الفلوس ({financeItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                activeTab === 'health'
                  ? 'bg-[#E0705C] text-white shadow-xs'
                  : 'text-[#6E665A] hover:bg-[#F6F1E4]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>الصحة والأكل</span>
            </button>

            <button
              onClick={() => setActiveTab('habits_goals')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                activeTab === 'habits_goals'
                  ? 'bg-[#E3A24A] text-white shadow-xs'
                  : 'text-[#6E665A] hover:bg-[#F6F1E4]'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>العادات والأهداف</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks_metrics')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                activeTab === 'tasks_metrics'
                  ? 'bg-[#5C8A6B] text-white shadow-xs'
                  : 'text-[#6E665A] hover:bg-[#F6F1E4]'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>المهام والمتتبعات</span>
            </button>

            <button
              onClick={() => setActiveTab('ideas_assets')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                activeTab === 'ideas_assets'
                  ? 'bg-[#7C6BC9] text-white shadow-xs'
                  : 'text-[#6E665A] hover:bg-[#F6F1E4]'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>أفكار وهموم وخزينة</span>
            </button>

            {/* Quick Comprehensive Report Button */}
            <button
              onClick={() => setShowComprehensiveReport(true)}
              className="mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5285A6]/15 hover:bg-[#5285A6]/25 text-[#376380] text-xs font-bold shrink-0 transition-colors"
              title="توليد تقرير شامل للفترة"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تقرير شامل</span>
            </button>
          </div>
        </nav>

        {/* 5. World Views */}
        <section className="transition-all duration-200">
          {activeTab === 'journal' && (
            <WorldJournal
              currentEntry={currentEntry}
              selectedDate={selectedDate}
              allEntries={allEntries}
              onSelectDate={setSelectedDate}
              onSaveEntry={async (entryData) => {
                await fetch('/api/entries', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(entryData),
                });
                loadAllData();
              }}
              onDeleteEntry={async (id) => {
                await fetch(`/api/entries/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
            />
          )}

          {activeTab === 'finance' && (
            <WorldFinance
              financeItems={financeItems}
              stats={financeStats}
              selectedDate={selectedDate}
              onAddFinance={async (item) => {
                await fetch('/api/finance', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item),
                });
                loadAllData();
              }}
              onDeleteFinance={async (id) => {
                await fetch(`/api/finance/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
            />
          )}

          {activeTab === 'health' && (
            <WorldHealth
              healthRecords={healthRecords}
              meals={meals}
              conditions={conditions}
              selectedDate={selectedDate}
              onAddHealth={async (record) => {
                await fetch('/api/health', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(record),
                });
                loadAllData();
              }}
              onDeleteHealth={async (id) => {
                await fetch(`/api/health/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
              onAddMeal={async (meal) => {
                await fetch('/api/meals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(meal),
                });
                loadAllData();
              }}
              onDeleteMeal={async (id) => {
                await fetch(`/api/meals/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
              onOpenDoctorReport={(condId) => setActiveDoctorReportCondId(condId)}
              onAddCondition={async (cond) => {
                await fetch('/api/conditions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(cond),
                });
                loadAllData();
              }}
            />
          )}

          {activeTab === 'habits_goals' && (
            <WorldHabitsGoals
              habits={habits}
              goals={goals}
              onToggleHabit={async (id) => {
                await fetch(`/api/habits/${id}/toggle`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ date: selectedDate }),
                });
                loadAllData();
              }}
              onAddHabit={async (habit) => {
                await fetch('/api/habits', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(habit),
                });
                loadAllData();
              }}
              onDeleteHabit={async (id) => {
                await fetch(`/api/habits/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
              onAddGoal={async (goal) => {
                await fetch('/api/goals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(goal),
                });
                loadAllData();
              }}
              onUpdateGoal={async (id, current_amount, target_amount) => {
                await fetch(`/api/goals/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ current_amount, target_amount }),
                });
                loadAllData();
              }}
              onDeleteGoal={async (id) => {
                await fetch(`/api/goals/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
            />
          )}

          {activeTab === 'tasks_metrics' && (
            <WorldTasksMetrics
              tasks={tasks}
              metrics={metrics}
              selectedDate={selectedDate}
              onToggleTask={async (id) => {
                await fetch(`/api/tasks/${id}/toggle`, { method: 'PUT' });
                loadAllData();
              }}
              onAddTask={async (task) => {
                await fetch('/api/tasks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(task),
                });
                loadAllData();
              }}
              onDeleteTask={async (id) => {
                await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
              onAddMetric={async (metric) => {
                await fetch('/api/metrics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(metric),
                });
                loadAllData();
              }}
              onLogMetricValue={async (id, value) => {
                await fetch(`/api/metrics/${id}/log`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ value, date: selectedDate }),
                });
                loadAllData();
              }}
              onDeleteMetric={async (id) => {
                await fetch(`/api/metrics/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
            />
          )}

          {activeTab === 'ideas_assets' && (
            <WorldIdeasProblemsAssets
              ideas={ideas}
              problems={problems}
              assets={assets}
              totalNetWorthEGP={totalNetWorthEGP}
              goldPrices={goldPrices}
              onAddIdea={async (idea) => {
                await fetch('/api/ideas', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(idea),
                });
                loadAllData();
              }}
              onConvertIdeaToTask={async (id) => {
                await fetch(`/api/ideas/${id}/convert`, { method: 'POST' });
                loadAllData();
              }}
              onDeleteIdea={async (id) => {
                await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
              onAddProblem={async (problem) => {
                await fetch('/api/problems', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(problem),
                });
                loadAllData();
              }}
              onResolveProblem={async (id, resolution) => {
                await fetch(`/api/problems/${id}/resolve`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ resolution }),
                });
                loadAllData();
              }}
              onDeleteProblem={async (id) => {
                await fetch(`/api/problems/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
              onAddAsset={async (asset) => {
                await fetch('/api/assets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(asset),
                });
                loadAllData();
              }}
              onDeleteAsset={async (id) => {
                await fetch(`/api/assets/${id}`, { method: 'DELETE' });
                loadAllData();
              }}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3DCB] bg-[#FFFCF5] py-4 px-4 text-center text-xs text-[#6E665A]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>دوّنلي (Dawenli) — «احكِ لي يومك… وأنا أرتّبه»</span>
          <span className="text-[11px] text-[#9E9689]">
            نظام تدوين شخصي ذكي متكامل مدعوم بـ Google Gemini
          </span>
        </div>
      </footer>

      {/* Global Modals */}
      {showAskModal && <AskDawenliModal onClose={() => setShowAskModal(false)} />}

      {showCheckinModal && (
        <CheckinModal
          checkinMessage={checkinMessage}
          onClose={() => setShowCheckinModal(false)}
          onSendReply={async (replyText) => {
            await handleSendText(replyText);
          }}
        />
      )}

      {activeDoctorReportCondId !== null && (
        <DoctorReportModal
          conditionId={activeDoctorReportCondId}
          onClose={() => setActiveDoctorReportCondId(null)}
        />
      )}

      {showProfileModal && (
        <ProfileMemoryModal
          facts={profileFacts}
          onAddFact={async (fact) => {
            await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fact),
            });
            loadAllData();
          }}
          onDeleteFact={async (id) => {
            await fetch(`/api/profile/${id}`, { method: 'DELETE' });
            loadAllData();
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showComprehensiveReport && (
        <ComprehensiveReportModal onClose={() => setShowComprehensiveReport(false)} />
      )}

      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}
