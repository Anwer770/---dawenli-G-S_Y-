import { FunctionDeclaration, Type } from '@google/genai';
import { db } from './db.js';

// Text normalizer for anti-duplication
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // strip tashkeel & tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ|ئ/g, 'ء')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// 17 Function Declarations matching PRD Section 6.2
export const dawenliTools: FunctionDeclaration[] = [
  {
    name: 'save_journal',
    description: 'تسجيل تدوينة اليوميات: ملخص ومزاج ووسوم وتاريخ والنص الكامل.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: 'ملخص مركز للتدوينة سطر أو سطرين' },
        mood: { type: Type.STRING, description: 'مزاج اليوم (مرتاح، سعيد، مجهد، متوتر، هادئ، حزين، إلخ)' },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'وسوم الكلمات المفتاحية' },
        date: { type: Type.STRING, description: 'تاريخ اليوم YYYY-MM-DD لو كان يوم فات' },
        full_text: { type: Type.STRING, description: 'النص الكامل أو السرد للتدوينة' }
      },
      required: ['summary']
    }
  },
  {
    name: 'correct_journal',
    description: 'تعديل أو تصحيح نص في تدوينة يوم فات عن طريق البحث والاستبدال.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'تاريخ اليوم YYYY-MM-DD' },
        find: { type: Type.STRING, description: 'النص الحالي للبحث عنه بالظبط' },
        replace: { type: Type.STRING, description: 'النص البديل الجديد' }
      },
      required: ['date', 'find', 'replace']
    }
  },
  {
    name: 'log_finance',
    description: 'تسجيل قيد مالي: مصروف أو دخل بمبلغ وعملة وبند وملاحظة وتاريخ.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'المبلغ بالأرقام' },
        direction: { type: Type.STRING, description: 'نوع العملية: "expense" (مصروف) أو "income" (دخل)' },
        category: { type: Type.STRING, description: 'البند: أكل، مواصلات، فواتير، صحة، تسوق، ترفيه، بيت، شغل، تعليم، أخرى' },
        note: { type: Type.STRING, description: 'تفاصيل وملاحظات القيد' },
        currency: { type: Type.STRING, description: 'العملة (جنيه، دولار، إلخ)' },
        date: { type: Type.STRING, description: 'تاريخ القيد YYYY-MM-DD' }
      },
      required: ['amount', 'direction', 'category']
    }
  },
  {
    name: 'delete_finance',
    description: 'مسح قيد مالي بالمعرف (id) للتصحيح أو الإلغاء.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'معرف القيد المالي المراد حذفه' }
      },
      required: ['id']
    }
  },
  {
    name: 'log_idea',
    description: 'تسجيل فكرة أو نية للمستقبل من غير ميعاد محدد.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'عنوان الفكرة' },
        description: { type: Type.STRING, description: 'شرح أو تفاصيل الفكرة' },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'وسوم الفكرة' }
      },
      required: ['title']
    }
  },
  {
    name: 'log_problem',
    description: 'تسجيل همّ أو مشكلة أو قلق يمر به المستخدم بمجال محدد.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'وصف المشكلة أو الهم' },
        domain: { type: Type.STRING, description: 'المجال: شغل، صحة، علاقات، نفسي، فلوس، أخرى' },
        severity: { type: Type.STRING, description: 'الشدة: خفيف، متوسط، شديد' }
      },
      required: ['title']
    }
  },
  {
    name: 'resolve_problem',
    description: 'إغلاق أو حل مشكلة كانت مسجلة عندما تتحسن أو تنتهي.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'معرف المشكلة إن وجد' },
        title: { type: Type.STRING, description: 'عنوان المشكلة للبحث عنها' },
        resolution: { type: Type.STRING, description: 'كيف تم الحل أو التحسن' }
      }
    }
  },
  {
    name: 'upsert_goal',
    description: 'إنشاء أو تعديل هدف ومتابعة التقدم (لا تستخدم add_amount للدخل المالي لأنه يضاف آلياً).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'عنوان الهدف' },
        add_amount: { type: Type.NUMBER, description: 'زيادة على الرصيد الحالي (لأهداف غير مالية)' },
        set_current: { type: Type.NUMBER, description: 'تعيين القيمة الحالية مباشرة لتصحيح خطأ' },
        target_amount: { type: Type.NUMBER, description: 'المستهدف الإجمالي للهدف' },
        unit: { type: Type.STRING, description: 'الوحدة (جنيه، كتاب، كيلو، ساعة)' }
      },
      required: ['title']
    }
  },
  {
    name: 'log_metric',
    description: 'تسجيل قيمة متتبع يومي (ساعات عمل، خطوات، لتر مية، إلخ).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'اسم المتتبع (مثل: خطوات، ساعات عمل، شرب مية)' },
        value: { type: Type.NUMBER, description: 'القيمة المسجلة اليوم' },
        unit: { type: Type.STRING, description: 'الوحدة' },
        daily_target: { type: Type.NUMBER, description: 'الهدف اليومي المستهدف' },
        date: { type: Type.STRING, description: 'التاريخ YYYY-MM-DD' }
      },
      required: ['name', 'value']
    }
  },
  {
    name: 'log_habit',
    description: 'تعريف عادة جديدة أو تسجيل أدائها أو كلاهما.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'اسم العادة القصير الثابت (مثل: رياضة، قراءة)' },
        action: { type: Type.STRING, description: '"log" للتسجيل، "define" للتعريف، أو "both" للاثنين' },
        habit_type: { type: Type.STRING, description: '"do" (اعمل) أو "quit" (بطل)' },
        date: { type: Type.STRING, description: 'التاريخ YYYY-MM-DD' }
      },
      required: ['title']
    }
  },
  {
    name: 'add_task',
    description: 'إضافة مهمة جديدة بتاريخ ووقت وملاحظة.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'عنوان المهمة' },
        date: { type: Type.STRING, description: 'تاريخ الإنجاز YYYY-MM-DD' },
        time: { type: Type.STRING, description: 'الوقت المحدد بصيغة HH:MM' },
        note: { type: Type.STRING, description: 'ملاحظة إضافية' }
      },
      required: ['title']
    }
  },
  {
    name: 'complete_task',
    description: 'إكمال مهمة مسجلة مسبقاً بالمعرف أو العنوان.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'معرف المهمة' },
        title: { type: Type.STRING, description: 'عنوان المهمة للبحث عنها' }
      }
    }
  },
  {
    name: 'log_health',
    description: 'تسجيل عرض صحي أو دواء أو نوم أو تمرين أو حالة نفسية ومكان الجسم.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'الفئة: عرض، دواء، نوم، تمرين، نفسية، ملاحظة' },
        body_region: { type: Type.STRING, description: 'منطقة الجسم: راس، صدر، معدة، بطن، ذراعين، ساقين، عام' },
        details: { type: Type.STRING, description: 'تفاصيل الحالة أو اسم التمرين/الدواء' },
        severity: { type: Type.STRING, description: 'الشدة: خفيف، متوسط، شديد' },
        date: { type: Type.STRING, description: 'التاريخ YYYY-MM-DD' }
      },
      required: ['category', 'details']
    }
  },
  {
    name: 'track_condition',
    description: 'بدء أو تحديث حالة متابعة صحية ممتدة (مثل: ارتجاع، حساسية) لإعداد تقرير طبي.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'اسم الحالة أو التشخيص للمتابعة' },
        description: { type: Type.STRING, description: 'الأعراض المبدئية والتفاصيل' },
        duration_days: { type: Type.NUMBER, description: 'مدة المتابعة بالأيام (افتراضي 30)' }
      },
      required: ['title']
    }
  },
  {
    name: 'log_meal',
    description: 'تسجيل وجبة طعام أو مشروب تم تناوله.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        meal_type: { type: Type.STRING, description: 'النوع: فطار، غدا، عشا، سناك، مشروب' },
        description: { type: Type.STRING, description: 'محتويات الوجبة بالتفصيل' },
        date: { type: Type.STRING, description: 'التاريخ YYYY-MM-DD' }
      },
      required: ['meal_type', 'description']
    }
  },
  {
    name: 'remember',
    description: 'حفظ معلومة دائمة ومؤكدة عن الشخص في ذاكرة الملف الشخصي (ممنوع التخمين).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'الفئة: هوية، صحة، شغل، علاقات، تفضيلات' },
        key: { type: Type.STRING, description: 'المفتاح (مثل: الجنسية، العملات، الوظيفة، حساسية)' },
        value: { type: Type.STRING, description: 'القيمة المؤكدة' }
      },
      required: ['category', 'key', 'value']
    }
  },
  {
    name: 'get_data',
    description: 'استعلام عن بيانات المستخدم الحالية أو السابقة.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: 'الموضوع: day, finance, goals, habits, tasks, health, journal, meals' },
        date: { type: Type.STRING, description: 'التاريخ المحدد YYYY-MM-DD' },
        from: { type: Type.STRING, description: 'تاريخ بداية الفترة' },
        to: { type: Type.STRING, description: 'تاريخ نهاية الفترة' }
      },
      required: ['topic']
    }
  }
];

// Context Builder for Agent
export function buildUserContext(userId: number, todayStr: string) {
  // Past days reference table for resolving "امبارح", "يوم التلات", etc.
  const pastDays: Record<string, string> = {};
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = new Date(todayStr + 'T12:00:00Z');
  
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateFormatted = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getUTCDay()];
    if (i === 0) pastDays['النهاردة'] = dateFormatted;
    if (i === 1) pastDays['امبارح'] = dateFormatted;
    if (i === 2) pastDays['أول امبارح'] = dateFormatted;
    pastDays[dayName] = dateFormatted;
  }

  // Finance today
  const financeToday = db.prepare(`
    SELECT id, amount, currency, direction, category, note 
    FROM finance 
    WHERE user_id = ? AND date = ?
  `).all(userId, todayStr);

  // Finance recent (last 3 days)
  const financeRecent = db.prepare(`
    SELECT id, date, amount, currency, direction, category, note 
    FROM finance 
    WHERE user_id = ? 
    ORDER BY date DESC, id DESC 
    LIMIT 15
  `).all(userId);

  // Profile facts
  const profileFacts = db.prepare(`
    SELECT category, key, value 
    FROM profile_facts 
    WHERE user_id = ?
  `).all(userId);

  // Active Goals
  const goals = db.prepare(`
    SELECT id, title, target_amount, current_amount, unit 
    FROM goals 
    WHERE user_id = ?
  `).all(userId);

  // Habits
  const habits = db.prepare(`
    SELECT id, title, habit_type, streak 
    FROM habits 
    WHERE user_id = ?
  `).all(userId);

  // Today tasks
  const tasksToday = db.prepare(`
    SELECT id, title, time, completed 
    FROM tasks 
    WHERE user_id = ? AND (date = ? OR date IS NULL)
  `).all(userId, todayStr);

  // Metrics
  const metrics = db.prepare(`
    SELECT id, name, unit, daily_target 
    FROM metrics 
    WHERE user_id = ?
  `).all(userId);

  // Recent ideas
  const recentIdeas = db.prepare(`
    SELECT id, title 
    FROM ideas 
    WHERE user_id = ? AND status = 'inbox' 
    LIMIT 6
  `).all(userId);

  // Active problems
  const activeProblems = db.prepare(`
    SELECT id, title, domain, severity 
    FROM problems 
    WHERE user_id = ? AND status = 'active' 
    LIMIT 6
  `).all(userId);

  return {
    today: todayStr,
    past_days: pastDays,
    profile: profileFacts,
    finance_today: financeToday,
    finance_recent: financeRecent,
    goals,
    habits,
    tasks_today: tasksToday,
    metrics,
    recent_ideas: recentIdeas,
    active_problems: activeProblems
  };
}

// Tool Execution Handler
export interface ToolResult {
  receipt?: string;
  data: any;
  actionTaken: boolean;
}

export function executeTool(userId: number, name: string, args: any, rawInputText: string, todayStr: string): ToolResult {
  const dateToUse = args.date || todayStr;

  switch (name) {
    case 'save_journal': {
      const summary = args.summary || '';
      const mood = args.mood || 'مرتاح';
      const tags = Array.isArray(args.tags) ? args.tags : [];
      const fullText = args.full_text || rawInputText || summary;
      const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;

      // Merge daily entry if existing
      const existing = db.prepare('SELECT id, full_text FROM entries WHERE user_id = ? AND date = ?').get(userId, dateToUse) as { id: number; full_text: string } | undefined;
      if (existing) {
        const mergedText = existing.full_text + '\n\n' + fullText;
        const newWordCount = mergedText.trim().split(/\s+/).filter(Boolean).length;
        db.prepare(`
          UPDATE entries 
          SET full_text = ?, summary = ?, mood = ?, tags_json = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(mergedText, summary, mood, JSON.stringify(tags), newWordCount, existing.id);
      } else {
        db.prepare(`
          INSERT INTO entries (user_id, date, full_text, summary, mood, tags_json, word_count)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(userId, dateToUse, fullText, summary, mood, JSON.stringify(tags), wordCount);
      }
      return {
        actionTaken: true,
        receipt: `تدوينة يومية (${dateToUse}): ${summary}`,
        data: { success: true, date: dateToUse, summary }
      };
    }

    case 'correct_journal': {
      const { date, find, replace } = args;
      const targetDate = date || todayStr;
      const entry = db.prepare('SELECT id, full_text FROM entries WHERE user_id = ? AND date = ?').get(userId, targetDate) as { id: number; full_text: string } | undefined;
      if (!entry) {
        return { actionTaken: false, data: { error: `لم يتم العثور على تدوينة لتاريخ ${targetDate}` } };
      }
      if (!entry.full_text.includes(find)) {
        return { actionTaken: false, data: { error: `النص "${find}" غير موجود في تدوينة ${targetDate}` } };
      }
      const updatedText = entry.full_text.replace(find, replace);
      db.prepare('UPDATE entries SET full_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(updatedText, entry.id);
      return {
        actionTaken: true,
        receipt: `تصحيح في تدوينة ${targetDate}`,
        data: { success: true, message: 'تم استبدال النص بنجاح' }
      };
    }

    case 'log_finance': {
      const amount = Number(args.amount);
      const direction = args.direction === 'income' ? 'income' : 'expense';
      const category = args.category || (direction === 'income' ? 'شغل' : 'أخرى');
      const note = args.note || '';
      const currency = args.currency || 'جنيه';

      // Anti-duplication check: compare against today's entries with normalized text
      const normalizedNewNote = normalizeArabic(note);
      const existingEntries = db.prepare(`
        SELECT id, amount, note, category 
        FROM finance 
        WHERE user_id = ? AND date = ? AND direction = ?
      `).all(userId, dateToUse, direction) as Array<{ id: number; amount: number; note: string; category: string }>;

      const isDuplicate = existingEntries.some(e => {
        if (Math.abs(e.amount - amount) < 0.01) {
          const normExisting = normalizeArabic(e.note || '');
          if (!normalizedNewNote && !normExisting && e.category === category) return true;
          if (normalizedNewNote && normExisting) {
            if (normExisting === normalizedNewNote || normExisting.includes(normalizedNewNote) || normalizedNewNote.includes(normExisting)) {
              return true;
            }
          }
        }
        return false;
      });

      if (isDuplicate) {
        return {
          actionTaken: false,
          receipt: undefined,
          data: { status: 'skipped_duplicate', message: 'تم تجاهل القيد لأنه مسجل مسبقاً لمنع التكرار' }
        };
      }

      const stmt = db.prepare(`
        INSERT INTO finance (user_id, date, amount, currency, direction, category, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(userId, dateToUse, amount, currency, direction, category, note);
      const financeId = Number(info.lastInsertRowid);

      // Auto-progress goal if income matches a financial goal currency
      let goalUpdatedNotice = '';
      if (direction === 'income') {
        const matchingGoal = db.prepare(`
          SELECT id, title, current_amount, target_amount 
          FROM goals 
          WHERE user_id = ? AND (unit = ? OR unit = 'جنيه')
          ORDER BY id ASC LIMIT 1
        `).get(userId, currency) as { id: number; title: string; current_amount: number; target_amount: number } | undefined;

        if (matchingGoal) {
          const newTotal = matchingGoal.current_amount + amount;
          db.prepare('UPDATE goals SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newTotal, matchingGoal.id);
          db.prepare(`
            INSERT INTO goal_log (user_id, goal_id, change_amount, new_total, source, note, date)
            VALUES (?, ?, ?, ?, 'finance_income', ?, ?)
          `).run(userId, matchingGoal.id, amount, newTotal, `دخل: ${note || category}`, dateToUse);
          goalUpdatedNotice = ` (وتقدم هدف "${matchingGoal.title}" إلى ${newTotal})`;
        }
      }

      const dirLabel = direction === 'income' ? 'دخل' : 'مصروف';
      return {
        actionTaken: true,
        receipt: `${dirLabel}: ${amount} ${currency} — ${category}${note ? ` (${note})` : ''}${goalUpdatedNotice}`,
        data: { success: true, id: financeId, amount, direction, category }
      };
    }

    case 'delete_finance': {
      const { id } = args;
      const existing = db.prepare('SELECT amount, category, note FROM finance WHERE id = ? AND user_id = ?').get(id, userId) as { amount: number; category: string; note: string } | undefined;
      if (!existing) {
        return { actionTaken: false, data: { error: 'القيد غير موجود' } };
      }
      db.prepare('DELETE FROM finance WHERE id = ? AND user_id = ?').run(id, userId);
      return {
        actionTaken: true,
        receipt: `حذف قيد مالي: ${existing.amount} جنيه (${existing.category})`,
        data: { success: true, id }
      };
    }

    case 'log_idea': {
      const { title, description, tags } = args;
      db.prepare(`
        INSERT INTO ideas (user_id, title, description, tags_json, status)
        VALUES (?, ?, ?, ?, 'inbox')
      `).run(userId, title, description || '', JSON.stringify(tags || []));
      return {
        actionTaken: true,
        receipt: `فكرة جديدة: ${title}`,
        data: { success: true, title }
      };
    }

    case 'log_problem': {
      const { title, domain, severity } = args;
      db.prepare(`
        INSERT INTO problems (user_id, title, domain, severity, status)
        VALUES (?, ?, ?, ?, 'active')
      `).run(userId, title, domain || 'أخرى', severity || 'متوسط');
      return {
        actionTaken: true,
        receipt: `تسجيل مشكلة/هم: ${title} (${domain || 'عام'})`,
        data: { success: true, title }
      };
    }

    case 'resolve_problem': {
      const { id, title, resolution } = args;
      if (id) {
        db.prepare(`
          UPDATE problems 
          SET status = 'resolved', resolution = ?, resolved_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ?
        `).run(resolution || 'تم الحل', id, userId);
      } else if (title) {
        db.prepare(`
          UPDATE problems 
          SET status = 'resolved', resolution = ?, resolved_at = CURRENT_TIMESTAMP 
          WHERE user_id = ? AND status = 'active' AND title LIKE ?
        `).run(resolution || 'تم الحل', userId, `%${title}%`);
      }
      return {
        actionTaken: true,
        receipt: `حل مشكلة: ${title || `رقم ${id}`}`,
        data: { success: true }
      };
    }

    case 'upsert_goal': {
      const { title, add_amount, set_current, target_amount, unit } = args;
      const existing = db.prepare('SELECT id, current_amount, target_amount, unit FROM goals WHERE user_id = ? AND title LIKE ?').get(userId, `%${title}%`) as { id: number; current_amount: number; target_amount: number; unit: string } | undefined;

      if (existing) {
        let newCurrent = existing.current_amount;
        if (set_current !== undefined) {
          newCurrent = Number(set_current);
        } else if (add_amount !== undefined) {
          newCurrent += Number(add_amount);
        }
        db.prepare(`
          UPDATE goals 
          SET current_amount = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newCurrent, existing.id);

        db.prepare(`
          INSERT INTO goal_log (user_id, goal_id, change_amount, new_total, source, date)
          VALUES (?, ?, ?, ?, 'agent', ?)
        `).run(userId, existing.id, newCurrent - existing.current_amount, newCurrent, todayStr);

        return {
          actionTaken: true,
          receipt: `تحديث هدف "${title}": ${newCurrent} / ${existing.target_amount} ${existing.unit}`,
          data: { success: true, id: existing.id, current_amount: newCurrent }
        };
      } else {
        const target = target_amount || 100;
        const initialCurrent = set_current || add_amount || 0;
        const goalUnit = unit || 'جنيه';
        const info = db.prepare(`
          INSERT INTO goals (user_id, title, target_amount, current_amount, unit)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, title, target, initialCurrent, goalUnit);

        return {
          actionTaken: true,
          receipt: `إنشاء هدف جديد: ${title} (${initialCurrent}/${target} ${goalUnit})`,
          data: { success: true, id: Number(info.lastInsertRowid) }
        };
      }
    }

    case 'log_metric': {
      const { name, value, unit, daily_target, date } = args;
      const targetDate = date || todayStr;
      
      let metric = db.prepare('SELECT id, unit FROM metrics WHERE user_id = ? AND name LIKE ?').get(userId, `%${name}%`) as { id: number; unit: string } | undefined;
      if (!metric) {
        const info = db.prepare('INSERT INTO metrics (user_id, name, unit, daily_target) VALUES (?, ?, ?, ?)').run(userId, name, unit || 'وحدة', daily_target || 0);
        metric = { id: Number(info.lastInsertRowid), unit: unit || 'وحدة' };
      }

      db.prepare(`
        INSERT INTO metric_logs (user_id, metric_id, date, value)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, metric_id, date) DO UPDATE SET value = excluded.value
      `).run(userId, metric.id, targetDate, Number(value));

      return {
        actionTaken: true,
        receipt: `متتبع: ${name} = ${value} ${metric.unit}`,
        data: { success: true, name, value, date: targetDate }
      };
    }

    case 'log_habit': {
      const { title, action, habit_type, date } = args;
      const targetDate = date || todayStr;

      let habit = db.prepare('SELECT id, streak FROM habits WHERE user_id = ? AND title LIKE ?').get(userId, `%${title}%`) as { id: number; streak: number } | undefined;
      if (!habit) {
        const info = db.prepare('INSERT INTO habits (user_id, title, habit_type, streak) VALUES (?, ?, ?, 1)').run(userId, title, habit_type || 'do');
        habit = { id: Number(info.lastInsertRowid), streak: 1 };
      }

      if (action !== 'define') {
        db.prepare(`
          INSERT INTO habit_logs (user_id, habit_id, date, done)
          VALUES (?, ?, ?, 1)
          ON CONFLICT(user_id, habit_id, date) DO UPDATE SET done = 1
        `).run(userId, habit.id, targetDate);

        // Update streak
        db.prepare('UPDATE habits SET streak = streak + 1 WHERE id = ?').run(habit.id);
      }

      return {
        actionTaken: true,
        receipt: `عادة: ${title} ✓`,
        data: { success: true, title, streak: (habit.streak || 0) + 1 }
      };
    }

    case 'add_task': {
      const { title, date, time, note } = args;
      const targetDate = date || todayStr;
      db.prepare(`
        INSERT INTO tasks (user_id, title, date, time, priority, note)
        VALUES (?, ?, ?, ?, 'medium', ?)
      `).run(userId, title, targetDate, time || null, note || null);

      return {
        actionTaken: true,
        receipt: `مهمة جديدة: ${title}${time ? ` الساعة ${time}` : ''}`,
        data: { success: true, title, date: targetDate }
      };
    }

    case 'complete_task': {
      const { id, title } = args;
      if (id) {
        db.prepare('UPDATE tasks SET completed = 1 WHERE id = ? AND user_id = ?').run(id, userId);
      } else if (title) {
        db.prepare('UPDATE tasks SET completed = 1 WHERE user_id = ? AND title LIKE ?').run(userId, `%${title}%`);
      }
      return {
        actionTaken: true,
        receipt: `إنجاز مهمة: ${title || `رقم ${id}`}`,
        data: { success: true }
      };
    }

    case 'log_health': {
      const { category, body_region, details, severity, date } = args;
      const targetDate = date || todayStr;
      db.prepare(`
        INSERT INTO health (user_id, date, category, body_region, severity, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, targetDate, category, body_region || 'عام', severity || 'متوسط', details);

      return {
        actionTaken: true,
        receipt: `صحة (${category}): ${details} [${body_region || 'عام'}]`,
        data: { success: true, category, details }
      };
    }

    case 'track_condition': {
      const { title, description } = args;
      db.prepare(`
        INSERT INTO conditions (user_id, title, description, start_date, status)
        VALUES (?, ?, ?, ?, 'active')
      `).run(userId, title, description || '', todayStr);

      return {
        actionTaken: true,
        receipt: `متابعة حالة صحية: ${title}`,
        data: { success: true, title }
      };
    }

    case 'log_meal': {
      const { meal_type, description, date } = args;
      const targetDate = date || todayStr;
      db.prepare(`
        INSERT INTO meals (user_id, date, meal_type, description)
        VALUES (?, ?, ?, ?)
      `).run(userId, targetDate, meal_type, description);

      return {
        actionTaken: true,
        receipt: `وجبة ${meal_type}: ${description}`,
        data: { success: true, meal_type, description }
      };
    }

    case 'remember': {
      const { category, key, value } = args;
      db.prepare(`
        INSERT INTO profile_facts (user_id, category, key, value)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, category, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(userId, category, key, value);

      return {
        actionTaken: true,
        receipt: `حفظ في الذاكرة: ${key} = ${value}`,
        data: { success: true, key, value }
      };
    }

    case 'get_data': {
      const { topic, date, from, to } = args;
      let resultData: any = null;

      if (topic === 'day') {
        const queryDate = date || todayStr;
        const entry = db.prepare('SELECT * FROM entries WHERE user_id = ? AND date = ?').get(userId, queryDate);
        const finance = db.prepare('SELECT * FROM finance WHERE user_id = ? AND date = ?').all(userId, queryDate);
        const health = db.prepare('SELECT * FROM health WHERE user_id = ? AND date = ?').all(userId, queryDate);
        const meals = db.prepare('SELECT * FROM meals WHERE user_id = ? AND date = ?').all(userId, queryDate);
        const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? AND date = ?').all(userId, queryDate);
        resultData = { date: queryDate, entry, finance, health, meals, tasks };
      } else if (topic === 'finance') {
        resultData = db.prepare(`SELECT * FROM finance WHERE user_id = ? ORDER BY date DESC LIMIT 20`).all(userId);
      } else if (topic === 'goals') {
        resultData = db.prepare(`SELECT * FROM goals WHERE user_id = ?`).all(userId);
      } else if (topic === 'habits') {
        resultData = db.prepare(`SELECT * FROM habits WHERE user_id = ?`).all(userId);
      } else if (topic === 'tasks') {
        resultData = db.prepare(`SELECT * FROM tasks WHERE user_id = ? AND completed = 0 ORDER BY date ASC`).all(userId);
      } else if (topic === 'health') {
        resultData = db.prepare(`SELECT * FROM health WHERE user_id = ? ORDER BY date DESC LIMIT 15`).all(userId);
      } else if (topic === 'journal') {
        resultData = db.prepare(`SELECT date, summary, mood FROM entries WHERE user_id = ? ORDER BY date DESC LIMIT 10`).all(userId);
      } else if (topic === 'meals') {
        resultData = db.prepare(`SELECT * FROM meals WHERE user_id = ? ORDER BY date DESC LIMIT 10`).all(userId);
      }

      return {
        actionTaken: false,
        data: resultData || { message: 'empty' }
      };
    }

    default:
      return { actionTaken: false, data: { error: `أداة غير معروفة: ${name}` } };
  }
}
