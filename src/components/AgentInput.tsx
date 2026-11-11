import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Upload, Sparkles, Loader2, Volume2, StopCircle } from 'lucide-react';

interface AgentInputProps {
  onSendText: (text: string) => Promise<void>;
  onSendAudio: (blob: Blob) => Promise<void>;
  isLoading: boolean;
  selectedDate: string;
}

export const AgentInput: React.FC<AgentInputProps> = ({
  onSendText,
  onSendAudio,
  isLoading,
  selectedDate,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await onSendAudio(audioBlob);
        }
        setIsRecording(false);
        clearInterval(timerIntervalRef.current);
        setRecordingSeconds(0);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      // Fallback: prompt user to write or use file upload
      alert('تعذر فتح الميكروفون. يمكنك رفع تسجيل صوتي أو الكتابة مباشرة.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    }
    clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onSendText(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onSendAudio(file);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const quickSamples = [
    'صرفت 120 جنيه غدا مع أصحابي واتمشيت نص ساعة وحاسس بصداع خفيف',
    'كسبت 3500 جنيه من مشروع حر وشربت 2 لتر مية النهاردة',
    'عندي ميتنج مع العميل بكرة الساعة 4م واشتريت كتب بـ 280 جنيه',
  ];

  return (
    <div className="w-full bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl p-4 sm:p-5 shadow-sm shadow-[#34302A]/5 relative transition-all">
      {/* Decorative notebook paper binding holes at top */}
      <div className="flex items-center justify-center gap-3 mb-3 opacity-30 select-none pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#34302A]/40 inline-block" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#34302A]/40 inline-block" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#34302A]/40 inline-block" />
      </div>

      {isRecording ? (
        /* Active Recording State */
        <div className="py-4 px-3 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#E0705C]/10 border border-[#E0705C]/30 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0705C] opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E0705C]" />
            </span>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E0705C] text-sm">دوّنلي يستمع إليك…</span>
                <span className="font-mono text-xs font-bold text-[#34302A] bg-[#FFFCF5] px-2 py-0.5 rounded-md border border-[#E0705C]/30">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>
              <p className="text-xs text-[#6E665A] mt-0.5">احكِ بحريتك عن كل ما حدث أو تنوي فعله</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl border border-[#E3DCB] text-xs font-semibold text-[#6E665A] hover:bg-[#F6F1E4] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5C8A6B] hover:bg-[#4C7459] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>إنهاء وإرسال</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard Writing & Recording Area */
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="احكِ لي عن يومك، مصاريفك، صحتك، أو مهامك... (أو اضغط زر الميكروفون للتحدث بصوتك)"
              className="w-full bg-[#F6F1E4]/50 hover:bg-[#F6F1E4]/70 focus:bg-[#FFFCF5] border border-[#E3DCB] focus:border-[#5C8A6B] rounded-2xl px-4 py-3 text-sm text-[#34302A] placeholder-[#9E9689] focus:outline-none focus:ring-2 focus:ring-[#5C8A6B]/20 transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Left side actions (Mic, upload) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startRecording}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5C8A6B]/15 hover:bg-[#5C8A6B]/25 text-[#4C7459] text-xs font-bold transition-all group"
                title="تسجيل صوتي وتفريغه آلياً"
              >
                <Mic className="w-4 h-4 text-[#5C8A6B] group-hover:scale-110 transition-transform" />
                <span>تسجيل بالصوت</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 rounded-xl text-[#6E665A] hover:bg-[#F6F1E4] hover:text-[#34302A] transition-colors border border-transparent hover:border-[#E3DCB]"
                title="رفع ملف تسجيل صوتي (webm/mp3/m4a/wav)"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Right side send button */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  inputText.trim() && !isLoading
                    ? 'bg-[#5C8A6B] hover:bg-[#4C7459] text-white shadow-[#5C8A6B]/20'
                    : 'bg-[#ECE6D8] text-[#9E9689] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>يتم الترتيب…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 rotate-180" />
                    <span>دوّن لي</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick inspiration suggestion chips */}
          <div className="pt-2 border-t border-[#ECE6D8]/60 flex items-center gap-2 overflow-x-auto text-[11px] text-[#6E665A] no-scrollbar">
            <span className="shrink-0 font-medium text-[#9E9689] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E3A24A]" />
              أمثلة سريعة:
            </span>
            {quickSamples.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(sample)}
                className="shrink-0 bg-[#F6F1E4] hover:bg-[#ECE6D8] text-[#6E665A] hover:text-[#34302A] px-2.5 py-1 rounded-lg border border-[#E3DCB]/70 transition-colors truncate max-w-[260px]"
                title={sample}
              >
                {sample}
              </button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
};
