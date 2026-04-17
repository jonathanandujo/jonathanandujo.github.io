import React, { useState, useMemo } from 'react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayNameFromDate(d) {
  return DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthStartDay(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

function getProgressForDate(date, schedule, activeDays, completions) {
  const dayName = dayNameFromDate(date);
  const isTrainingDay = activeDays.includes(dayName);
  if (!isTrainingDay) return { type: 'rest', scheduled: 0, completed: 0, pct: 0 };
  const scheduled = (schedule[dayName] || []).length;
  if (scheduled === 0) return { type: 'rest', scheduled: 0, completed: 0, pct: 0 };
  const key = dateKey(date);
  const done = (completions[key] || []).length;
  const pct = Math.round((done / scheduled) * 100);
  return { type: 'training', scheduled, completed: done, pct };
}

function computeStreak(schedule, activeDays, completions) {
  let streak = 0;
  const d = new Date();
  // Start from yesterday (today might be in progress)
  d.setDate(d.getDate() - 1);
  while (true) {
    const info = getProgressForDate(d, schedule, activeDays, completions);
    if (info.type === 'rest') {
      d.setDate(d.getDate() - 1);
      continue;
    }
    if (info.pct === 100) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
    if (streak > 365) break;
  }
  // Check today too
  const todayInfo = getProgressForDate(new Date(), schedule, activeDays, completions);
  if (todayInfo.type === 'training' && todayInfo.pct === 100) streak++;
  return streak;
}

function computeMonthStats(year, month, schedule, activeDays, completions) {
  const days = getDaysInMonth(year, month);
  let trainingDays = 0;
  let completedDays = 0;
  let totalPct = 0;
  for (let i = 1; i <= days; i++) {
    const d = new Date(year, month, i);
    if (d > new Date()) break;
    const info = getProgressForDate(d, schedule, activeDays, completions);
    if (info.type === 'training') {
      trainingDays++;
      totalPct += info.pct;
      if (info.pct === 100) completedDays++;
    }
  }
  return {
    trainingDays,
    completedDays,
    avgCompletion: trainingDays > 0 ? Math.round(totalPct / trainingDays) : 0,
  };
}

function computeWeeklyData(schedule, activeDays, completions) {
  const weeks = [];
  const today = new Date();
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1 - w * 7);
    let total = 0;
    let done = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      if (day > today) break;
      const info = getProgressForDate(day, schedule, activeDays, completions);
      if (info.type === 'training') {
        total += info.scheduled;
        done += info.completed;
      }
    }
    const label = `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
    weeks.push({ label, pct: total > 0 ? Math.round((done / total) * 100) : 0, total, done });
  }
  return weeks;
}

function pctColor(pct, isTraining) {
  if (!isTraining) return 'transparent';
  if (pct === 0) return '#fee2e2';
  if (pct < 50) return '#fed7aa';
  if (pct < 100) return '#bbf7d0';
  return '#4ade80';
}

export default function ProgressView({ schedule, activeDays, completions }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const streak = useMemo(
    () => computeStreak(schedule, activeDays, completions),
    [schedule, activeDays, completions]
  );

  const monthStats = useMemo(
    () => computeMonthStats(viewYear, viewMonth, schedule, activeDays, completions),
    [viewYear, viewMonth, schedule, activeDays, completions]
  );

  const weeklyData = useMemo(
    () => computeWeeklyData(schedule, activeDays, completions),
    [schedule, activeDays, completions]
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDay = getMonthStartDay(viewYear, viewMonth);

  const calendarCells = useMemo(() => {
    const cells = [];
    const todayStr = dateKey(today);
    // Empty cells before month start
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateStr = dateKey(date);
      const isToday = dateStr === todayStr;
      const isFuture = !isToday && date > today;
      const info = isFuture
        ? { type: 'future', pct: 0, scheduled: 0, completed: 0 }
        : getProgressForDate(date, schedule, activeDays, completions);
      cells.push({ day: d, ...info, isFuture, isToday });
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, daysInMonth, startDay, schedule, activeDays, completions]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const goToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="progress-view">
      {/* ── Stats Cards ──────────────────── */}
      <div className="pv-stats">
        <div className="pv-stat-card streak">
          <span className="pv-stat-value">{streak}</span>
          <span className="pv-stat-label">Day Streak</span>
        </div>
        <div className="pv-stat-card completed">
          <span className="pv-stat-value">{monthStats.completedDays}/{monthStats.trainingDays}</span>
          <span className="pv-stat-label">Days Complete</span>
        </div>
        <div className="pv-stat-card avg">
          <span className="pv-stat-value">{monthStats.avgCompletion}%</span>
          <span className="pv-stat-label">Avg Completion</span>
        </div>
      </div>

      {/* ── Weekly Trend ─────────────────── */}
      <div className="pv-weekly">
        <h3>Weekly Trend</h3>
        <div className="pv-weekly-bars">
          {weeklyData.map((w, i) => (
            <div key={i} className="pv-week-col">
              <div className="pv-bar-track">
                <div
                  className="pv-bar-fill"
                  style={{ height: `${Math.max(w.pct, 4)}%` }}
                  title={`${w.pct}% — ${w.done}/${w.total} exercises`}
                />
              </div>
              <span className="pv-bar-pct">{w.pct}%</span>
              <span className="pv-bar-label">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Calendar ─────────────────────── */}
      <div className="pv-calendar">
        <div className="pv-cal-nav">
          <button onClick={prevMonth} className="pv-cal-arrow">‹</button>
          <h3 className="pv-cal-title">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
          <button onClick={nextMonth} className="pv-cal-arrow">›</button>
          {!isCurrentMonth && (
            <button onClick={goToday} className="pv-cal-today-btn">Today</button>
          )}
        </div>

        <div className="pv-legend">
          <span className="pv-legend-item"><span className="pv-dot" style={{ background: '#e5e7eb' }} /> Rest</span>
          <span className="pv-legend-item"><span className="pv-dot" style={{ background: '#fee2e2' }} /> 0%</span>
          <span className="pv-legend-item"><span className="pv-dot" style={{ background: '#fed7aa' }} /> 1–49%</span>
          <span className="pv-legend-item"><span className="pv-dot" style={{ background: '#bbf7d0' }} /> 50–99%</span>
          <span className="pv-legend-item"><span className="pv-dot" style={{ background: '#4ade80' }} /> 100%</span>
        </div>

        <div className="pv-cal-grid">
          {DAY_LABELS.map((d) => (
            <div key={d} className="pv-cal-hdr">{d}</div>
          ))}
          {calendarCells.map((cell, i) =>
            cell === null ? (
              <div key={`e${i}`} className="pv-cal-cell empty" />
            ) : (
              <div
                key={cell.day}
                className={`pv-cal-cell ${cell.isFuture ? 'future' : ''} ${cell.isToday ? 'today' : ''} ${cell.type}`}
                title={
                  cell.isFuture
                    ? ''
                    : cell.type === 'rest'
                    ? 'Rest day'
                    : `${cell.completed}/${cell.scheduled} (${cell.pct}%)`
                }
              >
                <span className="pv-cal-day">{cell.day}</span>
                {cell.type === 'training' && !cell.isFuture && (
                  <span
                    className="pv-cal-dot"
                    style={{ background: pctColor(cell.pct, true) }}
                  >
                    {cell.pct === 100 && '✓'}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
