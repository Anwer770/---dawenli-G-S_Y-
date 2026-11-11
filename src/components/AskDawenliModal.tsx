import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Volume2, Phone, PhoneOff, X, Loader2, User, Bot } from 'lucide-react';

interface AskDawenliModalProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AskDawenliModal: React.FC<AskDawenliModalProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'أهلاً بك 🌿 أنا دوّنلي. يمكنك سؤالي عن أي شيء سجلته: كم صرفت هذا الشهر، متى آخر مرة شعرت بصداع، أو ما هي عاداتك الأكثر التزاماً!',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'finance' | 'health' | 'habits_goals'>('all');
  const [isVoiceCallMode, setIsVoiceCallMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || isLoading) return;

    setInputQuery('');
    const newMessages: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          scope,
          isVoiceCall: isVoiceCallMode,
        }),
      });

      const data = await res.json();
      const reply = data.answer || 'لم أتمكن من استخراج الإجابة.';

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      // In voice call mode, automatically speak the reply
      if (isVoiceCallMode) {
        speakResponse(reply);
      }
    } catch (e) {
      console.error('Ask Dawenli error', e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
      }
    } catch (err) {
      console.error('TTS play failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#34302A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFCF5] border border-[#E3DCB] rounded-3xl w-full max-w-2xl h-[85vh] max-h-[700px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#ECE6D8] flex items-center justify-between gap-3 bg-[#F6F1E4]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5285A6]/15 text-[#5285A6] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#34302A] flex items-center gap-2">
                <span>اسأل دوّنلي</span>
                {isVoiceCallMode && (
                  <span className="text-[10px] bg-[#E0705C] text-white px-2 py-0.5 rounded-full animate-pulse">
                    مكالمة صوتية مباشرة
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#6E665A]">استفسر عن أي بيانات أو تواريخ بدقة ومصداقية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Voice Call Mode */}
            <button
              onClick={() => setIsVoiceCallMode(!isVoiceCallMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isVoiceCallMode
                  ? 'bg-[#E0705C] text-white border-[#E0705C]'
                  : 'bg-[#FFFCF5] hover:bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB]'
              }`}
              title="تفعيل وضع المكالمة الصوتية المباشرة"
            >
              {isVoiceCallMode ? <PhoneOff className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isVoiceCallMode ? 'إنهاء المكالمة' : 'وضع المكالمة'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9E9689] hover:text-[#34302A] hover:bg-[#F6F1E4]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scope Selector Bar */}
        <div className="px-4 py-2 bg-[#FFFCF5] border-b border-[#ECE6D8] flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar">
          <span className="text-[#9E9689] font-medium ml-1 shrink-0">نطاق الاستعلام:</span>
          {[
            { id: 'all', label: 'كل البيانات' },
            { id: 'finance', label: 'الفلوس والأصول' },
            { id: 'health', label: 'الصحة والوجبات' },
            { id: 'habits_goals', label: 'العادات والأهداف' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setScope(s.id as any)}
              className={`px-3 py-1 rounded-xl font-semibold shrink-0 transition-colors border ${
                scope === s.id
                  ? 'bg-[#5285A6] text-white border-[#5285A6]'
                  : 'bg-[#F6F1E4] text-[#6E665A] border-[#E3DCB] hover:bg-[#ECE6D8]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs ${
                    isUser ? 'bg-[#5C8A6B] text-white' : 'bg-[#5285A6]/15 text-[#5285A6]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#5C8A6B] text-white rounded-br-xs'
                      : 'bg-[#F6F1E4] text-[#34302A] border border-[#E3DCB] rounded-bl-xs'
                  }`}
                >
                  {m.content}

                  {!isUser && (
                    <button
                      onClick={() => speakResponse(m.content)}
                      className="mt-2 text-[10px] text-[#5285A6] hover:text-[#376380] flex items-center gap-1 font-semibold"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>قراءة صوتية</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 ml-auto">
              <div className="w-7 h-7 rounded-xl shrink-0 bg-[#5285A6]/15 text-[#5285A6] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-[#F6F1E4] border border-[#E3DCB] text-xs text-[#6E665A] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5285A6]" />
                <span>دوّنلي يبحث في دفاترك…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-[#ECE6D8] bg-[#F6F1E4]/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="اسأل: كم صرفت الأسبوع الماضي؟ أو كيف كان نومي؟"
              className="flex-1 bg-[#FFFCF5] border border-[#E3DCB] focus:border-[#5285A6] rounded-xl px-4 py-2.5 text-xs text-[#34302A] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                inputQuery.trim() && !isLoading
                  ? 'bg-[#5285A6] hover:bg-[#3D6E8D] text-white shadow-xs'
                  : 'bg-[#ECE6D8] text-[#9E9689] cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
