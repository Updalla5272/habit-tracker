# 100 Days Challenge — Habit Tracker

Full stack app: **Frontend** (HTML/CSS/JS) + **Backend** (Node.js/Express) + **Database** (SQLite).

Preloaded habits: No masturbation, No scrolling, Finish A+, Finish Python, Revise university lessons.
Challenge start date: 2026-09-15, 100 days. You can add/remove habits anytime with your own icons.

## 1. Run it locally
```
npm install
npm start
```
Open http://localhost:3000

## 2. Put it online 24/7 (free)
So you can check it from your phone anywhere, deploy to **Render.com**:

1. Create a free GitHub account (if you don't have one) and push this folder as a new repo.
2. Go to render.com → New → Web Service → connect your GitHub repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Deploy. Render gives you a free public URL (e.g. `https://your-tracker.onrender.com`) that stays online — open it from your phone or laptop, any time, from anywhere.

(Railway.app or Fly.io work the same way if you prefer those.)

## 3. How the data is structured (Database)
- `challenge` — start date + total days (100)
- `habits` — id, name, icon
- `checkins` — one row per habit per day (done = 0/1)

This means your daily check marks are permanently saved server-side — not just in your browser — so the same data shows up wherever you log in.

## 4. Using it
- Shows "Day X of 100" automatically based on today's date vs. start date.
- Tap ✓ to mark a habit done for that day.
- Use Prev/Next or type a day number to review or backfill past days.
- Stats section shows total completed days + current streak per habit.
- Add Habit box lets you add any new habit with an emoji icon.
