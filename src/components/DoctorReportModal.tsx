import React, { useState, useEffect } from 'react';
import { FileText, Printer, X, Loader2, AlertCircle, Heart } from 'lucide-react';

interface DoctorReportModalProps {
  conditionId: number;
  onClose: () => void;
}

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({ conditionId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/conditions/${conditionId}/report`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load doctor report', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [conditionId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#ECE6D8] flex items-center justify-between gap-3 bg-[#F6F1E4]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E0705C]/15 text-[#E0705C] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">تقرير متابعة الحالة للطبيب المعالج 🩺</h3>
              <span className="text-[11px] text-[#6E665A]">ملخص موثق بالأعراض والوجبات لتسهيل التشخيص الطبي</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5C8A6B] text-white text-xs font-bold hover:bg-[#4C7459] shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / PDF</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-[#9E9689] hover:text-[#34302A]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 print:p-0">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#6E665A]">
              <Loader2 className="w-6 h-6 animate-spin text-[#E0705C]" />
              <span>جاري استخراج السجل الطبي والوجبات…</span>
            </div>
          ) : !data || data.error ? (
            <p className="text-xs text-center py-8 text-[#E0705C]">تعذر جلب التقرير</p>
          ) : (
            <div className="space-y-5 text-right font-tajawal">
              {/* Medical Header */}
              <div className="border-b-2 border-[#34302A] pb-3 flex items-center justify-between">
                <div>
                  <h1 className="text-base font-bold text-[#34302A]">سجل المتابعة اليومية للأعراض</h1>
                  <span className="text-xs text-[#6E665A]">تطبيق دوّنلي (Dawenli Personal Companion)</span>
                </div>
                <div className="text-xs text-[#6E665A] font-mono">
                  تاريخ استخراج التقرير: {data.generatedDate}
                </div>
              </div>

              {/* Case details */}
              <div className="p-3.5 rounded-2xl bg-[#F6F1E4] border border-[#E3DCB] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#34302A]">الشكوى / الحالة:</span>
                  <span className="text-xs font-bold text-[#E0705C]">{data.condition.title}</span>
                </div>
                <div className="text-xs text-[#6E665A]">
                  <span className="font-medium text-[#34302A]">تاريخ بداية التوثيق:</span> {data.condition.start_date}
                </div>
                {data.condition.description && (
                  <p className="text-xs text-[#6E665A] mt-1">{data.condition.description}</p>
                )}
              </div>

              {/* Logged Symptoms Timeline */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#34302A] border-b border-[#ECE6D8] pb-1">
                  سجل الأعراض والملاحظات المسجلة ({data.healthLogs?.length || 0}):
                </h4>
                {data.healthLogs?.length === 0 ? (
                  <p className="text-xs text-[#9E9689]">لا توجد أعراض مسجلة في فترة هذه الحالة.</p>
                ) : (
                  <div className="divide-y divide-[#ECE6D8] border border-[#E3DCB] rounded-xl overflow-hidden">
                    {data.healthLogs.map((log: any, i: number) => (
                      <div key={i} className="p-2.5 text-xs flex items-start justify-between bg-white">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-[#E0705C]">{log.category}</span>
                            <span className="text-[#6E665A]">[{log.body_region}]</span>
                            <span className="text-[11px] text-[#9E9689]">({log.severity})</span>
                          </div>
                          <p className="text-[#34302A]">{log.details}</p>
                        </div>
                        <span className="text-[11px] font-mono text-[#9E9689]">{log.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meals logged in this period */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#34302A] border-b border-[#ECE6D8] pb-1">
                  سجل التغذية والوجبات المتزامنة:
                </h4>
                {data.mealsLogs?.length === 0 ? (
                  <p className="text-xs text-[#9E9689]">لا توجد وجبات مسجلة في هذه الفترة.</p>
                ) : (
                  <div className="divide-y divide-[#ECE6D8] border border-[#E3DCB] rounded-xl overflow-hidden">
                    {data.mealsLogs.slice(0, 10).map((m: any, i: number) => (
                      <div key={i} className="p-2 text-xs flex items-center justify-between bg-white">
                        <span className="font-medium text-[#34302A]">
                          <span className="font-bold text-[#5C8A6B] ml-1">[{m.meal_type}]</span>
                          {m.description}
                        </span>
                        <span className="text-[11px] font-mono text-[#9E9689]">{m.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctor's Notes Section (print line placeholder) */}
              <div className="pt-4 border-t border-[#ECE6D8] space-y-2">
                <span className="font-bold text-xs text-[#34302A]">ملاحظات وتوصيات الطبيب المعالج:</span>
                <div className="h-20 border border-dashed border-[#B8B0A0] rounded-xl p-2 text-xs text-[#9E9689]">
                  مكان مخصص لكتابة التشخيص الطبي أو الخطة العلاجية...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
