import React, { useRef, useState } from 'react';
import exerciseData from './exerciseData';

function findExercise(exerciseId) {
  for (const cat of exerciseData) {
    const ex = cat.exercises.find((e) => e.id === exerciseId);
    if (ex) return { ...ex, categoryIcon: cat.icon };
  }
  return null;
}

export default function RoutineBuilder({
  schedule,
  activeDays,
  toggleDay,
  setDayExercises,
  addExerciseToDay,
  removeExerciseFromDay,
  DAY_NAMES,
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [dragDay, setDragDay] = useState(null);
  // Per-day add-exercise state: { day: 'Monday', category: null | catId }
  const [addPanel, setAddPanel] = useState(null);

  const handleDragStart = (day, index) => {
    dragItem.current = index;
    setDragDay(day);
  };

  const handleDragEnter = (day, index) => {
    if (day !== dragDay) return;
    dragOverItem.current = index;
  };

  const handleDrop = (day) => {
    if (day !== dragDay) return;
    const list = [...(schedule[day] || [])];
    const draggedItem = list[dragItem.current];
    list.splice(dragItem.current, 1);
    list.splice(dragOverItem.current, 0, draggedItem);
    setDayExercises(day, list);
    dragItem.current = null;
    dragOverItem.current = null;
    setDragDay(null);
  };

  const openAdd = (day) => setAddPanel({ day, category: null });
  const closeAdd = () => setAddPanel(null);

  const currentCategory = addPanel?.category
    ? exerciseData.find((c) => c.id === addPanel.category)
    : null;

  const dayExerciseIds = (day) => (schedule[day] || []).map((e) => e.exerciseId);

  return (
    <div className="routine-builder">
      <h2>🗓️ Routine Builder</h2>
      <p className="rb-subtitle">Tap a day to toggle it on/off. Add exercises directly to each day.</p>

      <div className="day-toggle-bar">
        {DAY_NAMES.map((day) => {
          const isActive = activeDays.includes(day);
          return (
            <button
              key={day}
              className={`day-toggle-btn ${isActive ? 'on' : 'off'}`}
              onClick={() => toggleDay(day)}
            >
              <span className="dt-short">{day.slice(0, 3)}</span>
              <span className="dt-indicator">{isActive ? '🟢' : '⚪'}</span>
            </button>
          );
        })}
      </div>

      <div className="schedule-columns">
        {DAY_NAMES.map((day) => {
          const isActive = activeDays.includes(day);
          const exercises = schedule[day] || [];
          const isAdding = addPanel?.day === day;
          return (
            <div key={day} className={`schedule-col ${isActive ? 'active' : 'inactive'}`}>
              <div className="col-header" onClick={() => toggleDay(day)}>
                <span className="col-day-name">{day}</span>
                {isActive ? <span className="col-badge">{exercises.length}</span> : <span className="col-rest">Rest</span>}
              </div>
              {isActive && (
                <div
                  className="col-body"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(day)}
                >
                  {exercises.map((entry, idx) => {
                    const ex = findExercise(entry.exerciseId);
                    if (!ex) return null;
                    return (
                      <div
                        key={entry.exerciseId}
                        className="schedule-exercise"
                        draggable
                        onDragStart={() => handleDragStart(day, idx)}
                        onDragEnter={() => handleDragEnter(day, idx)}
                        onDragEnd={() => handleDrop(day)}
                      >
                        <span className="drag-handle">⠿</span>
                        <span className="se-icon">{ex.categoryIcon}</span>
                        <div className="se-details">
                          <span className="se-name">{ex.name}</span>
                          <span className="se-meta">{ex.sets}×{ex.reps}</span>
                        </div>
                        <button
                          className="remove-btn"
                          onClick={() => removeExerciseFromDay(day, entry.exerciseId)}
                          title="Remove"
                        >✕</button>
                      </div>
                    );
                  })}

                  {/* Inline add button */}
                  {!isAdding && (
                    <button className="inline-add-btn" onClick={() => openAdd(day)}>
                      + Add Exercise
                    </button>
                  )}

                  {/* Inline add panel */}
                  {isAdding && (
                    <div className="inline-add-panel">
                      {!addPanel.category ? (
                        <>
                          <div className="iap-header">
                            <span>Pick a muscle group</span>
                            <button className="iap-close" onClick={closeAdd}>✕</button>
                          </div>
                          <div className="iap-categories">
                            {exerciseData.map((cat) => (
                              <button
                                key={cat.id}
                                className="iap-cat-btn"
                                onClick={() => setAddPanel({ ...addPanel, category: cat.id })}
                              >
                                {cat.icon} {cat.name}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="iap-header">
                            <button className="iap-back" onClick={() => setAddPanel({ ...addPanel, category: null })}>←</button>
                            <span>{currentCategory.icon} {currentCategory.name}</span>
                            <button className="iap-close" onClick={closeAdd}>✕</button>
                          </div>
                          <div className="iap-exercises">
                            {currentCategory.exercises.map((ex) => {
                              const alreadyAdded = dayExerciseIds(day).includes(ex.id);
                              return (
                                <button
                                  key={ex.id}
                                  className={`iap-ex-btn ${alreadyAdded ? 'added' : ''}`}
                                  disabled={alreadyAdded}
                                  onClick={() => {
                                    addExerciseToDay(day, ex.id, currentCategory.id);
                                  }}
                                >
                                  <span className="iap-ex-name">{ex.name}</span>
                                  <span className="iap-ex-detail">{ex.sets}×{ex.reps}</span>
                                  {alreadyAdded && <span className="iap-ex-check">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
