import React, { useState } from 'react';
import RoutineBuilder from './RoutineBuilder';
import TodayView from './TodayView';
import useExerciseStore from './useExerciseStore';
import { useSupabaseSync } from '../../supabase/useSupabaseSync';
import '../../supabase/SyncPanel.css';
import './ExerciseApp.css';

const TABS = ['Today', 'Routine'];

export default function ExerciseApp({ syncAlias }) {
  const [tab, setTab] = useState('Today');
  const store = useExerciseStore();
  const { push, pull, syncing, lastSync, error: syncError, isConfigured } = useSupabaseSync('exercise', syncAlias);

  return (
    <div className="exercise-app">
      <div className="exercise-top-bar">
        <div className="exercise-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`exercise-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'Today' && '📅 '}
              {t === 'Routine' && '🗓️ '}
              {t}
            </button>
          ))}
        </div>
        {isConfigured && (
          <span className="supabase-sync-bar">
            <button className="btn-push" disabled={syncing} onClick={() => push(store.getState())}>
              ☁↑ Push
            </button>
            <button className="btn-pull" disabled={syncing} onClick={async () => {
              const remote = await pull();
              if (remote) store.loadRemote(remote);
            }}>
              ☁↓ Pull
            </button>
            {syncing && <span className="sync-info">Syncing…</span>}
            {syncError && <span className="sync-error">{syncError}</span>}
            {lastSync && !syncing && <span className="sync-info">Last: {lastSync.toLocaleTimeString()}</span>}
          </span>
        )}
      </div>

      <div className="exercise-content">
        {tab === 'Today' && (
          <TodayView
            getTodayExercises={store.getTodayExercises}
            getTodayCompletions={store.getTodayCompletions}
            toggleCompletion={store.toggleCompletion}
            todayDayName={store.todayDayName}
          />
        )}
        {tab === 'Routine' && (
          <RoutineBuilder
            schedule={store.schedule}
            activeDays={store.activeDays}
            toggleDay={store.toggleDay}
            setDayExercises={store.setDayExercises}
            addExerciseToDay={store.addExerciseToDay}
            removeExerciseFromDay={store.removeExerciseFromDay}
            DAY_NAMES={store.DAY_NAMES}
          />
        )}
      </div>
    </div>
  );
}
