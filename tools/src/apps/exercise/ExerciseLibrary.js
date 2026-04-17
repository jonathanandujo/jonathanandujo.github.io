import React, { useState } from 'react';
import exerciseData from './exerciseData';

export default function ExerciseLibrary({ onAdd, activeDays }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [addingExercise, setAddingExercise] = useState(null);

  const category = exerciseData.find((c) => c.id === selectedCategory);

  return (
    <div className="exercise-library">
      {!selectedCategory ? (
        <>
          <h2>Exercise Categories</h2>
          <div className="category-grid">
            {exerciseData.map((cat) => (
              <button
                key={cat.id}
                className="category-card"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{cat.exercises.length} exercises</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="back-btn" onClick={() => { setSelectedCategory(null); setAddingExercise(null); }}>
            ← Back to Categories
          </button>
          <h2>{category.icon} {category.name}</h2>
          <div className="exercise-list">
            {category.exercises.map((ex) => (
              <div key={ex.id} className="exercise-card">
                <div className="exercise-info">
                  <h3>{ex.name}</h3>
                  <p className="exercise-desc">{ex.description}</p>
                  <span className="exercise-meta">{ex.sets} sets × {ex.reps} reps</span>
                </div>
                {onAdd && (
                  <div className="exercise-actions">
                    {addingExercise === ex.id ? (
                      <div className="day-picker">
                        {activeDays.map((day) => (
                          <button
                            key={day}
                            className="day-pick-btn"
                            onClick={() => {
                              onAdd(day, ex.id, category.id);
                              setAddingExercise(null);
                            }}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                        <button className="day-pick-cancel" onClick={() => setAddingExercise(null)}>✕</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => setAddingExercise(ex.id)} title="Add to routine">+</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
