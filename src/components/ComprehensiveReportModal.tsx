import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, FileText, Loader2, Printer, X } from 'lucide-react';

interface ComprehensiveReportModalProps {
  onClose: () => void;
}

export const ComprehensiveReportModal: React.FC<ComprehensiveReportModalProps> = ({ onClose }) => {
  const [days, setDays] = useState<number>(7);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReport = async (periodDays: number) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: periodDays }),
      });
      const data = await res.json();
      setReportMarkdown(data.report || 'تعذر جلب التقرير');
    } catch (e) {
      console.error('Report fetch failed', e);
      setReportMarkdown('حدث خطأ أثناء إعداد التقرير.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(days);
  }, [days]);

  return (
    <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#ECE6D8] flex items-center justify-between gap-3 bg-[#F6F1E4]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5C8A6B]/15 text-[#5C8A6B] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">التقرير التحليلي الشامل</h3>
              <span className="text-[11px] text-[#6E665A]">تحليل عميق يربط النفسية والفلوس والصحة والعادات والأهداف</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5C8A6B] text-white text-xs font-bold hover:bg-[#4C7459]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-[#9E9689] hover:text-[#34302A]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="px-4 py-2 border-b border-[#ECE6D8] flex items-center gap-2 text-xs">
          <span className="text-[#9E9689] font-medium ml-1">الفترة الزمنية:</span>
          {[
            { d: 7, label: 'آخر 7 أيام' },
            { d: 14, label: 'آخر أسبوعين (14 يوم)' },
            { d: 30, label: 'آخر شهر (30 يوم)' },
          ].map((item) => (
            <button
              key={item.d}
              onClick={() => setDays(item.d)}
              className={`px-3 py-1 rounded-xl font-semibold border transition-colors ${
                days === item.d
                  ? 'bg-[#5C8A6B] text-white border-[#5C8A6B]'
                  : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB] hover:bg-[#ECE6D8]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs text-[#6E665A]">
              <Loader2 className="w-7 h-7 animate-spin text-[#5C8A6B]" />
              <span>دوّنلي يقوم بتحليل جميع بياناتك وتوليد التقرير الشامل…</span>
            </div>
          ) : (
            <div className="bg-[#F6F1E4]/50 border border-[#E3DCB] rounded-2xl p-5 text-sm text-[#34302A] leading-relaxed whitespace-pre-line font-tajawal">
              {reportMarkdown}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
