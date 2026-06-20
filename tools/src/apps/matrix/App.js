import './App.css';
import { useEffect, useRef, useState } from 'react';
import TodoList from './components/todo';
import { useSupabaseSync } from '../../supabase/useSupabaseSync';
import '../../supabase/SyncPanel.css';

const STORAGE_KEY = 'eisenhower-matrix-v1';
const AUTO_PUSH_DELAY_MS = 2000;

const DEFAULT_COLORS = {
  '1': '#ff8a7a',
  '2': '#ffd084',
  '3': '#84d9b8',
  '4': '#9ed6ff',
};

const DEFAULT_STATE = {
  quadrants: {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
  },
  colors: DEFAULT_COLORS,
};

const getStorageKey = (alias) => (alias ? `${STORAGE_KEY}:${alias}` : STORAGE_KEY);

const makeTask = (todo) => ({
  id: (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  todo,
});

const mergeState = (raw) => {
  if (!raw || typeof raw !== 'object') return DEFAULT_STATE;
  return {
    quadrants: {
      '1': Array.isArray(raw?.quadrants?.['1']) ? raw.quadrants['1'] : [],
      '2': Array.isArray(raw?.quadrants?.['2']) ? raw.quadrants['2'] : [],
      '3': Array.isArray(raw?.quadrants?.['3']) ? raw.quadrants['3'] : [],
      '4': Array.isArray(raw?.quadrants?.['4']) ? raw.quadrants['4'] : [],
    },
    colors: {
      ...DEFAULT_COLORS,
      ...(raw?.colors || {}),
    },
  };
};

const hasMeaningfulData = (payload) => {
  if (!payload || typeof payload !== 'object') return false;
  return ['1', '2', '3', '4'].some((k) => (payload?.quadrants?.[k] || []).length > 0);
};

function Matrix({ syncAlias }) {
  const [matrixState, setMatrixState] = useState(() => {
    const stored = localStorage.getItem(getStorageKey(syncAlias));
    if (!stored) return DEFAULT_STATE;
    try {
      return mergeState(JSON.parse(stored));
    } catch {
      return DEFAULT_STATE;
    }
  });

  const autoPulledRef = useRef(false);
  const autoPushTimerRef = useRef(null);
  const skipNextAutoPushRef = useRef(true);
  const matrixStateRef = useRef(matrixState);
  const { push, pull, syncing, lastSync, error: syncError, isConfigured } = useSupabaseSync('matrix', syncAlias);

  useEffect(() => {
    matrixStateRef.current = matrixState;
  }, [matrixState]);

  useEffect(() => {
    const stored = localStorage.getItem(getStorageKey(syncAlias));
    if (!stored) {
      skipNextAutoPushRef.current = true;
      setMatrixState(DEFAULT_STATE);
      autoPulledRef.current = false;
      return;
    }
    try {
      skipNextAutoPushRef.current = true;
      setMatrixState(mergeState(JSON.parse(stored)));
    } catch {
      skipNextAutoPushRef.current = true;
      setMatrixState(DEFAULT_STATE);
    }
    autoPulledRef.current = false;
  }, [syncAlias]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(syncAlias), JSON.stringify(matrixState));
  }, [matrixState, syncAlias]);

  useEffect(() => {
    if (!isConfigured || autoPulledRef.current) return;
    autoPulledRef.current = true;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const remote = await pull();
      if (cancelled) return;
      if (hasMeaningfulData(remote)) {
        skipNextAutoPushRef.current = true;
        setMatrixState(mergeState(remote));
      } else {
        await push(matrixStateRef.current);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isConfigured, pull, push, syncAlias]);

  useEffect(() => {
    if (!isConfigured) return;
    if (skipNextAutoPushRef.current) {
      skipNextAutoPushRef.current = false;
      return;
    }
    if (autoPushTimerRef.current) clearTimeout(autoPushTimerRef.current);
    autoPushTimerRef.current = setTimeout(() => {
      push(matrixState);
    }, AUTO_PUSH_DELAY_MS);
    return () => {
      if (autoPushTimerRef.current) clearTimeout(autoPushTimerRef.current);
    };
  }, [matrixState, isConfigured, push]);

  const updateQuadrant = (priority, nextList) => {
    setMatrixState((prev) => ({
      ...prev,
      quadrants: {
        ...prev.quadrants,
        [priority]: nextList,
      },
    }));
  };

  const addTask = (priority, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    updateQuadrant(priority, [...(matrixState.quadrants[priority] || []), makeTask(trimmed)]);
  };

  const deleteTask = (priority, id) => {
    updateQuadrant(priority, (matrixState.quadrants[priority] || []).filter((t) => t.id !== id));
  };

  const moveTask = (priority, fromIndex, toIndex) => {
    const list = [...(matrixState.quadrants[priority] || [])];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return;
    [list[fromIndex], list[toIndex]] = [list[toIndex], list[fromIndex]];
    updateQuadrant(priority, list);
  };

  const updateColor = (priority, color) => {
    setMatrixState((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [priority]: color,
      },
    }));
  };

  return (
    <div className="App">
      {isConfigured && (
        <div className="supabase-sync-bar matrix-sync-bar">
          {syncing && <span className="sync-info">Syncing…</span>}
          {syncError && <span className="sync-error">{syncError}</span>}
          {lastSync && !syncing && <span className="sync-info">Last: {lastSync.toLocaleTimeString()}</span>}
        </div>
      )}
      <div className="flex-grid">
        <div className="grid-item" style={{ background: matrixState.colors['1'] }}>
          <TodoList
            title="Do First"
            priority="1"
            list={matrixState.quadrants['1']}
            onAdd={addTask}
            onDelete={deleteTask}
            onMove={moveTask}
            color={matrixState.colors['1']}
            onColorChange={updateColor}
          />
        </div>
        <div className="grid-item" style={{ background: matrixState.colors['2'] }}>
          <TodoList
            title="Schedule"
            priority="2"
            list={matrixState.quadrants['2']}
            onAdd={addTask}
            onDelete={deleteTask}
            onMove={moveTask}
            color={matrixState.colors['2']}
            onColorChange={updateColor}
          />
        </div>
        <div className="grid-item" style={{ background: matrixState.colors['3'] }}>
          <TodoList
            title="Delegate"
            priority="3"
            list={matrixState.quadrants['3']}
            onAdd={addTask}
            onDelete={deleteTask}
            onMove={moveTask}
            color={matrixState.colors['3']}
            onColorChange={updateColor}
          />
        </div>
        <div className="grid-item" style={{ background: matrixState.colors['4'] }}>
          <TodoList
            title="Don't do"
            priority="4"
            list={matrixState.quadrants['4']}
            onAdd={addTask}
            onDelete={deleteTask}
            onMove={moveTask}
            color={matrixState.colors['4']}
            onColorChange={updateColor}
          />
        </div>
      </div>
    </div>
  );
}

export default Matrix;
