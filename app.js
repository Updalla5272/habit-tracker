const API = '/api';
let challenge = null;
let currentDay = 1;
let habits = [];

const dayInfo = document.getElementById('dayInfo');
const overallBar = document.getElementById('overallBar');
const dayInput = document.getElementById('dayInput');
const habitList = document.getElementById('habitList');
const statsList = document.getElementById('statsList');

async function loadChallenge() {
  const res = await fetch(`${API}/challenge`);
  challenge = await res.json();
  currentDay = challenge.current_day;
  dayInput.value = currentDay;
  dayInput.max = challenge.total_days;
  render();
}

async function loadHabits() {
  const res = await fetch(`${API}/habits`);
  habits = await res.json();
}

function dateForDay(dayNumber) {
  const start = new Date(challenge.start_date);
  start.setDate(start.getDate() + (dayNumber - 1));
  return start.toISOString().slice(0, 10);
}

async function render() {
  await loadHabits();
  const date = dateForDay(currentDay);
  dayInfo.textContent = `Day ${currentDay} of ${challenge.total_days} — ${date}`;
  overallBar.style.width = `${(currentDay / challenge.total_days) * 100}%`;

  const res = await fetch(`${API}/checkins/${currentDay}`);
  const checkins = await res.json();
  const doneMap = {};
  checkins.forEach(c => { doneMap[c.habit_id] = !!c.done; });

  habitList.innerHTML = '';
  habits.forEach(h => {
    const isDone = !!doneMap[h.id];
    const card = document.createElement('div');
    card.className = 'habit-card' + (isDone ? ' done' : '');
    card.innerHTML = `
      <div class="habit-left">
        <span class="habit-icon">${h.icon}</span>
        <span class="habit-name">${h.name}</span>
      </div>
      <div>
        <button class="check-btn${isDone ? ' done' : ''}" data-id="${h.id}">✓</button>
        <button class="del-btn" data-del="${h.id}">✕</button>
      </div>
    `;
    habitList.appendChild(card);
  });

  document.querySelectorAll('.check-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const nowDone = !btn.classList.contains('done');
      await fetch(`${API}/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: id, day_number: currentDay, date, done: nowDone })
      });
      render();
    });
  });

  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this habit?')) return;
      await fetch(`${API}/habits/${btn.dataset.del}`, { method: 'DELETE' });
      render();
    });
  });

  renderStats();
}

async function renderStats() {
  const res = await fetch(`${API}/stats`);
  const stats = await res.json();
  statsList.innerHTML = stats.map(s => `
    <div class="stat-row">
      <span>${s.icon} ${s.name}</span>
      <span>${s.completed_days}/${challenge.total_days} days — <span class="streak">🔥 ${s.current_streak}</span></span>
    </div>
  `).join('');
}

document.getElementById('prevDay').onclick = () => {
  currentDay = Math.max(1, currentDay - 1);
  dayInput.value = currentDay;
  render();
};
document.getElementById('nextDay').onclick = () => {
  currentDay = Math.min(challenge.total_days, currentDay + 1);
  dayInput.value = currentDay;
  render();
};
document.getElementById('todayBtn').onclick = () => {
  currentDay = challenge.current_day;
  dayInput.value = currentDay;
  render();
};
dayInput.onchange = () => {
  currentDay = Math.min(challenge.total_days, Math.max(1, Number(dayInput.value)));
  render();
};

document.getElementById('addHabitBtn').onclick = async () => {
  const name = document.getElementById('newHabitName').value.trim();
  const icon = document.getElementById('newHabitIcon').value.trim() || '⭐';
  if (!name) return;
  await fetch(`${API}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon })
  });
  document.getElementById('newHabitName').value = '';
  document.getElementById('newHabitIcon').value = '';
  render();
};

loadChallenge();
