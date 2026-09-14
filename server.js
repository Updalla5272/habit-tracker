// server.js — Backend (Node.js + Express + SQLite)
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const db = new Database(path.join(__dirname, 'tracker.db'));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- DATABASE SETUP ----------
db.exec(`
CREATE TABLE IF NOT EXISTS challenge (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  start_date TEXT NOT NULL,
  total_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⭐',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  date TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  UNIQUE(habit_id, day_number),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);
`);

// Seed challenge (100 days starting 2026-09-15) if not present
const existingChallenge = db.prepare('SELECT * FROM challenge WHERE id = 1').get();
if (!existingChallenge) {
  db.prepare('INSERT INTO challenge (id, start_date, total_days) VALUES (1, ?, 100)').run('2026-09-15');
}

// Seed default habits if table empty
const habitCount = db.prepare('SELECT COUNT(*) AS c FROM habits').get().c;
if (habitCount === 0) {
  const defaults = [
    ['No masturbation', '🚫'],
    ['No scrolling', '📵'],
    ['Finish A+', '💻'],
    ['Finish Python', '🐍'],
    ['Revise university lessons', '📚'],
  ];
  const insert = db.prepare('INSERT INTO habits (name, icon) VALUES (?, ?)');
  defaults.forEach(([name, icon]) => insert.run(name, icon));
}

// ---------- API ROUTES ----------

// Get challenge info (start date, total days, current day number)
app.get('/api/challenge', (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenge WHERE id = 1').get();
  const start = new Date(challenge.start_date);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / 86400000) + 1;
  res.json({ ...challenge, current_day: Math.max(1, Math.min(diffDays, challenge.total_days)) });
});

// Get all habits
app.get('/api/habits', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits ORDER BY id').all();
  res.json(habits);
});

// Add a new habit
app.post('/api/habits', (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO habits (name, icon) VALUES (?, ?)').run(name, icon || '⭐');
  res.json({ id: result.lastInsertRowid, name, icon: icon || '⭐' });
});

// Delete a habit
app.delete('/api/habits/:id', (req, res) => {
  db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get all checkins for a given day number (1-100)
app.get('/api/checkins/:day', (req, res) => {
  const day = Number(req.params.day);
  const rows = db.prepare('SELECT * FROM checkins WHERE day_number = ?').all(day);
  res.json(rows);
});

// Toggle a checkin (mark habit done/undone for a specific day)
app.post('/api/checkins', (req, res) => {
  const { habit_id, day_number, date, done } = req.body;
  db.prepare(`
    INSERT INTO checkins (habit_id, day_number, date, done)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(habit_id, day_number) DO UPDATE SET done = excluded.done, date = excluded.date
  `).run(habit_id, day_number, date, done ? 1 : 0);
  res.json({ success: true });
});

// Get full progress grid (all habits x all days) for stats/history view
app.get('/api/progress', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits ORDER BY id').all();
  const checkins = db.prepare('SELECT * FROM checkins').all();
  res.json({ habits, checkins });
});

// Get streak + completion stats per habit
app.get('/api/stats', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits ORDER BY id').all();
  const stats = habits.map(h => {
    const rows = db.prepare('SELECT day_number, done FROM checkins WHERE habit_id = ? ORDER BY day_number').all(h.id);
    const doneCount = rows.filter(r => r.done).length;
    // current streak counted backward from the latest completed consecutive day
    let streak = 0;
    const doneDays = new Set(rows.filter(r => r.done).map(r => r.day_number));
    let d = Math.max(...rows.map(r => r.day_number), 0);
    while (d > 0 && doneDays.has(d)) { streak++; d--; }
    return { habit_id: h.id, name: h.name, icon: h.icon, completed_days: doneCount, current_streak: streak };
  });
  res.json(stats);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Habit tracker running on port ${PORT}`));
