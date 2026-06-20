import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../../../supabase/supabaseClient';
import { generateRoomId, isValidRoomId, normalizeRoomId } from './roomId';
import './TicTacToe.css';

// ── Supabase table: tictactoe_rooms ──────────────────────────────────────────
// CREATE TABLE tictactoe_rooms (
//   id         TEXT PRIMARY KEY,
//   state      JSONB NOT NULL,
//   updated_at TIMESTAMPTZ DEFAULT now()
// );

const EMPTY = Array(9).fill(null);

const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6],         // diags
];

function calcWinner(squares) {
  for (const [a,b,c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a,b,c] };
    }
  }
  if (squares.every(Boolean)) return { winner: 'draw', line: [] };
  return null;
}

function makeInitialState(hostId) {
  return {
    board: EMPTY,
    xPlayer: hostId,   // host is always X
    oPlayer: null,     // filled when second player joins
    xIsNext: true,
    result: null,      // null | { winner: 'X'|'O'|'draw', line: [] }
    hostId,
    phase: 'waiting',  // 'waiting' | 'playing' | 'done'
  };
}

function getPlayerId() {
  let id = sessionStorage.getItem('ttt_player_id');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('ttt_player_id', id);
  }
  return id;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TicTacToe() {
  const { roomId: paramRoomId } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState(paramRoomId ? 'joining' : 'lobby');
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [roomId, setRoomId] = useState(paramRoomId || null);
  const [gameState, setGameState] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const playerId = useRef(getPlayerId()).current;
  const channelRef = useRef(null);

  // ── Fetch latest room state from DB ────────────────────────────────────────
  const fetchState = useCallback(async (id) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('tictactoe_rooms')
      .select('state')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.state ?? null;
  }, []);

  // ── Write room state to DB ─────────────────────────────────────────────────
  const saveState = useCallback(async (id, state) => {
    const client = getSupabaseClient();
    await client
      .from('tictactoe_rooms')
      .upsert({ id, state, updated_at: new Date().toISOString() });
  }, []);

  // ── Subscribe to realtime changes ──────────────────────────────────────────
  const subscribe = useCallback((id) => {
    const client = getSupabaseClient();
    if (channelRef.current) {
      client.removeChannel(channelRef.current);
    }
    const channel = client
      .channel(`tictactoe:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tictactoe_rooms', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new?.state) {
            setGameState(payload.new.state);
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
    return channel;
  }, []);

  // ── Cleanup subscription on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      const client = getSupabaseClient();
      if (channelRef.current) client.removeChannel(channelRef.current);
    };
  }, []);

  // ── Auto-join if URL has roomId param ─────────────────────────────────────
  useEffect(() => {
    if (screen !== 'joining' || !paramRoomId) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const existing = await fetchState(paramRoomId);
        if (cancelled) return;
        if (!existing) {
          setJoinError('Room not found.');
          setScreen('lobby');
          return;
        }
        let next = { ...existing };
        if (next.oPlayer === null && next.xPlayer !== playerId) {
          next.oPlayer = playerId;
          next.phase = 'playing';
          await saveState(paramRoomId, next);
        }
        setRoomId(paramRoomId);
        setGameState(next);
        subscribe(paramRoomId);
        setScreen('game');
      } catch {
        if (!cancelled) setJoinError('Failed to connect to room.');
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [screen, paramRoomId, playerId, fetchState, saveState, subscribe]);

  // ── Create new room ────────────────────────────────────────────────────────
  const handleNew = useCallback(async () => {
    const id = generateRoomId();
    const initial = makeInitialState(playerId);
    setSyncing(true);
    try {
      await saveState(id, initial);
      setRoomId(id);
      setGameState(initial);
      subscribe(id);
      setScreen('game');
      navigate(`/minigames/tictactoe/${id}`, { replace: true });
    } catch {
      setJoinError('Failed to create room. Try again.');
    } finally {
      setSyncing(false);
    }
  }, [playerId, saveState, subscribe, navigate]);

  // ── Join existing room ────────────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    const id = normalizeRoomId(joinInput);
    if (!isValidRoomId(id)) {
      setJoinError('Enter a valid room ID (e.g. swift-river)');
      return;
    }
    setSyncing(true);
    setJoinError('');
    try {
      const existing = await fetchState(id);
      if (!existing) {
        setJoinError('Room not found.');
        return;
      }
      let next = { ...existing };
      if (next.xPlayer !== playerId) {
        if (next.oPlayer !== null && next.oPlayer !== playerId) {
          setJoinError('Room is full.');
          return;
        }
        if (next.oPlayer === null) {
          next.oPlayer = playerId;
          next.phase = 'playing';
          await saveState(id, next);
        }
      }
      setRoomId(id);
      setGameState(next);
      subscribe(id);
      setScreen('game');
      navigate(`/minigames/tictactoe/${id}`, { replace: true });
    } catch {
      setJoinError('Failed to join room. Try again.');
    } finally {
      setSyncing(false);
    }
  }, [joinInput, playerId, fetchState, saveState, subscribe, navigate]);

  // ── Make a move ───────────────────────────────────────────────────────────
  const handleMove = useCallback(async (index) => {
    if (!gameState || gameState.phase !== 'playing') return;
    const { board, xIsNext, xPlayer, oPlayer, result } = gameState;
    if (result) return;
    if (board[index]) return;

    const myMark = xPlayer === playerId ? 'X' : oPlayer === playerId ? 'O' : null;
    if (!myMark) return; // spectator
    if (xIsNext && myMark !== 'X') return;
    if (!xIsNext && myMark !== 'O') return;

    const next = board.slice();
    next[index] = myMark;
    const result2 = calcWinner(next);
    const nextState = {
      ...gameState,
      board: next,
      xIsNext: !xIsNext,
      result: result2,
      phase: result2 ? 'done' : 'playing',
    };
    setGameState(nextState); // optimistic
    await saveState(roomId, nextState);
  }, [gameState, playerId, roomId, saveState]);

  // ── Reset game ────────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    if (!gameState) return;
    const next = {
      ...gameState,
      board: EMPTY,
      xIsNext: true,
      result: null,
      phase: 'playing',
    };
    setGameState(next);
    await saveState(roomId, next);
  }, [gameState, roomId, saveState]);

  // ── Copy room link ─────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── Lobby screen ───────────────────────────────────────────────────────────
  if (screen === 'lobby') {
    return (
      <div className="ttt-wrap">
        <div className="ttt-lobby">
          <div className="ttt-logo">✕ ○</div>
          <h1>Tic-Tac-Toe</h1>
          <p className="ttt-subtitle">2-player multiplayer — play with anyone, anywhere.</p>

          {joinError && <p className="ttt-error">{joinError}</p>}

          <button className="ttt-btn primary" onClick={handleNew} disabled={syncing}>
            {syncing ? 'Creating…' : '＋ New Game'}
          </button>

          <div className="ttt-divider"><span>or join existing</span></div>

          <div className="ttt-join-row">
            <input
              className="ttt-input"
              placeholder="swift-river"
              value={joinInput}
              onChange={(e) => { setJoinInput(e.target.value); setJoinError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              autoCapitalize="none"
              spellCheck={false}
            />
            <button className="ttt-btn secondary" onClick={handleJoin} disabled={syncing || !joinInput.trim()}>
              {syncing ? '…' : 'Join'}
            </button>
          </div>
          <p className="ttt-hint">Room IDs look like <strong>swift-river</strong></p>
        </div>
      </div>
    );
  }

  // ── Joining screen ─────────────────────────────────────────────────────────
  if (screen === 'joining') {
    return (
      <div className="ttt-wrap">
        <div className="ttt-lobby">
          <div className="ttt-logo">✕ ○</div>
          <p className="ttt-subtitle">Connecting to room <strong>{paramRoomId}</strong>…</p>
          {joinError && <><p className="ttt-error">{joinError}</p>
            <button className="ttt-btn primary" onClick={() => navigate('/minigames/tictactoe')}>Back to lobby</button>
          </>}
        </div>
      </div>
    );
  }

  // ── Game screen ────────────────────────────────────────────────────────────
  if (screen === 'game' && gameState) {
    const { board, xIsNext, xPlayer, oPlayer, result, phase } = gameState;
    const myMark = xPlayer === playerId ? 'X' : oPlayer === playerId ? 'O' : null;
    const winLine = result?.line || [];

    const statusMsg = (() => {
      if (phase === 'waiting') return 'Waiting for opponent to join…';
      if (result?.winner === 'draw') return "It's a draw!";
      if (result?.winner) {
        const isMine = (result.winner === 'X' && xPlayer === playerId) || (result.winner === 'O' && oPlayer === playerId);
        return isMine ? '🎉 You won!' : '😔 You lost.';
      }
      const myTurn = (xIsNext && myMark === 'X') || (!xIsNext && myMark === 'O');
      if (!myMark) return xIsNext ? "X's turn" : "O's turn";
      return myTurn ? 'Your turn' : "Opponent's turn";
    })();

    return (
      <div className="ttt-wrap">
        <div className="ttt-game">
          <div className="ttt-header">
            <h2>Tic-Tac-Toe</h2>
            <div className="ttt-room-info">
              <span className="ttt-room-id">Room: <strong>{roomId}</strong></span>
              <button className="ttt-copy-btn" onClick={handleCopy}>{copied ? '✓ Copied' : '🔗 Invite'}</button>
            </div>
          </div>

          <div className="ttt-marks-bar">
            <div className={`ttt-mark-badge ${myMark === 'X' ? 'mine' : ''}`}>
              <span>✕</span><span className="ttt-badge-label">{xPlayer === playerId ? 'You' : 'Opponent'}</span>
            </div>
            <div className="ttt-vs">vs</div>
            <div className={`ttt-mark-badge ${myMark === 'O' ? 'mine' : ''}`}>
              <span>○</span><span className="ttt-badge-label">{oPlayer === playerId ? 'You' : (oPlayer ? 'Opponent' : 'Waiting…')}</span>
            </div>
          </div>

          <p className={`ttt-status ${result ? (result.winner === 'draw' ? 'draw' : (result.winner === myMark ? 'win' : 'lose')) : ''}`}>
            {statusMsg}
          </p>

          <div className="ttt-board">
            {board.map((cell, i) => (
              <button
                key={i}
                className={`ttt-cell ${cell || ''} ${winLine.includes(i) ? 'winning' : ''}`}
                onClick={() => handleMove(i)}
                disabled={!!cell || !!result || phase !== 'playing'}
                aria-label={`Cell ${i + 1}${cell ? ': ' + cell : ''}`}
              >
                {cell === 'X' ? '✕' : cell === 'O' ? '○' : ''}
              </button>
            ))}
          </div>

          {result && (
            <button className="ttt-btn primary" onClick={handleReset}>Play Again</button>
          )}

          <button className="ttt-btn ghost" onClick={() => { navigate('/minigames/tictactoe'); setScreen('lobby'); setGameState(null); }}>
            ← Back to lobby
          </button>
        </div>
      </div>
    );
  }

  return null;
}
