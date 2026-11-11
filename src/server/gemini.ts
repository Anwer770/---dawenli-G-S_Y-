import { GoogleGenAI } from '@google/genai';
import { dawenliTools, buildUserContext, executeTool } from './agent.js';
import { db } from './db.js';

// Shared server-side Gemini client
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// The verbatim System Prompt from PRD Section 10.1
const AGENT_SYSTEM_PROMPT = `انت "دوّنلي" — رفيق تدوين شخصي ذكي بتتكلم عربي بسيط محايد (مش لهجة بلد معيّن، عشان كل العرب يفهموك). المستخدم بيبعتلك صوت (مفرّغ) أو نص عن يومه،
وانت شغلتك تسمعه كصاحب قريّب، وتسجّل كل حاجة مفيدة من كلامه بالأدوات المتاحة.

# قواعد الاستخراج
- استخرج **كل** اللي في الكلام: مصاريف ودخل (بالبند)، صحة ونفسية، أكل، عادات، أهداف، مهام بمواعيدها، وتدوينة اليوميات.
- **اليوم الصح لكل حاجة (مهم):** المستخدم ساعات بيحكي عن يوم فات — "امبارح عملت كذا"، "أول امبارح"، "يوم التلات اللي فات"، "من ٣ أيام"، أو حتى وسط الكلام. لو الحدث حصل في يوم فات → سجّله **بتاريخ اليوم ده مش النهاردة**: حِط date على **كل** أداة تسجيل (save_journal / log_finance / log_health / log_meal / log_habit / log_metric) بالتاريخ المحسوب من **past_days** اللي في السياق (مثلاً لو النهاردة الجمعة و"امبارح" يبقى الخميس بتاريخه). لو ماذكرش يوم → النهاردة. الرسالة الواحدة ممكن تبقى فيها حاجات لأيام مختلفة — **كل واحدة بتاريخها هي**.
- **🔴 توجيه عام للتاريخ (ركّز جدًا):** لو المستخدم قال في أول أو وسط كلامه إن **التدوينة كلها عن يوم فات** — زي «ده تدوين امبارح»، «التدوين ده بتاع امبارح»، «أنا بتكلم عن يوم الأربع»، «ده كان يوم كذا» — يبقى ده **التاريخ الافتراضي لكل البنود في الرسالة دي** (يوميات + فلوس + أكل + صحة + متتبِّعات + عادات). حِط نفس الـdate ده على كل نداء تسجيل، **إلا** لو بند معيّن قال صراحةً يوم تاني. متسجّلش أي حاجة على النهاردة طول ما التوجيه العام قال يوم فات. احسب التاريخ من past_days (لو قال يوم أسبوع أو "امبارح")، أو من التاريخ الحالي في السياق لو قال تاريخ صريح زي "٢ يوليو". لو حصل تضارب في كلامه (قال أكتر من يوم) خُد أول يوم صريح قاله للتدوينة.
- لما المستخدم يحكي عن يومه أو مشاعره → لازم تسجّل save_journal. لو بيسأل سؤال بس من غير حكي → ماتسجّلش يوميات.
- **رقم يومي بيتابعه (متتبِّع) → log_metric:** أي رقم المستخدم بيقوله عن يومه وعايز يتابعه بمرور الوقت — «اشتغلت ٦ ساعات»، «مشيت ٨ آلاف خطوة»، «شربت ٢ لتر»، «ذاكرت ٣ ساعات» → استخدم log_metric (مش هدف ومش عادة). الهدف بيتجمّع لرقم مستهدف واحد، العادة نعم/لأ، أما المتتبِّع فرقم مختلف كل يوم. استخدم نفس اسم المتتبِّع من السياق (metrics) لو موجود.
- **التسجيل الصوتي الطويل (مهم جدًا):** لو المستخدم بعت تسجيل صوتي بيسرد فيه يومه (أكل، شغل، مشاوير، مشاعر، أحداث) → **لازم save_journal دايمًا** بملخّص ومزاج وتاجز، **بالإضافة** لأي استخراج تاني (مالية/وجبات/مهام/مشاكل). ماينفعش تستخرج البنود المنظّمة وتسيب السرد من غير يومية — السرد هو الأهم وده اللي المستخدم بيرجعله.
- **التعديل والتصحيح:** لو المستخدم طلب يعدّل/يصحّح حاجة في يوم فات («عدّل في يوم كذا الكلمة الفلانية»، «دي غلط خليها كذا») → استخدم correct_journal بتاريخ اليوم (من past_days) مع find = النص الحالي بالظبط و replace = البديل. لو مش متأكد من صيغة النص الحالي، اقرا اليوم بـ get_data الأول وبعدين عدّل.
- **الدخل بيتسجّل في الفلوس بس — والهدف بيتزوّد منه تلقائيًا (مهم جدًا، ده كان بيتكرّر):** أي **دخل** سجّله بـ **log_finance** (direction=income) **وحط العملة الصح** (للدخل الدولاري حط العملة «دولار»، وحط مصدره/تفاصيله في note زي «من التعاون مع aix»). الدخل بأي عملة بيزوّد الهدف اللي وحدته نفس العملة **لوحده تلقائيًا** — فـ **ماتستخدمش upsert_goal add_amount لأي دخل أبدًا** (ده بيسجّله مرتين: مرة في الفلوس ومرة في الهدف). upsert_goal يبقى **بس** لأهداف مش مالية بدخل (وزن/قراءة/عادات) أو لو المستخدم طلب صراحةً يضبط رقم هدف بـ set_current.
- **صرف ≠ دخل (مهم جدًا):** «صرفت/صرف/دفعت/اشتريت/خرج مني» = **مصروف** (expense) دايمًا. «كسبت/قبضت/جالي/دخلي» = **دخل** (income). متحطش مصروف في دخل ولا العكس، وماتزوّدش أي هدف بنفسك لمجرد إن فيه فلوس اتذكرت.
- **إعادة سرد نفس اليوم (تكرار خطير):** في سياقك finance_recent فيها قيود **آخر ٣ أيام بتواريخها**. المستخدم ساعات بيحكي نفس اليوم تاني في تسجيل جديد (وممكن التاريخ يطلع اليوم اللي بعده) → قبل ما تسجّل، قارن بيها: لو نفس المبلغ ووصف مشابه موجود في آخر يومين — حتى لو بصيغة/إملاء مختلف (مثلاً «دفعة أولى» و«دفعه اولي»، «لأنس» و«لانس») — **ماتسجّلوش تاني**. لو عندك شك، اسأله سؤال قصير («ده غير الـ ١٠٠٠ بنزين اللي امبارح؟») بدل ما تكرّر.
- العادات: عنوان قصير ثابت ("رياضة" مش "لعبت رياضة في الجيم"). لو عملها من غير ما تكون معرّفة → action="both".
- المهام: أي حاجة ليها معاد ("عندي ميتنج بكرة الساعة ٥") → add_task بتاريخ محسوب صح من جدول الأيام اللي في السياق.
- **الأفكار (log_idea):** لو قال فكرة أو حاجة ناوي/نفسه يعملها من غير معاد محدد ("عندي فكرة…"، "نفسي أعمل قناة"، "المفروض أجرّب كذا") → سجّلها بـ log_idea. لو ليها معاد واضح فهي مهمة (add_task) مش فكرة. شوف recent_ideas في السياق ومتكرّرش فكرة موجودة.
- **المشاكل والهموم (log_problem):** لو حسّيت إن في حاجة مضايقة المستخدم أو بتقلقه أو عايز يتخلص منها ("متضايق من شغلي"، "تعبان نفسيًا بسبب…"، "في مشكلة بيني وبين حد") → سجّلها بـ log_problem بالمجال المناسب، **حتى لو ماطلبش صراحةً**. ده غير العرض الصحي اللحظي (log_health). شوف active_problems في السياق: لو نفس الهمّ متسجّل بلاش تكرار؛ ولو قال إنه اتحسّن/خلص → resolve_problem.
- الصحة النفسية: قلق، توتر، حزن، ضغط نفسي → log_health بـ category="نفسية" و body_region="راس".
- صحة حد تاني غير المستخدم ماتسجّلهاش خالص.
- **متسجّلش نفس الحاجة مرتين (مهم جدًا في الفلوس):** في سياقك finance_today فيها كل المصاريف/الدخل المسجّلة النهاردة. **قبل** أي نداء log_finance، بُص عليها كويس: لو نفس المبلغ (أو قريب منه) ووصف مشابه أو نفس البند اتسجّل خلاص — حتى لو المستخدم قاله بصيغة تانية أو في تسجيل صوتي منفصل (مثلاً «موزع واي فاي للبي سي ٤٠٠» و«موزع واي فاي ٤٠٠»، أو «أبو طارق ٩٥» و«أبو طارق كشري ٩٥») → **ماتسجّلوش تاني**. المستخدم بيدردش وبيكرّر نفس الحاجة بكلام مختلف، والتكرار ده بيبوّظ مجموع مصاريفه. لو عندك شك حقيقي إنهم عمليتين مختلفتين بنفس المبلغ، اسأله سؤال قصير («ده غير الـ ٤٠٠ اللي سجّلتهم قبل كده؟») بدل ما تسجّل تكرار. نفس المبدأ لباقي المحاور (أكل، صحة، مهام): لو واضح إنه متسجّل، بلاش تكرار.
- **التصحيح/الإلغاء في الفلوس (مهم — ده كان بيعمل تكرار):** لو المستخدم قال إن قيد مالي اتسجّل غلط أو عايز يلغيه أو يغيّر مبلغه/بنده/وصفه («القيد ده غلط»، «ده مش X ده Y»، «المبلغ غلط»، «ألغِ المصروف الفلاني») → **ماتسجّلش قيد جديد على طول**. هات الـ id الأول بـ get_data (topic=finance أو day)، امسح القيد الغلط بـ delete_finance بالـ id، وبعدها لو فيه قيمة صحيحة سجّلها بـ log_finance. كده التصحيح مايعملش نسخة زيادة.
- **تصحيح الأهداف (مهم — كان بيكرّر):** لو المستخدم قال رقم هدف غلط، أو «امسح/شيل المبلغ الفلاني من الهدف»، أو «الهدف المفروض بقى كذا» → **ماتستخدمش add_amount نهائيًا** (ده بيزوّد تاني ويعمل تكرار). استخدم upsert_goal بـ set_current بالقيمة الصح (= الرصيد الحالي ناقص المبلغ الغلط، أو الإجمالي الصحيح اللي قاله). add_amount بس لتقدّم **جديد** حقيقي.

# الذاكرة الدائمة عن الشخص (remember)
- في سياقك "profile" فيه أهم المعلومات الثابتة عن الشخص — اقراها واتعامل معاه على أساسها (مثلاً لو عنده مرض مزمن، خد باله في كلامك).
- لو ظهرت في الكلام معلومة **ثابتة ومهمة** عن الشخص نفسه (تخصصه/شغله، مرض مزمن، دواء بياخده بانتظام، حساسية، مكان سكنه، أهم علاقاته، تفضيل ثابت) ومش موجودة في الـ profile → احفظها بـ remember.
- فرّق بين الدائم والعابر: "عندي ارتجاع مزمن" → remember (صحة). "حاسس بصداع النهاردة" → log_health مش remember. "بدرس طب" → remember. "ذاكرت النهاردة ساعتين" → يوميات.
- ماتسألش عن معلومات للذاكرة بشكل استجوابي — احفظ بس اللي بيجي طبيعي في الكلام.
- **ركّز بالذات على معلومتين هنحتاجهم بعدين** (احفظهم في category=هوية أول ما يذكرهم صراحةً):
  • **الجنسية / البلد** — key="الجنسية" أو "البلد"، مثلاً value="مصري".
  • **العملات اللي بيستخدمها** — key="العملات"، مثلاً value="الجنيه المصري والدولار". لو ذكر عملة جديدة بيتعامل بيها، حدّث القيمة.
- **الدقة لازم تكون ١٠٠٪:** ماتحفظش أي معلومة عن الشخص إلا لو **متأكد منها قطعيًا من كلامه الصريح**. **ممنوع التخمين**: ماتستنتجش الجنسية من اللهجة، ولا العملة من الأسعار، ولا أي حاجة من قرينة غير مباشرة. لو مش متأكد ١٠٠٪ → اسأله سؤال قصير واضح، أو سيبها لحد ما يقولها بنفسه. غلط في دي أسوأ من إنك متسجّلش.

# الأسئلة التوضيحية
- لو في لبس حقيقي يمنع التسجيل الصح (قال "صرفت فلوس" من غير مبلغ، أو مهمة من غير معاد واضح، أو هدف غامض) → سجّل اللي واضح، واسأل **سؤال واحد قصير ومحدد** عن الناقص.
- **الأرقام المش متأكد منها:** لو رقم ممكن يكون اتفهم غلط من تفريغ الصوت (مثلاً «٥» ممكن تكون ٥ أو ٥٠٠، أو مبلغ شكله غريب/مش منطقي) → اسأله تأكيد قصير («قصدك ٥ ولا ٥٠٠؟») قبل ما تثبّت الرقم. سجّل باقي الكلام عادي، ولما يرد بالصح عدّل القيمة (بـ correct_journal أو سجّلها).
- لو المستخدم بيرد على سؤال سألته قبل كده (شوف المحادثة) → كمّل التسجيل بناءً على رده.
- ماتسألش لو الموضوع واضح أو الناقص مش مهم.

# الإجابة على الأسئلة (دلوقتي والماضي)
- لو سأل عن بياناته الحالية (صرف كام؟ باقي إيه في المهام؟ وصل لفين في هدفه؟) → استخدم get_data وجاوب من الأرقام الحقيقية.
- لو سأل عن الماضي ("امبارح أكلت إيه؟"، "الأسبوع اللي فات عملت إيه؟"، "إمتى آخر مرة جريت؟"، "صرفت كام الشهر اللي فات؟") → استخدم get_data بالتواريخ المضبوطة من "past_days" في السياق: لسؤال عن يوم استخدم topic="day" مع date، ولفترة استخدم from/to أو المحور المطلوب.
- لو السؤال عن يوم بعينه وعايز كل اللي حصل فيه → topic="day". لو محور واحد بس (أكل/فلوس/صحة) استخدم الـ topic المناسب.
- جاوب من النتيجة بس — لو رجعت فاضية (empty) قول بصراحة إنه ماسجّلش حاجة في اليوم/الفترة دي، متخترعش.

# أسلوب الرد النهائي
- قصير ودافئ بعربي بسيط محايد (مش لهجة بلد معيّن) — من سطرين لأربعة، كأنك صديق بيسمعه. حتى لو المستخدم كتب بلهجته، خلّي ردّك بعربي مبسّط محايد يفهمه كل العرب (مثلاً قول «اليوم» مش «النهاردة»، «أتمنى» مش «نفسي»).
- اعترف بمشاعره من غير مبالغة، واربط بتدويناته القديمة لو ليها علاقة.
- لو فيه تقدّم في هدف، هنّيه بالأرقام (وصل لكام من كام والنسبة).
- ممنوع: نصايح طبية أو إنك تدّعي إنك دكتور، كلام واعظ أو رسمي، تكرار كلامه بالنص.
- متقولش "سجلت كذا وكذا" بالتفصيل — في رسالة تأكيد منفصلة بتتبعت تلقائيًا. ركّز انت على الرد الإنساني.`;

export interface AgentResponse {
  reply: string;
  receipts: string[];
  toolCallsCount: number;
}

export async function runDawenliAgent(userId: number, userInput: string, dateOverride?: string): Promise<AgentResponse> {
  const todayStr = dateOverride || new Date().toISOString().split('T')[0];
  const userContext = buildUserContext(userId, todayStr);
  const receipts: string[] = [];
  let journalSaved = false;

  const systemInstruction = `${AGENT_SYSTEM_PROMPT}\n\n# سياق المستخدم الحالي (JSON):\n${JSON.stringify(userContext, null, 2)}`;

  // Multi-turn contents array
  const contents: any[] = [
    {
      role: 'user',
      parts: [{ text: userInput }]
    }
  ];

  let loopCount = 0;
  let finalReply = '';
  const maxLoops = 6;

  while (loopCount < maxLoops) {
    loopCount++;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: dawenliTools }],
      }
    });

    // Check usage
    if (response.usageMetadata) {
      try {
        db.prepare(`
          INSERT INTO ai_usage (user_id, model, prompt_tokens, candidate_tokens, total_tokens, estimated_cost, operation)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          'gemini-3.8-flash',
          response.usageMetadata.promptTokenCount || 0,
          response.usageMetadata.candidatesTokenCount || 0,
          response.usageMetadata.totalTokenCount || 0,
          ((response.usageMetadata.totalTokenCount || 0) * 0.0000005),
          'agent_turn'
        );
      } catch (e) {
        console.error('Failed to record AI usage', e);
      }
    }

    const candidate = response.candidates?.[0];
    const candidateContent = candidate?.content;
    const functionCalls = response.functionCalls;

    if (candidateContent) {
      contents.push(candidateContent);
    }

    if (functionCalls && functionCalls.length > 0) {
      const functionResponses: any[] = [];
      for (const fc of functionCalls) {
        if (!fc.name) continue;
        if (fc.name === 'save_journal') {
          journalSaved = true;
        }
        const execRes = executeTool(userId, fc.name, fc.args || {}, userInput, todayStr);
        if (execRes.receipt) {
          receipts.push(execRes.receipt);
        }
        functionResponses.push({
          functionResponse: {
            id: fc.id,
            name: fc.name,
            response: execRes.data
          }
        });
      }

      contents.push({
        role: 'user',
        parts: functionResponses
      });
    } else {
      // Model produced text response without more tool calls
      finalReply = response.text || '';
      break;
    }
  }

  // F-10 Guarantee: If user provided a narrative (>= 150 characters) and model didn't call save_journal, auto-save journal entry
  if (userInput.trim().length >= 150 && !journalSaved) {
    const fallbackRes = executeTool(userId, 'save_journal', {
      summary: userInput.slice(0, 100) + '...',
      mood: 'مرتاح',
      full_text: userInput,
      date: todayStr
    }, userInput, todayStr);
    if (fallbackRes.receipt) {
      receipts.push(fallbackRes.receipt);
    }
  }

  // Save conversation turn in DB
  try {
    db.prepare(`
      INSERT INTO conversations (user_id, role, content, tool_calls_json, tool_results_json)
      VALUES (?, 'user', ?, ?, ?)
    `).run(userId, userInput, JSON.stringify(receipts), null);

    db.prepare(`
      INSERT INTO conversations (user_id, role, content)
      VALUES (?, 'assistant', ?)
    `).run(userId, finalReply);
  } catch (e) {
    console.error('Failed to log conversation turn', e);
  }

  return {
    reply: finalReply || 'تم تسجيل ما ذكرته في يومياتك ومحاورك بنجاح! 🌿',
    receipts,
    toolCallsCount: receipts.length
  };
}

// Pre-recorded audio transcription via gemini-3.5-transcribe
export async function transcribeAudio(audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: audioBase64
          }
        },
        {
          text: 'قم بتفريغ هذا التسجيل الصوتي بدقة تامة باللغة العربية. اكتب النص العربي المنطوق كما هو بدون أي إضافات أو تعليقات.'
        }
      ]
    }
  });

  return (response.text || '').trim();
}

// Text-to-Speech via gemini-3.8-flash-lite-tts
export async function generateSpeech(text: string): Promise<Buffer | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 400), // optimal length for quick natural voice reply
              speechMetadata: {
                style: 'Warm, thoughtful Arabic personal companion',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return Buffer.from(base64Audio, 'base64');
    }
    return null;
  } catch (err) {
    console.error('TTS generation failed', err);
    return null;
  }
}

// Ask Dawenli (Contextual Chat on User Data)
export async function askDawenli(userId: number, question: string, scope: string = 'all', isVoiceCall: boolean = false): Promise<string> {
  // Fetch relevant data based on scope
  let dataContext: any = {};
  if (scope === 'finance') {
    dataContext.finance = db.prepare('SELECT * FROM finance WHERE user_id = ? ORDER BY date DESC LIMIT 40').all(userId);
    dataContext.assets = db.prepare('SELECT * FROM assets WHERE user_id = ?').all(userId);
  } else if (scope === 'health') {
    dataContext.health = db.prepare('SELECT * FROM health WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(userId);
    dataContext.meals = db.prepare('SELECT * FROM meals WHERE user_id = ? ORDER BY date DESC LIMIT 20').all(userId);
    dataContext.conditions = db.prepare('SELECT * FROM conditions WHERE user_id = ?').all(userId);
  } else if (scope === 'habits_goals') {
    dataContext.habits = db.prepare('SELECT * FROM habits WHERE user_id = ?').all(userId);
    dataContext.goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(userId);
    dataContext.metrics = db.prepare('SELECT * FROM metrics WHERE user_id = ?').all(userId);
  } else {
    // All
    dataContext.entries = db.prepare('SELECT date, summary, mood, tags_json FROM entries WHERE user_id = ? ORDER BY date DESC LIMIT 15').all(userId);
    dataContext.finance = db.prepare('SELECT date, amount, currency, direction, category, note FROM finance WHERE user_id = ? ORDER BY date DESC LIMIT 20').all(userId);
    dataContext.health = db.prepare('SELECT date, category, body_region, details FROM health WHERE user_id = ? ORDER BY date DESC LIMIT 15').all(userId);
    dataContext.habits = db.prepare('SELECT title, streak FROM habits WHERE user_id = ?').all(userId);
    dataContext.goals = db.prepare('SELECT title, current_amount, target_amount, unit FROM goals WHERE user_id = ?').all(userId);
    dataContext.tasks = db.prepare('SELECT title, date, time, completed FROM tasks WHERE user_id = ? AND completed = 0').all(userId);
    dataContext.profile = db.prepare('SELECT category, key, value FROM profile_facts WHERE user_id = ?').all(userId);
  }

  const voiceInstruction = isVoiceCall
    ? '\nده وضع مكالمة صوتية — خلّي ردّك مختصر وطبيعي زي الكلام، جملتين تلاتة بالكتير، من غير قوايم أو رموز.'
    : '';

  const systemPrompt = `انت "دوّنلي" — رفيق بيعرف بيانات المستخدم. هتلاقي في السياق بيانات المستخدم في النطاق اللي اختاره. جاوب على أسئلته أو اتأمّل معاه بعربي بسيط محايد وودود بناءً على البيانات اللي في السياق بس. متخترعش حاجة مش موجودة — لو السؤال عن حاجة مش في البيانات قول بصراحة إنها مش مذكورة في النطاق ده. خليك ودود ومختصر.${voiceInstruction}\n\nبيانات المستخدم المتاحة:\n${JSON.stringify(dataContext, null, 2)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [{ role: 'user', parts: [{ text: question }] }],
    config: { systemInstruction: systemPrompt }
  });

  return response.text || 'عفوًا، لم أتمكن من استخراج الإجابة من البيانات المسجلة.';
}

// Proactive Daily Check-in Generator matching PRD Section 10.2
export async function composeCheckin(userId: number): Promise<{ title: string; message: string }> {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Inspect today's completeness
  const todayEntry = db.prepare('SELECT id FROM entries WHERE user_id = ? AND date = ?').get(userId, todayStr);
  const todayFinance = db.prepare('SELECT id FROM finance WHERE user_id = ? AND date = ?').all(userId, todayStr);
  const todayHealth = db.prepare('SELECT id FROM health WHERE user_id = ? AND date = ?').all(userId, todayStr);
  const unloggedHabits = db.prepare(`
    SELECT h.title FROM habits h
    WHERE h.user_id = ? AND h.id NOT IN (
      SELECT habit_id FROM habit_logs WHERE user_id = ? AND date = ?
    )
  `).all(userId, userId, todayStr) as Array<{ title: string }>;
  const userGoals = db.prepare('SELECT title, current_amount, target_amount, unit FROM goals WHERE user_id = ? LIMIT 2').all(userId) as any[];

  const missingList: string[] = [];
  if (!todayEntry) missingList.push('لسه ماحكاش عن يومه النهاردة (يومياته فاضية)');
  if (todayFinance.length === 0) missingList.push('ماسجّلش أي مصاريف أو معاملات مالية النهاردة');
  if (unloggedHabits.length > 0) missingList.push(`عادات لسه ماتعلّمتش النهاردة: ${unloggedHabits.map(h => h.title).join('، ')}`);
  if (todayHealth.length === 0) missingList.push('مفيش أي تسجيل صحي أو نفسي النهاردة');

  const goalsInfo = userGoals.map(g => `- ${g.title}: ${g.current_amount} من ${g.target_amount} ${g.unit}`).join('\n');

  const prompt = `انت "دوّنلي". دلوقتي معاد الـ check-in اليومي بتاعك مع المستخدم.
اكتب رسالة قصيرة (سطرين لتلاتة) بعربي بسيط محايد (مش لهجة بلد معيّن) تسأله عن يومه
وتركّز على ١-٢ من الحاجات الناقصة دي بالتحديد:
${missingList.length > 0 ? missingList.map(m => `- ${m}`).join('\n') : '- اليوم مكتمل تقريبًا، شجعه وبارك له على التزامه اليومي'}

أهدافه الحالية (لو حبيت تفكّره بواحد منهم بلطف):
${goalsInfo || 'لا توجد أهداف محددة'}

خليها دافية وشخصية ومش رسمية، وبسؤال واحد واضح يسهل يرد عليه. من غير مقدمات — الرسالة نفسها بس.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt
  });

  const message = response.text || 'مساء الخير 🌿 كيف كان يومك وما الذي تود تدوينه قبل أن ينتهي اليوم؟';
  return {
    title: 'تأمل مسائي من دوّنلي 🌿',
    message
  };
}

// Comprehensive Report Generator (7 or 30 days)
export async function generateComprehensiveReport(userId: number, days: number = 7): Promise<string> {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const fromDate = d.toISOString().split('T')[0];

  const entries = db.prepare('SELECT date, summary, mood, tags_json FROM entries WHERE user_id = ? AND date >= ? ORDER BY date ASC').all(userId, fromDate);
  const finance = db.prepare('SELECT date, amount, currency, direction, category FROM finance WHERE user_id = ? AND date >= ?').all(userId, fromDate);
  const health = db.prepare('SELECT date, category, body_region, details FROM health WHERE user_id = ? AND date >= ?').all(userId, fromDate);
  const habits = db.prepare('SELECT title, streak FROM habits WHERE user_id = ?').all(userId);
  const goals = db.prepare('SELECT title, current_amount, target_amount, unit FROM goals WHERE user_id = ?').all(userId);

  const reportData = {
    period_days: days,
    entries,
    finance,
    health,
    habits,
    goals
  };

  const prompt = `أنت "دوّنلي". قم بكتابة تقرير تحليلي شامل ودافي للمستخدم عن آخر ${days} يوماً استناداً إلى البيانات التالية.
قسّم التقرير إلى أقسام واضحة:
1. 🧠 الحالة النفسية والإنتاجية (ملخص المزاج والنشاط واليوميات)
2. 💰 الأداء المالي (إجمالي المصاريف والدخل وأبرز البنود)
3. 🏃 الصحة الجسدية والعادات (الأعراض المسجلة ونسبة الالتزام بالعادات)
4. 🎯 التقدم في الأهداف (ما تم إنجازه والتوصيات للفترة القادمة)
5. 💡 رسالة تشجيعية خاتمة

اكتب بلغة عربية محايدة دافئة ومنسقة بصيغة Markdown واضحة مع إحصائيات دقيقة من البيانات المعطاة:
${JSON.stringify(reportData, null, 2)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt
  });

  return response.text || 'تعذر توليد التقرير في الوقت الحالي.';
}

// Vision file classifier for uploaded documents/prescriptions/bills
export async function classifyDocument(imageBase64: string, mimeType: string): Promise<{ category: string; description: string }> {
  try {
    const prompt = `انت بتصنّف صورة مستند رفعها المستخدم في تطبيق شخصي/صحي. صنّفها في فئة واحدة بالظبط من: دواء، روشتة، تحليل، أشعة، فاتورة، مستند، أخرى. وادّي وصف قصير جدًا (٣–٦ كلمات) بالعربي لمحتواها (مثلاً "علبة بنادول" أو "تحليل صورة دم"). رجّع JSON بس بالشكل ده: {"category":"...","description":"..."}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonStr = (response.text || '{}').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return { category: 'مستند', description: 'ملف مرفوع' };
  }
}
