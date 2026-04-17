import React from 'react';
import exerciseData from './exerciseData';

function findExercise(exerciseId) {
  for (const cat of exerciseData) {
    const ex = cat.exercises.find((e) => e.id === exerciseId);
    if (ex) return { ...ex, categoryIcon: cat.icon, categoryName: cat.name };
  }
  return null;
}

export default function TodayView({ getTodayExercises, getTodayCompletions, toggleCompletion, todayDayName }) {
  const exercises = getTodayExercises();
  const completions = getTodayCompletions();
  const completed = completions.length;
  const total = exercises.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="today-view">
      <h2>Today — {todayDayName}</h2>

      {total === 0 ? (
        <div className="today-empty">
          <p>No exercises scheduled for today.</p>
          <p className="today-hint">Go to the <strong>Routine Builder</strong> tab to toggle your training days and add exercises.</p>
        </div>
      ) : (
        <>
          <div className="today-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">{completed}/{total} completed ({progress}%)</span>
          </div>

          <div className="today-list">
            {exercises.map((entry) => {
              const ex = findExercise(entry.exerciseId);
              if (!ex) return null;
              const done = completions.includes(entry.exerciseId);
              return (
                <div
                  key={entry.exerciseId}
                  className={`today-exercise ${done ? 'done' : ''}`}
                  onClick={() => toggleCompletion(entry.exerciseId)}
                >
                  <div className="today-check">{done ? '✅' : '⬜'}</div>
                  <div className="today-info">
                    <span className="today-name">{ex.categoryIcon} {ex.name}</span>
                    <span className="today-desc">{ex.description}</span>
                    <span className="today-meta">{ex.sets} sets × {ex.reps} reps</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
