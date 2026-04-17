import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'exercise-routines';
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_STATE = { schedule: {}, activeDays: ['Monday', 'Wednesday', 'Friday'], completions: {} };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old daysPerWeek format
      if (parsed.daysPerWeek && !parsed.activeDays) {
        parsed.activeDays = DAY_NAMES.slice(0, parsed.daysPerWeek);
        delete parsed.daysPerWeek;
      }
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_STATE;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayDayName() {
  const d = new Date();
  return DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
}

export default function useExerciseStore() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const toggleDay = useCallback((day) => {
    setState((prev) => {
      const days = prev.activeDays.includes(day)
        ? prev.activeDays.filter((d) => d !== day)
        : [...prev.activeDays, day];
      return { ...prev, activeDays: days };
    });
  }, []);

  const setDayExercises = useCallback((day, exercises) => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: exercises },
    }));
  }, []);

  const addExerciseToDay = useCallback((day, exerciseId, categoryId) => {
    setState((prev) => {
      const dayList = prev.schedule[day] || [];
      if (dayList.some((e) => e.exerciseId === exerciseId)) return prev;
      return {
        ...prev,
        schedule: { ...prev.schedule, [day]: [...dayList, { exerciseId, categoryId }] },
      };
    });
  }, []);

  const removeExerciseFromDay = useCallback((day, exerciseId) => {
    setState((prev) => {
      const dayList = (prev.schedule[day] || []).filter((e) => e.exerciseId !== exerciseId);
      return { ...prev, schedule: { ...prev.schedule, [day]: dayList } };
    });
  }, []);

  const toggleCompletion = useCallback((exerciseId) => {
    const key = todayKey();
    setState((prev) => {
      const dayCompletions = prev.completions[key] || [];
      const next = dayCompletions.includes(exerciseId)
        ? dayCompletions.filter((id) => id !== exerciseId)
        : [...dayCompletions, exerciseId];
      return { ...prev, completions: { ...prev.completions, [key]: next } };
    });
  }, []);

  const getTodayCompletions = useCallback(() => {
    return state.completions[todayKey()] || [];
  }, [state.completions]);

  const getTodayExercises = useCallback(() => {
    const day = todayDayName();
    return state.schedule[day] || [];
  }, [state.schedule]);

  const getState = useCallback(() => state, [state]);

  const loadRemote = useCallback((remote) => {
    if (remote) setState({ ...DEFAULT_STATE, ...remote });
  }, []);

  return {
    schedule: state.schedule,
    activeDays: state.activeDays,
    completions: state.completions,
    toggleDay,
    setDayExercises,
    addExerciseToDay,
    removeExerciseFromDay,
    toggleCompletion,
    getTodayCompletions,
    getTodayExercises,
    getState,
    loadRemote,
    todayDayName: todayDayName(),
    DAY_NAMES,
  };
}
