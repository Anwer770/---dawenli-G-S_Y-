import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'dawenli.db');
export const db = new Database(DB_PATH);

// Configure SQLite for high performance and durability
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// Initialize the 28 tables defined in the PRD
export function initDatabase() {
  db.exec(`
    -- 1. Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      is_owner INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Admins
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Push Subscriptions
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      keys_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      data_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Entries (Daily merged journal)
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      full_text TEXT NOT NULL,
      summary TEXT,
      mood TEXT,
      tags_json TEXT,
      word_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    -- 6. Conversations (Agent turns)
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls_json TEXT,
      tool_results_json TEXT,
      audio_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Ask Messages (Ask Dawenli chat)
    CREATE TABLE IF NOT EXISTS ask_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      scope TEXT DEFAULT 'all',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Finance (Income and Expenses)
    CREATE TABLE IF NOT EXISTS finance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'جنيه',
      direction TEXT NOT NULL, -- 'expense' | 'income'
      category TEXT NOT NULL,  -- أكل, مواصلات, فواتير, صحة, تسوق, ترفيه, بيت, شغل, تعليم, أخرى
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Finance Budget
    CREATE TABLE IF NOT EXISTS finance_budget (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month TEXT NOT NULL, -- 'YYYY-MM'
      category TEXT NOT NULL,
      monthly_budget REAL DEFAULT 0,
      monthly_target REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, month, category)
    );

    -- 10. Assets (Gold, Cash, etc.)
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'gold' | 'cash' | 'other'
      sub_type TEXT NOT NULL, -- '24k' | '21k' | '18k' | '14k' | 'EGP' | 'USD' | etc.
      amount REAL NOT NULL,
      unit TEXT NOT NULL, -- 'gram' | 'currency' | 'piece'
      buy_price REAL DEFAULT 0,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Asset Market Prices
    CREATE TABLE IF NOT EXISTS asset_market (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL, -- 'gold_24k', 'usd_egp', etc.
      price REAL NOT NULL,
      currency TEXT DEFAULT 'EGP',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Health
    CREATE TABLE IF NOT EXISTS health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL, -- 'عرض' | 'دواء' | 'نوم' | 'تمرين' | 'نفسية' | 'ملاحظة'
      body_region TEXT DEFAULT 'عام', -- 'راس' | 'صدر' | 'معدة' | 'بطن' | 'ذراعين' | 'ساقين' | 'عام'
      severity TEXT DEFAULT 'متوسط',
      details TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Meals
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL, -- 'فطار' | 'غدا' | 'عشا' | 'سناك' | 'مشروب'
      description TEXT NOT NULL,
      calories INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. Conditions (Follow-up cases)
    CREATE TABLE IF NOT EXISTS conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT DEFAULT 'active', -- 'active' | 'resolved'
      doctor_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 15. Habits
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      habit_type TEXT DEFAULT 'do', -- 'do' | 'quit'
      frequency TEXT DEFAULT 'daily',
      streak INTEGER DEFAULT 0,
      target_days INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, title)
    );

    -- 16. Habit Logs
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      done INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, habit_id, date)
    );

    -- 17. Goals
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      unit TEXT NOT NULL, -- 'جنيه' | 'كتاب' | 'كيلو' | 'ساعة'
      periodicity TEXT DEFAULT 'monthly', -- 'weekly' | 'monthly' | 'fixed_date'
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 18. Goal Log
    CREATE TABLE IF NOT EXISTS goal_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_id INTEGER NOT NULL,
      change_amount REAL NOT NULL,
      new_total REAL NOT NULL,
      source TEXT DEFAULT 'manual', -- 'finance_income' | 'manual' | 'agent'
      note TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 19. Metrics (Daily trackers)
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL, -- 'ساعات عمل', 'خطوات', 'شرب مية', 'قراءة'
      unit TEXT NOT NULL, -- 'ساعة', 'خطوة', 'لتر', 'صفحة'
      daily_target REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name)
    );

    -- 20. Metric Logs
    CREATE TABLE IF NOT EXISTS metric_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      metric_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      value REAL NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, metric_id, date)
    );

    -- 21. Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date TEXT, -- YYYY-MM-DD or null
      time TEXT, -- HH:MM or null
      completed INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'medium',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 22. Ideas (Inbox)
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tags_json TEXT,
      status TEXT DEFAULT 'inbox', -- 'inbox' | 'converted' | 'archived'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 23. Thoughts
    CREATE TABLE IF NOT EXISTS thoughts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      text TEXT NOT NULL,
      mood TEXT,
      tags_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 24. Problems & Worries
    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      domain TEXT DEFAULT 'أخرى', -- 'شغل' | 'صحة' | 'علاقات' | 'نفسي' | 'فلوس' | 'أخرى'
      severity TEXT DEFAULT 'متوسط',
      status TEXT DEFAULT 'active', -- 'active' | 'resolved'
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    -- 25. Files & Attachments
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      category TEXT DEFAULT 'مستند', -- 'دواء' | 'روشتة' | 'تحليل' | 'أشعة' | 'فاتورة' | 'مستند' | 'أخرى'
      description TEXT,
      mime_type TEXT,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 26. Profile Facts (Permanent memory about user)
    CREATE TABLE IF NOT EXISTS profile_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL, -- 'هوية' | 'صحة' | 'شغل' | 'علاقات' | 'تفضيلات'
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category, key)
    );

    -- 27. AI Usage & Token Tracking
    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      model TEXT NOT NULL,
      prompt_tokens INTEGER DEFAULT 0,
      candidate_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      estimated_cost REAL DEFAULT 0,
      operation TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 28. App Settings
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure default owner user exists so the applet is immediately ready to use
  const ownerUser = db.prepare('SELECT * FROM users WHERE is_owner = 1 LIMIT 1').get() as { id: number } | undefined;
  if (!ownerUser) {
    const defaultUserStmt = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, is_owner)
      VALUES (?, ?, ?, 1)
    `);
    const info = defaultUserStmt.run('demo', 'dawenli123', 'صديق دوّنلي');
    const newUserId = Number(info.lastInsertRowid);
    seedInitialDemoData(newUserId);
  }
}

// Seed realistic demo data matching the PRD scenarios
function seedInitialDemoData(userId: number) {
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().split('T')[0];

  // Profile facts
  const insertFact = db.prepare(`INSERT OR IGNORE INTO profile_facts (user_id, category, key, value) VALUES (?, ?, ?, ?)`);
  insertFact.run(userId, 'هوية', 'الاسم', 'صديق دوّنلي');
  insertFact.run(userId, 'هوية', 'الجنسية', 'مصري');
  insertFact.run(userId, 'هوية', 'العملات', 'الجنيه المصري والدولار');
  insertFact.run(userId, 'شغل', 'المجال', 'برمجة وتصميم منتجات رقمية');
  insertFact.run(userId, 'صحة', 'حالة مزمنة', 'حساسية جيوب أنفية موسمية');

  // Habits
  const insertHabit = db.prepare(`INSERT OR IGNORE INTO habits (user_id, title, habit_type, streak) VALUES (?, ?, ?, ?)`);
  insertHabit.run(userId, 'رياضة ومشي', 'do', 6);
  insertHabit.run(userId, 'قراءة 20 صفحة', 'do', 12);
  insertHabit.run(userId, 'شرب 2 لتر ماء', 'do', 4);
  insertHabit.run(userId, 'السهر بعد 12', 'quit', 5);

  // Goals
  const insertGoal = db.prepare(`INSERT INTO goals (user_id, title, target_amount, current_amount, unit, periodicity, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertGoal.run(userId, 'توفير للطوارئ والادخار', 50000, 28400, 'جنيه', 'monthly', '2026-12-31');
  insertGoal.run(userId, 'قراءة 15 كتاب في السنة', 15, 9, 'كتاب', 'yearly', '2026-12-31');
  insertGoal.run(userId, 'خسارة 4 كيلو وزن صحي', 4, 2.5, 'كيلو', 'monthly', '2026-12-15');

  // Metrics
  const insertMetric = db.prepare(`INSERT OR IGNORE INTO metrics (user_id, name, unit, daily_target) VALUES (?, ?, ?, ?)`);
  insertMetric.run(userId, 'ساعات عمل عميق', 'ساعة', 6);
  insertMetric.run(userId, 'عدد الخطوات', 'خطوة', 8000);
  insertMetric.run(userId, 'لترات الماء', 'لتر', 2.5);

  // Finance today and yesterday
  const insertFinance = db.prepare(`INSERT INTO finance (user_id, date, amount, currency, direction, category, note) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertFinance.run(userId, yesterday, 180, 'جنيه', 'expense', 'أكل', 'غدا مشاوي مع زملاء العمل');
  insertFinance.run(userId, yesterday, 45, 'جنيه', 'expense', 'مواصلات', 'أوبر للمكتب');
  insertFinance.run(userId, today, 85, 'جنيه', 'expense', 'أكل', 'فطار صحي وقهوة صباحية');
  insertFinance.run(userId, today, 250, 'جنيه', 'expense', 'تسوق', 'مستلزمات مكتبية ودفتر تدوين');
  insertFinance.run(userId, yesterday, 6500, 'جنيه', 'income', 'شغل', 'دفعة مشروع تصميم وتطوير');

  // Tasks
  const insertTask = db.prepare(`INSERT INTO tasks (user_id, title, date, time, completed, priority, note) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertTask.run(userId, 'مراجعة التصاميم النهائية مع الفريق', today, '15:00', 0, 'high', 'تسليم النسخة للمراجعة');
  insertTask.run(userId, 'حجز موعد طبيب الأسنان الدوري', today, '18:30', 0, 'medium', 'فحص دوري');
  insertTask.run(userId, 'قراءة فصل من كتاب العادات الذرية', today, null, 1, 'low', 'تمت أثناء المساء');

  // Health
  const insertHealth = db.prepare(`INSERT INTO health (user_id, date, category, body_region, severity, details) VALUES (?, ?, ?, ?, ?, ?)`);
  insertHealth.run(userId, today, 'تمرين', 'عام', 'خفيف', 'مشي سريع لمدة 35 دقيقة في الحديقة');
  insertHealth.run(userId, today, 'نفسية', 'راس', 'خفيف', 'صفاء ذهني وطاقة إيجابية جيدة بعد الصباح');
  insertHealth.run(userId, yesterday, 'عرض', 'راس', 'متوسط', 'صداع إجهاد خفيف في نهاية اليوم، تحسن مع شرب الماء');

  // Meals
  const insertMeal = db.prepare(`INSERT INTO meals (user_id, date, meal_type, description, calories) VALUES (?, ?, ?, ?, ?)`);
  insertMeal.run(userId, today, 'فطار', 'بيض مسلوق + خبز أسمر + شرائح خيار وجبن قريش + شاي أخضر', 380);
  insertMeal.run(userId, yesterday, 'غدا', 'صدور دجاج مشوية مع أرز بني وسلطة خضراء', 620);

  // Journal entry
  const insertEntry = db.prepare(`INSERT OR IGNORE INTO entries (user_id, date, full_text, summary, mood, tags_json, word_count) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertEntry.run(
    userId,
    yesterday,
    'يوم productive جدًا، مشيت نص ساعة الصبح واشتغلت على مشروع التصميم واستلمت دفعة الشغل. حسيت بصداع خفيف العصر بس نمت كويس والحمد لله ارتحت.',
    'إنجاز عمل ممتاز مع مشي وراحة كافية',
    'مرتاح',
    JSON.stringify(['شغل', 'رياضة', 'إنتاجية']),
    32
  );

  // Assets (Gold & Cash)
  const insertAsset = db.prepare(`INSERT INTO assets (user_id, type, sub_type, amount, unit, buy_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertAsset.run(userId, 'gold', '21k', 35, 'gram', 3600, 'سبيكة ذهب عيار 21 للادخار طويل الأجل');
  insertAsset.run(userId, 'cash', 'EGP', 45000, 'currency', 1, 'حساب البنك الجاري');
  insertAsset.run(userId, 'cash', 'USD', 1200, 'currency', 50, 'مدخرات بالعملة الصعبة');

  // Ideas & Problems
  const insertIdea = db.prepare(`INSERT INTO ideas (user_id, title, description, tags_json, status) VALUES (?, ?, ?, ?, ?)`);
  insertIdea.run(userId, 'إطلاق نشرة بريدية أسبوعية عن عادات النجاح', 'كتابة ملخصات مركزة للمهتمين بالتطوير الشخصي كل سبت', JSON.stringify(['محتوى', 'أفكار']), 'inbox');

  const insertProblem = db.prepare(`INSERT INTO problems (user_id, title, domain, severity, status) VALUES (?, ?, ?, ?, ?)`);
  insertProblem.run(userId, 'تشتت الانتباه بسبب إشعارات الهاتف أثناء ساعات التركيز', 'شغل', 'متوسط', 'active');

  // Notifications
  const insertNotification = db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`);
  insertNotification.run(userId, 'مرحبًا بك في دوّنلي 🌿', 'رفيقك الشخصي مستعد لسماع يومك بالصوت أو النص. جرّب تسجّل أو تكتب اللي حصل النهاردة!', 'checkin');
}
