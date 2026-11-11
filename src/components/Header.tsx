import React, { useState } from 'react';
import { Feather, Bell, Sparkles, Brain, Settings, Calendar, Flame } from 'lucide-react';
import { NotificationItem, User } from '../types.js';

interface HeaderProps {
  user: User | null;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: number) => void;
  onOpenAskModal: () => void;
  onOpenProfileModal: () => void;
  onOpenSettingsModal: () => void;
  onTriggerCheckin: () => void;
  habitStreakMax: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onSelectDate,
  notifications,
  onMarkNotificationRead,
  onOpenAskModal,
  onOpenProfileModal,
  onOpenSettingsModal,
  onTriggerCheckin,
  habitStreakMax,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const todayStr = new Date().toISOString().split('T')[0];

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayStr = d.toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-40 bg-[#F6F1E4]/95 backdrop-blur-md border-b border-[#E3DCB]/80 px-4 py-3 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5C8A6B] text-[#FFFCF5] flex items-center justify-center shadow-sm shadow-[#5C8A6B]/20">
            <Feather className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-lemonada font-bold text-xl text-[#34302A] tracking-tight">دوّنلي</h1>
              <span className="text-[11px] font-medium bg-[#5C8A6B]/15 text-[#4C7459] px-2 py-0.5 rounded-full">رفيقك الذكي</span>
            </div>
            <p className="text-xs text-[#6E665A] hidden sm:block">احكِ لي يومك… وأنا أرتّبه</p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center bg-[#FFFCF5] border border-[#E3DCB] rounded-xl p-1 shadow-xs text-xs font-medium">
          <button
            onClick={() => onSelectDate(todayStr)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              selectedDate === todayStr ? 'bg-[#5C8A6B] text-white shadow-xs font-semibold' : 'text-[#6E665A] hover:bg-[#F6F1E4]'
            }`}
          >
            النهاردة
          </button>
          <button
            onClick={() => onSelectDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              selectedDate === yesterdayStr ? 'bg-[#5C8A6B] text-white shadow-xs font-semibold' : 'text-[#6E665A] hover:bg-[#F6F1E4]'
            }`}
          >
            امبارح
          </button>
          <div className="relative flex items-center pr-1 pl-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              title="اختر تاريخًا آخر"
            />
            <div className="flex items-center gap-1 text-[#6E665A] hover:text-[#34302A] cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-[#5C8A6B]" />
              <span className="hidden md:inline text-[11px] font-mono">{selectedDate}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Streak indicator */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#E3A24A]/15 text-[#A66E1D] font-bold text-xs"
            title={`أعلى ستريك التزام: ${habitStreakMax} أيام متتالية`}
          >
            <Flame className="w-4 h-4 fill-[#E3A24A] text-[#E3A24A]" />
            <span>{habitStreakMax}d</span>
          </div>

          {/* Ask Dawenli Trigger */}
          <button
            onClick={onOpenAskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5285A6]/15 hover:bg-[#5285A6]/25 text-[#376380] text-xs font-semibold transition-colors"
            title="اسأل دوّنلي عن أي شيء في بياناتك"
          >
            <Sparkles className="w-4 h-4 text-[#5285A6]" />
            <span className="hidden md:inline">اسأل دوّنلي</span>
          </button>

          {/* Proactive Checkin Trigger */}
          <button
            onClick={onTriggerCheckin}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5C8A6B]/15 hover:bg-[#5C8A6B]/25 text-[#4C7459] text-xs font-semibold transition-colors"
            title="تأمل مسائي وتحقق من النواقص"
          >
            <span>تأمل مسائي</span>
          </button>

          {/* Permanent Memory */}
          <button
            onClick={onOpenProfileModal}
            className="p-2 rounded-xl text-[#6E665A] hover:bg-[#FFFCF5] hover:text-[#34302A] border border-transparent hover:border-[#E3DCB] transition-colors"
            title="ذاكرة دوّنلي الدائمة عنك"
          >
            <Brain className="w-4 h-4 text-[#7C6BC9]" />
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-xl text-[#6E665A] hover:bg-[#FFFCF5] hover:text-[#34302A] border border-transparent hover:border-[#E3DCB] transition-colors relative"
              title="التنبيهات والرسائل"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#E0705C] rounded-full ring-2 ring-[#F6F1E4]" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute left-0 mt-2 w-80 bg-[#FFFCF5] border border-[#E3DCB] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-2 mb-2">
                  <span className="font-bold text-xs text-[#34302A]">التنبيهات ({unreadCount})</span>
                  <button
                    onClick={() => setShowNotifMenu(false)}
                    className="text-[11px] text-[#6E665A] hover:text-[#34302A]"
                  >
                    إغلاق
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-center py-4 text-[#9E9689]">لا توجد تنبيهات جديدة</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          n.is_read ? 'bg-[#F6F1E4]/50 border-transparent text-[#6E665A]' : 'bg-[#5C8A6B]/10 border-[#5C8A6B]/20 text-[#34302A]'
                        }`}
                      >
                        <div className="font-semibold mb-1 flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-[#9E9689]">
                            {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-xl text-[#6E665A] hover:bg-[#FFFCF5] hover:text-[#34302A] border border-transparent hover:border-[#E3DCB] transition-colors"
            title="الإعدادات واستهلاك الذكاء"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
