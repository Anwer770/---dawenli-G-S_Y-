import React, { useState, useEffect } from 'react';
import { Settings, Cpu, DollarSign, Database, CheckCircle2, X, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [usageData, setUsageData] = useState<{ logs: any[]; totals: { totalTokens: number; totalCost: number } }>({
    logs: [],
    totals: { totalTokens: 0, totalCost: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsage = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ai/usage');
      const data = await res.json();
      setUsageData(data);
    } catch (e) {
      console.error('Failed to fetch AI usage', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#ECE6D8] flex items-center justify-between gap-3 bg-[#F6F1E4]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5C8A6B]/15 text-[#5C8A6B] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">إعدادات النظام والذكاء الاصطناعي</h3>
              <span className="text-[11px] text-[#6E665A]">شفافية الاستهلاك والتوكنات والخدمات المدمجة</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#9E9689] hover:text-[#34302A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Models Card */}
          <div className="p-4 rounded-2xl bg-[#F6F1E4]/60 border border-[#E3DCB] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#34302A] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#5C8A6B]" />
                <span>مزود الذكاء الاصطناعي النشط:</span>
              </span>
              <span className="text-[10px] font-bold bg-[#5C8A6B]/15 text-[#4C7459] px-2.5 py-0.5 rounded-full">
                متصل وجاهز ✅
              </span>
            </div>
            <div className="text-xs text-[#6E665A] space-y-1">
              <div>• العقل والأدوات (Agent): <strong className="text-[#34302A]">gemini-3.8-flash</strong> (17 أداة)</div>
              <div>• تفريغ الصوت (Transcription): <strong className="text-[#34302A]">gemini-3.5-transcribe</strong></div>
              <div>• التحدث بالصوت (TTS): <strong className="text-[#34302A]">gemini-3.8-flash-lite-tts</strong></div>
            </div>
          </div>

          {/* Database Architecture */}
          <div className="p-4 rounded-2xl bg-[#F6F1E4]/60 border border-[#E3DCB] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#34302A] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#5285A6]" />
                <span>قاعدة البيانات والتخزين المحلي:</span>
              </span>
              <span className="text-[10px] font-mono text-[#5285A6]">SQLite WAL (28 جداول)</span>
            </div>
            <p className="text-xs text-[#6E665A] leading-relaxed">
              جميع التدوينات والمصاريف والصحة والعادات والأهداف محفوظة بأمان محلياً في قاعدة بيانات SQLite سريعة ومهيأة للعمل حتى مع انقطاع الإنترنت.
            </p>
          </div>

          {/* AI Token & Cost Transparency */}
          <div className="p-4 rounded-2xl bg-[#FFFCF5] border border-[#E3DCB] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#34302A] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#6FA84A]" />
                <span>استهلاك التوكنات والتكلفة التقديرية</span>
              </span>
              <button
                onClick={fetchUsage}
                disabled={isLoading}
                className="p-1 rounded-lg text-[#6E665A] hover:text-[#34302A]"
                title="تحديث"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#F6F1E4] border border-[#E3DCB]">
                <span className="text-[#9E9689] block mb-0.5">إجمالي التوكنات:</span>
                <span className="font-mono font-bold text-sm text-[#34302A]">
                  {(usageData.totals.totalTokens || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F1E4] border border-[#E3DCB]">
                <span className="text-[#9E9689] block mb-0.5">التكلفة التقديرية:</span>
                <span className="font-mono font-bold text-sm text-[#4C7459]">
                  ${(usageData.totals.totalCost || 0).toFixed(4)}
                </span>
              </div>
            </div>

            {usageData.logs && usageData.logs.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#ECE6D8]">
                <span className="text-[11px] font-semibold text-[#6E665A] block">آخر العمليات:</span>
                <div className="max-h-36 overflow-y-auto space-y-1 text-[10px] font-mono pr-1">
                  {usageData.logs.slice(0, 10).map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-1.5 bg-[#F6F1E4] rounded-lg">
                      <span className="text-[#34302A]">{l.operation} ({l.model})</span>
                      <span className="text-[#6E665A]">{l.total_tokens} tokens</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
