import React, { useState } from 'react';
import { Sparkles, Moon, Send, X, Loader2 } from 'lucide-react';

interface CheckinModalProps {
  onClose: () => void;
  onSendReply: (replyText: string) => Promise<void>;
  checkinMessage: string;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  onClose,
  onSendReply,
  checkinMessage,
}) => {
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || isSending) return;
    setIsSending(true);
    await onSendReply(reply.trim());
    setIsSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE6D8] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5C8A6B]/15 text-[#5C8A6B] flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#34302A]">التأمل والـ Check-in اليومي</h3>
              <span className="text-[11px] text-[#6E665A]">مبادرة مسائية تراجع ما ينقص يومك</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#9E9689] hover:text-[#34302A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Checkin Prompt Message */}
        <div className="p-4 rounded-2xl bg-[#5C8A6B]/10 border border-[#5C8A6B]/20 text-[#34302A] text-xs sm:text-sm leading-relaxed">
          {checkinMessage}
        </div>

        {/* Direct Quick Reply Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E665A] mb-1">
              رد على رفيقك مباشرة (وسيقوم بتسجيل وتحديث نواقصك فوراً):
            </label>
            <textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="مثلاً: مشيت نص ساعة وصرفت 80 جنيه عشا خفيف مع زميلي..."
              className="w-full bg-[#F6F1E4] border border-[#E3DCB] focus:border-[#5C8A6B] rounded-xl p-3 text-xs text-[#34302A] leading-relaxed focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#ECE6D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6E665A] hover:bg-[#F6F1E4]"
            >
              لاحقاً
            </button>
            <button
              type="submit"
              disabled={isSending || !reply.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5C8A6B] hover:bg-[#4C7459] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري التسجيل…</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  <span>إرسال الرد</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
