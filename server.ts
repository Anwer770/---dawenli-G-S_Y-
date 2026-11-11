import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabase, db } from './src/server/db.js';
import {
  runDawenliAgent,
  transcribeAudio,
  generateSpeech,
  askDawenli,
  composeCheckin,
  generateComprehensiveReport,
  classifyDocument,
} from './src/server/gemini.js';

dotenv.config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Initialize database schemas and seed data
initDatabase();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Custom session resolution middleware:
// Ensures the user always has an active authenticated session without tedious login screens
app.use((req: Request, _res: Response, next: NextFunction) => {
  let userIdStr = req.cookies?.dawenli_user_id;
  if (!userIdStr) {
    const owner = db.prepare('SELECT id FROM users WHERE is_owner = 1 LIMIT 1').get() as { id: number } | undefined;
    const defaultUser = owner || (db.prepare('SELECT id FROM users LIMIT 1').get() as { id: number } | undefined);
    if (defaultUser) {
      (req as any).userId = defaultUser.id;
    } else {
      (req as any).userId = 1;
    }
  } else {
    (req as any).userId = parseInt(userIdStr, 10) || 1;
  }
  next();
});

// Helper to get current user ID
const getUserId = (req: Request): number => (req as any).userId || 1;

// ==========================================
// 1. Identity & Profile
// ==========================================
app.get('/api/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.prepare('SELECT id, username, display_name, is_owner, created_at FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  res.json(user);
});

app.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT id, username, display_name, is_owner FROM users WHERE username = ? AND password_hash = ?').get(username, password) as any;
  if (!user) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
  res.cookie('dawenli_user_id', user.id.toString(), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
  res.json(user);
});

app.post('/api/logout', (_req: Request, res: Response) => {
  res.clearCookie('dawenli_user_id');
  res.json({ success: true });
});

// ==========================================
// 2. Journal Entries (Merged per day)
// ==========================================
app.get('/api/entries', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { date } = req.query;
  if (date) {
    const entry = db.prepare('SELECT * FROM entries WHERE user_id = ? AND date = ?').get(userId, date);
    return res.json(entry || null);
  }
  const entries = db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(userId);
  res.json(entries);
});

app.post('/api/entries', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { date, full_text, summary, mood, tags } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const tagsJson = JSON.stringify(tags || []);
  const wordCount = (full_text || '').trim().split(/\s+/).filter(Boolean).length;

  const existing = db.prepare('SELECT id, full_text FROM entries WHERE user_id = ? AND date = ?').get(userId, targetDate) as any;
  if (existing) {
    const merged = existing.full_text + '\n\n' + full_text;
    const newCount = merged.trim().split(/\s+/).filter(Boolean).length;
    db.prepare(`
      UPDATE entries 
      SET full_text = ?, summary = COALESCE(?, summary), mood = COALESCE(?, mood), tags_json = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(merged, summary, mood, tagsJson, newCount, existing.id);
    return res.json({ success: true, id: existing.id, date: targetDate, merged: true });
  }

  const info = db.prepare(`
    INSERT INTO entries (user_id, date, full_text, summary, mood, tags_json, word_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, targetDate, full_text, summary || '', mood || 'مرتاح', tagsJson, wordCount);

  res.json({ success: true, id: Number(info.lastInsertRowid), date: targetDate });
});

app.put('/api/entries/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { full_text, summary, mood, tags } = req.body;
  const wordCount = (full_text || '').trim().split(/\s+/).filter(Boolean).length;
  db.prepare(`
    UPDATE entries 
    SET full_text = ?, summary = ?, mood = ?, tags_json = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(full_text, summary, mood, JSON.stringify(tags || []), wordCount, req.params.id, userId);
  res.json({ success: true });
});

app.delete('/api/entries/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ==========================================
// 3. Finance & Budget
// ==========================================
app.get('/api/finance', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { date, month } = req.query;

  let query = 'SELECT * FROM finance WHERE user_id = ?';
  const params: any[] = [userId];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  } else if (month) {
    query += ' AND date LIKE ?';
    params.push(`${month}%`);
  }
  query += ' ORDER BY date DESC, id DESC';

  const rows = db.prepare(query).all(...params) as any[];

  // Totals calculations
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  rows.forEach((r) => {
    if (r.direction === 'income') {
      totalIncome += r.amount;
    } else {
      totalExpenses += r.amount;
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    }
  });

  res.json({
    items: rows,
    stats: {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      categoryTotals,
    },
  });
});

app.post('/api/finance', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { amount, currency, direction, category, note, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const info = db.prepare(`
    INSERT INTO finance (user_id, date, amount, currency, direction, category, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, targetDate, Number(amount), currency || 'جنيه', direction || 'expense', category || 'أخرى', note || '');

  // If income, auto-progress matching goal
  if (direction === 'income') {
    const goal = db.prepare(`SELECT id, current_amount FROM goals WHERE user_id = ? AND (unit = ? OR unit = 'جنيه') LIMIT 1`).get(userId, currency || 'جنيه') as any;
    if (goal) {
      const newTotal = goal.current_amount + Number(amount);
      db.prepare('UPDATE goals SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newTotal, goal.id);
      db.prepare(`
        INSERT INTO goal_log (user_id, goal_id, change_amount, new_total, source, note, date)
        VALUES (?, ?, ?, ?, 'finance_income', ?, ?)
      `).run(userId, goal.id, Number(amount), newTotal, `دخل: ${note || category}`, targetDate);
    }
  }

  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.delete('/api/finance/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM finance WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ==========================================
// 4. Assets & Vault (Gold & Cash)
// ==========================================
app.get('/api/assets', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const assets = db.prepare('SELECT * FROM assets WHERE user_id = ? ORDER BY id DESC').all(userId) as any[];
  
  // Market estimated gold price per gram in EGP (24k ~ 4100, 21k ~ 3600, 18k ~ 3100, 14k ~ 2400)
  const goldPrices: Record<string, number> = {
    '24k': 4150,
    '21k': 3630,
    '18k': 3110,
    '14k': 2420,
  };

  let totalNetWorthEGP = 0;
  const enriched = assets.map((asset) => {
    let currentVal = 0;
    if (asset.type === 'gold') {
      const p = goldPrices[asset.sub_type] || 3600;
      currentVal = asset.amount * p;
      totalNetWorthEGP += currentVal;
    } else if (asset.type === 'cash') {
      if (asset.sub_type === 'USD') {
        currentVal = asset.amount * 50;
      } else if (asset.sub_type === 'EUR') {
        currentVal = asset.amount * 54;
      } else if (asset.sub_type === 'SAR') {
        currentVal = asset.amount * 13.3;
      } else {
        currentVal = asset.amount;
      }
      totalNetWorthEGP += currentVal;
    }
    return { ...asset, estimatedValueEGP: currentVal };
  });

  res.json({ assets: enriched, totalNetWorthEGP, goldPrices });
});

app.post('/api/assets', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { type, sub_type, amount, unit, buy_price, notes } = req.body;
  const info = db.prepare(`
    INSERT INTO assets (user_id, type, sub_type, amount, unit, buy_price, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, type, sub_type, Number(amount), unit || 'gram', Number(buy_price) || 0, notes || '');
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.delete('/api/assets/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM assets WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ==========================================
// 5. Health, Meals & Conditions
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { date } = req.query;
  let query = 'SELECT * FROM health WHERE user_id = ?';
  const params: any[] = [userId];
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  query += ' ORDER BY date DESC, id DESC';
  const records = db.prepare(query).all(...params);
  res.json(records);
});

app.post('/api/health', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { category, body_region, severity, details, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const info = db.prepare(`
    INSERT INTO health (user_id, date, category, body_region, severity, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, targetDate, category || 'ملاحظة', body_region || 'عام', severity || 'متوسط', details);
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.delete('/api/health/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM health WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

app.get('/api/meals', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { date } = req.query;
  let query = 'SELECT * FROM meals WHERE user_id = ?';
  const params: any[] = [userId];
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  query += ' ORDER BY date DESC, id DESC';
  const meals = db.prepare(query).all(...params);
  res.json(meals);
});

app.post('/api/meals', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { meal_type, description, calories, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const info = db.prepare(`
    INSERT INTO meals (user_id, date, meal_type, description, calories)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, targetDate, meal_type || 'وجبة', description, calories ? Number(calories) : null);
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.delete('/api/meals/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

app.get('/api/conditions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const conditions = db.prepare('SELECT * FROM conditions WHERE user_id = ? ORDER BY start_date DESC').all(userId);
  res.json(conditions);
});

app.post('/api/conditions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, description, start_date } = req.body;
  const targetDate = start_date || new Date().toISOString().split('T')[0];
  const info = db.prepare(`
    INSERT INTO conditions (user_id, title, description, start_date, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(userId, title, description || '', targetDate);
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.get('/api/conditions/:id/report', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const condition = db.prepare('SELECT * FROM conditions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!condition) {
    return res.status(404).json({ error: 'الحالة غير موجودة' });
  }

  // Gather health symptoms and meals logged since condition start
  const healthLogs = db.prepare('SELECT date, category, body_region, severity, details FROM health WHERE user_id = ? AND date >= ? ORDER BY date ASC').all(userId, condition.start_date);
  const mealsLogs = db.prepare('SELECT date, meal_type, description FROM meals WHERE user_id = ? AND date >= ? ORDER BY date ASC').all(userId, condition.start_date);

  res.json({
    condition,
    healthLogs,
    mealsLogs,
    generatedDate: new Date().toISOString().split('T')[0],
  });
});

// ==========================================
// 6. Habits & Goals
// ==========================================
app.get('/api/habits', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const todayStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY id ASC').all(userId) as any[];

  // Attach today's done status
  const logs = db.prepare('SELECT habit_id, done FROM habit_logs WHERE user_id = ? AND date = ?').all(userId, todayStr) as any[];
  const doneMap = new Set(logs.filter((l) => l.done).map((l) => l.habit_id));

  const enriched = habits.map((h) => ({
    ...h,
    doneToday: doneMap.has(h.id),
  }));

  res.json(enriched);
});

app.post('/api/habits', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, habit_type, target_days } = req.body;
  const info = db.prepare(`
    INSERT INTO habits (user_id, title, habit_type, target_days, streak)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(user_id, title) DO UPDATE SET target_days = excluded.target_days
  `).run(userId, title, habit_type || 'do', Number(target_days) || 30);
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.post('/api/habits/:id/toggle', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const habitId = req.params.id;
  const todayStr = (req.body.date as string) || new Date().toISOString().split('T')[0];

  const existingLog = db.prepare('SELECT done FROM habit_logs WHERE user_id = ? AND habit_id = ? AND date = ?').get(userId, habitId, todayStr) as { done: number } | undefined;

  let newDone = 1;
  if (existingLog && existingLog.done === 1) {
    newDone = 0;
  }

  db.prepare(`
    INSERT INTO habit_logs (user_id, habit_id, date, done)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, habit_id, date) DO UPDATE SET done = excluded.done
  `).run(userId, habitId, todayStr, newDone);

  // Recalculate streak
  const streakDelta = newDone === 1 ? 1 : -1;
  db.prepare('UPDATE habits SET streak = MAX(0, streak + ?) WHERE id = ? AND user_id = ?').run(streakDelta, habitId, userId);

  const updatedHabit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId) as any;
  res.json({ success: true, done: newDone === 1, habit: { ...updatedHabit, doneToday: newDone === 1 } });
});

app.delete('/api/habits/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  db.prepare('DELETE FROM habit_logs WHERE user_id = ? AND habit_id = ?').run(userId, req.params.id);
  res.json({ success: true });
});

app.get('/api/goals', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY id ASC').all(userId) as any[];
  const enriched = goals.map((g) => {
    const percentage = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
    const history = db.prepare('SELECT * FROM goal_log WHERE user_id = ? AND goal_id = ? ORDER BY id DESC LIMIT 5').all(userId, g.id);
    return { ...g, percentage, history };
  });
  res.json(enriched);
});

app.post('/api/goals', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, target_amount, current_amount, unit, periodicity, deadline } = req.body;
  const info = db.prepare(`
    INSERT INTO goals (user_id, title, target_amount, current_amount, unit, periodicity, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, title, Number(target_amount), Number(current_amount) || 0, unit || 'جنيه', periodicity || 'monthly', deadline || null);
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.put('/api/goals/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { current_amount, target_amount } = req.body;
  const goal = db.prepare('SELECT current_amount FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!goal) return res.status(404).json({ error: 'الهدف غير موجود' });

  const newTotal = Number(current_amount);
  const delta = newTotal - goal.current_amount;
  db.prepare('UPDATE goals SET current_amount = ?, target_amount = COALESCE(?, target_amount), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(newTotal, target_amount ? Number(target_amount) : null, req.params.id, userId);

  if (delta !== 0) {
    db.prepare(`
      INSERT INTO goal_log (user_id, goal_id, change_amount, new_total, source, date)
      VALUES (?, ?, ?, ?, 'manual', ?)
    `).run(userId, req.params.id, delta, newTotal, new Date().toISOString().split('T')[0]);
  }

  res.json({ success: true, current_amount: newTotal });
});

app.delete('/api/goals/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  db.prepare('DELETE FROM goal_log WHERE user_id = ? AND goal_id = ?').run(userId, req.params.id);
  res.json({ success: true });
});

// ==========================================
// 7. Tasks & Metrics
// ==========================================
app.get('/api/tasks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { date } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params: any[] = [userId];
  if (date) {
    query += ' AND (date = ? OR date IS NULL)';
    params.push(date);
  }
  query += ' ORDER BY completed ASC, date ASC, time ASC';
  const tasks = db.prepare(query).all(...params);
  res.json(tasks);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, date, time, priority, note } = req.body;
  const info = db.prepare(`
    INSERT INTO tasks (user_id, title, date, time, priority, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, title, date || null, time || null, priority || 'medium', note || null);
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.put('/api/tasks/:id/toggle', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const task = db.prepare('SELECT completed FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });
  const newStatus = task.completed ? 0 : 1;
  db.prepare('UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?').run(newStatus, req.params.id, userId);
  res.json({ success: true, completed: newStatus === 1 });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

app.get('/api/metrics', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const todayStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const metrics = db.prepare('SELECT * FROM metrics WHERE user_id = ? ORDER BY id ASC').all(userId) as any[];

  const enriched = metrics.map((m) => {
    const todayLog = db.prepare('SELECT value FROM metric_logs WHERE user_id = ? AND metric_id = ? AND date = ?').get(userId, m.id, todayStr) as any;
    const history = db.prepare('SELECT date, value FROM metric_logs WHERE user_id = ? AND metric_id = ? ORDER BY date DESC LIMIT 7').all(userId, m.id);
    return {
      ...m,
      todayValue: todayLog ? todayLog.value : 0,
      history,
    };
  });

  res.json(enriched);
});

app.post('/api/metrics', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { name, unit, daily_target } = req.body;
  const info = db.prepare(`
    INSERT INTO metrics (user_id, name, unit, daily_target)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, name) DO UPDATE SET daily_target = excluded.daily_target, unit = excluded.unit
  `).run(userId, name, unit || 'وحدة', Number(daily_target) || 0);
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.post('/api/metrics/:id/log', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const metricId = req.params.id;
  const { value, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO metric_logs (user_id, metric_id, date, value)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, metric_id, date) DO UPDATE SET value = excluded.value
  `).run(userId, metricId, targetDate, Number(value));
  res.json({ success: true });
});

app.delete('/api/metrics/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM metrics WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  db.prepare('DELETE FROM metric_logs WHERE user_id = ? AND metric_id = ?').run(userId, req.params.id);
  res.json({ success: true });
});

// ==========================================
// 8. Ideas & Problems
// ==========================================
app.get('/api/ideas', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const ideas = db.prepare('SELECT * FROM ideas WHERE user_id = ? ORDER BY id DESC').all(userId);
  res.json(ideas);
});

app.post('/api/ideas', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, description, tags } = req.body;
  const info = db.prepare(`
    INSERT INTO ideas (user_id, title, description, tags_json, status)
    VALUES (?, ?, ?, ?, 'inbox')
  `).run(userId, title, description || '', JSON.stringify(tags || []));
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.post('/api/ideas/:id/convert', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const idea = db.prepare('SELECT * FROM ideas WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!idea) return res.status(404).json({ error: 'الفكرة غير موجودة' });

  // Add task
  const todayStr = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO tasks (user_id, title, date, priority, note)
    VALUES (?, ?, ?, 'medium', ?)
  `).run(userId, idea.title, todayStr, idea.description || null);

  // Update idea status
  db.prepare('UPDATE ideas SET status = "converted" WHERE id = ?').run(idea.id);

  res.json({ success: true, message: 'تم تحويل الفكرة إلى مهمة بنجاح' });
});

app.delete('/api/ideas/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM ideas WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

app.get('/api/problems', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const problems = db.prepare('SELECT * FROM problems WHERE user_id = ? ORDER BY status ASC, id DESC').all(userId);
  res.json(problems);
});

app.post('/api/problems', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, domain, severity } = req.body;
  const info = db.prepare(`
    INSERT INTO problems (user_id, title, domain, severity, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(userId, title, domain || 'أخرى', severity || 'متوسط');
  res.json({ success: true, id: Number(info.lastInsertRowid) });
});

app.put('/api/problems/:id/resolve', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { resolution } = req.body;
  db.prepare(`
    UPDATE problems 
    SET status = 'resolved', resolution = ?, resolved_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?
  `).run(resolution || 'تم التجاوز والحمد لله', req.params.id, userId);
  res.json({ success: true });
});

app.delete('/api/problems/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM problems WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ==========================================
// 9. Profile Facts (Permanent Memory)
// ==========================================
app.get('/api/profile', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const facts = db.prepare('SELECT * FROM profile_facts WHERE user_id = ? ORDER BY category ASC, id ASC').all(userId);
  res.json(facts);
});

app.post('/api/profile', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { category, key, value } = req.body;
  db.prepare(`
    INSERT INTO profile_facts (user_id, category, key, value)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, category, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(userId, category || 'هوية', key, value);
  res.json({ success: true });
});

app.delete('/api/profile/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM profile_facts WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ==========================================
// 10. Notifications
// ==========================================
app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(userId);
  res.json(notifs);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ==========================================
// 11. AI Core Operations (Agent, Voice, Ask, Check-in, Reports)
// ==========================================
app.post('/api/ai/log', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { text, date } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال نص أو تسجيل صوتي' });
    }

    const result = await runDawenliAgent(userId, text.trim(), date);
    res.json(result);
  } catch (err: any) {
    console.error('Agent execution error:', err);
    res.status(500).json({
      error: 'حدث خطأ أثناء معالجة التدوين بواسطة الذكاء الاصطناعي',
      details: err?.message || String(err),
    });
  }
});

app.post('/api/ai/voice', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    let base64Audio = '';
    let mimeType = 'audio/webm';

    if (req.file) {
      base64Audio = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audioBase64) {
      base64Audio = req.body.audioBase64;
      mimeType = req.body.mimeType || 'audio/webm';
    } else {
      return res.status(400).json({ error: 'لم يتم استلام أي ملف صوتي' });
    }

    // Step 1: Transcribe audio with gemini-3.5-transcribe
    const transcript = await transcribeAudio(base64Audio, mimeType);
    if (!transcript) {
      return res.json({
        transcript: '',
        reply: 'لم أتمكن من سماع الصوت بوضوح، يرجى المحاولة مرة أخرى أو الكتابة.',
        receipts: [],
      });
    }

    // Step 2: Feed transcript into Dawenli agent loop
    const result = await runDawenliAgent(userId, transcript, req.body.date);
    res.json({
      transcript,
      ...result,
    });
  } catch (err: any) {
    console.error('Voice processing error:', err);
    res.status(500).json({
      error: 'حدث خطأ أثناء تفريغ ومعالجة التسجيل الصوتي',
      details: err?.message || String(err),
    });
  }
});

app.post('/api/ai/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'النص مطلوب لتوليد الصوت' });
    }

    const audioBuffer = await generateSpeech(text);
    if (!audioBuffer) {
      return res.status(500).json({ error: 'تعذر توليد الصوت' });
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'فشل توليد الصوت', details: err?.message });
  }
});

app.post('/api/ai/ask', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { question, scope, isVoiceCall } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'السؤال مطلوب' });
    }

    const answer = await askDawenli(userId, question, scope || 'all', !!isVoiceCall);
    res.json({ answer });
  } catch (err: any) {
    console.error('Ask Dawenli error:', err);
    res.status(500).json({ error: 'تعذر إتمام الاستفسار', details: err?.message });
  }
});

app.post('/api/ai/checkin', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const checkin = await composeCheckin(userId);
    
    // Store in notifications bell
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'checkin')
    `).run(userId, checkin.title, checkin.message);

    res.json(checkin);
  } catch (err: any) {
    console.error('Checkin composition error:', err);
    res.status(500).json({ error: 'تعذر إنشاء التأمل اليومي', details: err?.message });
  }
});

app.post('/api/ai/report', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.body.days, 10) || 7;
    const reportMarkdown = await generateComprehensiveReport(userId, days);
    res.json({ report: reportMarkdown, days });
  } catch (err: any) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'تعذر إنشاء التقرير التحليلي', details: err?.message });
  }
});

app.post('/api/ai/classify-file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'الملف مطلوب' });
    }
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const classification = await classifyDocument(base64, mimeType);
    res.json(classification);
  } catch (err: any) {
    console.error('Classification error:', err);
    res.status(500).json({ error: 'تعذر تصنيف المستند', details: err?.message });
  }
});

app.get('/api/ai/usage', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const rows = db.prepare('SELECT * FROM ai_usage WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(userId);
  const totals = db.prepare('SELECT SUM(total_tokens) as totalTokens, SUM(estimated_cost) as totalCost FROM ai_usage WHERE user_id = ?').get(userId) as any;
  res.json({
    logs: rows,
    totals: {
      totalTokens: totals?.totalTokens || 0,
      totalCost: totals?.totalCost || 0,
    },
  });
});

// ==========================================
// Vite Middleware & Static Setup
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌿 Dawenli server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
});
