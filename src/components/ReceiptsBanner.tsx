import React, { useState } from 'react';
import { CheckCircle2, Volume2, VolumeX, X, Sparkles, MessageCircle } from 'lucide-react';

interface ReceiptsBannerProps {
  reply: string;
  receipts: string[];
  transcript?: string;
  onClose: () => void;
}

export const ReceiptsBanner: React.FC<ReceiptsBannerProps> = ({
  reply,
  receipts,
  transcript,
  onClose,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const handlePlayVoice = async () => {
    if (isPlayingAudio) return;
    try {
      setIsPlayingAudio(true);
      setAudioError(false);
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply }),
      });
      if (!res.ok) throw new Error('فشل جلب الصوت');
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setAudioError(true);
      };
      await audio.play();
    } catch (e) {
      console.error('Audio playback failed', e);
      setIsPlayingAudio(false);
      setAudioError(true);
    }
  };

  return (
    <div className="w-full bg-[#FFFCF5] border-2 border-[#5C8A6B]/30 rounded-3xl p-4 sm:p-5 shadow-md shadow-[#5C8A6B]/10 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#5C8A6B]/15 text-[#5C8A6B] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#34302A]">رد رفيقك دوّنلي</h3>
            <span className="text-[11px] text-[#6E665A]">تم فك الكلام وترتيبه في حسابك</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* TTS Button */}
          <button
            onClick={handlePlayVoice}
            disabled={isPlayingAudio}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isPlayingAudio
                ? 'bg-[#5C8A6B] text-white border-[#5C8A6B] animate-pulse'
                : 'bg-[#F6F1E4] hover:bg-[#ECE6D8] text-[#4C7459] border-[#E3DCB]'
            }`}
            title="الاستماع للرد بصوت بشري دافئ"
          >
            {isPlayingAudio ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>جاري الحديث…</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>استمع للرد</span>
              </>
            )}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9E9689] hover:text-[#34302A] hover:bg-[#F6F1E4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transcript if voice was uploaded */}
      {transcript && (
        <div className="mb-3 p-2.5 rounded-xl bg-[#F6F1E4]/70 border border-[#E3DCB] text-xs text-[#6E665A]">
          <span className="font-bold text-[#34302A] ml-1">تفريغ الصوت:</span>
          «{transcript}»
        </div>
      )}

      {/* The warm human reply from Dawenli */}
      <div className="p-3.5 rounded-2xl bg-[#5C8A6B]/10 border border-[#5C8A6B]/20 text-[#34302A] text-sm leading-relaxed mb-4">
        {reply}
      </div>

      {/* Action Receipts */}
      {receipts && receipts.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-[#4C7459]">
            <CheckCircle2 className="w-4 h-4 text-[#5C8A6B]" />
            <span>شريط الإيصالات — ما تم حفظه وتأكيده تلقائيًا:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {receipts.map((receipt, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-[#FFFCF5] border border-[#5C8A6B]/30 text-[#34302A] shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#5C8A6B]" />
                {receipt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
