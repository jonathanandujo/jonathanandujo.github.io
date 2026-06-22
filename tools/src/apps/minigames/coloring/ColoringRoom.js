import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import heic2any from 'heic2any';
import { getSyncAlias } from '../../../supabase/supabaseClient';
import { generateRoomId, isValidRoomId, normalizeRoomId } from '../tictactoe/roomId';
import './ColoringRoom.css';

const WS_URL = process.env.REACT_APP_FOOTBALL_WS_URL || 'wss://fly-io-comwvg.fly.dev/ws';
const CANVAS_W = 1000;
const CANVAS_H = 700;

// SVG-based coloring templates that always work
const DEFAULT_IMAGES = [
  {
    name: 'Butterfly',
    url: 'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cg stroke="%23000" stroke-width="2" fill="none"%3E%3Cellipse cx="100" cy="100" rx="15" ry="20"/%3E%3Cellipse cx="60" cy="60" rx="25" ry="35"/%3E%3Cellipse cx="140" cy="60" rx="25" ry="35"/%3E%3Cellipse cx="50" cy="120" rx="20" ry="30"/%3E%3Cellipse cx="150" cy="120" rx="20" ry="30"/%3E%3Cpath d="M 100 80 Q 80 50 70 40"/%3E%3Cpath d="M 100 80 Q 120 50 130 40"/%3E%3Ccircle cx="70" cy="35" r="3"/%3E%3Ccircle cx="130" cy="35" r="3"/%3E%3C/g%3E%3C/svg%3E',
  },
  {
    name: 'Flower',
    url: 'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cg stroke="%23000" stroke-width="2" fill="none"%3E%3Ccircle cx="100" cy="80" r="20"/%3E%3Ccircle cx="130" cy="95" r="18"/%3E%3Ccircle cx="130" cy="125" r="18"/%3E%3Ccircle cx="100" cy="140" r="18"/%3E%3Ccircle cx="70" cy="125" r="18"/%3E%3Ccircle cx="70" cy="95" r="18"/%3E%3Ccircle cx="100" cy="100" r="12" fill="%23FFD700"/%3E%3Cpath d="M 100 140 L 100 170"/%3E%3Cpath d="M 85 155 Q 80 165 75 170"/%3E%3Cpath d="M 115 155 Q 120 165 125 170"/%3E%3C/g%3E%3C/svg%3E',
  },
  {
    name: 'Fish',
    url: 'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cg stroke="%23000" stroke-width="2" fill="none"%3E%3Cellipse cx="100" cy="100" rx="40" ry="30"/%3E%3Cpath d="M 140 100 L 170 80 L 160 100 L 170 120 Z" fill="none"/%3E%3Ccircle cx="115" cy="95" r="4"/%3E%3Cpath d="M 60 80 Q 50 70 40 80"/%3E%3Cpath d="M 60 120 Q 50 130 40 120"/%3E%3C/g%3E%3C/svg%3E',
  },
  {
    name: 'Star',
    url: 'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cg stroke="%23000" stroke-width="2" fill="none"%3E%3Cpath d="M 100 20 L 120 80 L 180 80 L 130 120 L 150 180 L 100 140 L 50 180 L 70 120 L 20 80 L 80 80 Z"/%3E%3Ccircle cx="100" cy="100" r="30"/%3E%3C/g%3E%3C/svg%3E',
  },
  {
    name: 'House',
    url: 'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cg stroke="%23000" stroke-width="2" fill="none"%3E%3Cpath d="M 50 100 L 100 50 L 150 100"/%3E%3Crect x="50" y="100" width="100" height="80"/%3E%3Crect x="70" y="120" width="25" height="30"/%3E%3Crect x="105" y="120" width="25" height="30"/%3E%3Cpath d="M 80 110 L 90 100 L 100 110"/%3E%3C/g%3E%3C/svg%3E',
  },
  {
    name: 'Tree',
    url: 'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cg stroke="%23000" stroke-width="2" fill="none"%3E%3Ccircle cx="100" cy="70" r="30"/%3E%3Ccircle cx="80" cy="90" r="28"/%3E%3Ccircle cx="120" cy="90" r="28"/%3E%3Crect x="90" y="130" width="20" height="50" fill="none"/%3E%3Cpath d="M 90 130 L 85 150 M 110 130 L 115 150"/%3E%3C/g%3E%3C/svg%3E',
  },
];

const DEFAULT_TREE_IMAGE = DEFAULT_IMAGES.find((img) => img.name === 'Tree')?.url || DEFAULT_IMAGES[0].url;

function getName() {
  return getSyncAlias() || 'Painter';
}

function drawStroke(ctx, stroke) {
  if (!stroke?.points?.length) return;
  const { color = '#ff5722', size = 8, points } = stroke;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0].x * CANVAS_W, points[0].y * CANVAS_H);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * CANVAS_W, points[i].y * CANVAS_H);
  }
  ctx.stroke();
  ctx.restore();
}

export default function ColoringRoom() {
  const { roomId: paramRoomId } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState(paramRoomId ? 'joining' : 'lobby');
  const [joinInput, setJoinInput] = useState('');
  const [roomError, setRoomError] = useState('');
  const [roomId, setRoomId] = useState(paramRoomId || '');
  const [connected, setConnected] = useState(false);

  const [imageInput, setImageInput] = useState(DEFAULT_TREE_IMAGE);
  const [imageUrl, setImageUrl] = useState(DEFAULT_TREE_IMAGE);
  const [strokes, setStrokes] = useState([]);
  const [color, setColor] = useState('#ff5a36');
  const [brush, setBrush] = useState(8);
  const [outlineOpacity, setOutlineOpacity] = useState(0.82);
  const [showImageGallery, setShowImageGallery] = useState(false);

  const playerName = useMemo(() => getName(), []);

  const wsRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);

  const drawingRef = useRef(false);
  const pointsRef = useRef([]);

  const redraw = useCallback((allStrokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    allStrokes.forEach((s) => drawStroke(ctx, s));
  }, []);

  useEffect(() => {
    redraw(strokes);
  }, [strokes, redraw]);

  const send = useCallback((payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }, []);

  const connectAndJoin = useCallback((targetRoomId) => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setConnected(false);

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === 'hello') {
          send({ type: 'join_room', roomId: targetRoomId, playerName });
          return;
        }

        if (msg.type === 'joined_room') {
          const snapshot = msg.payload?.snapshot || {};
          setRoomId(targetRoomId);
          if (snapshot.imageUrl) {
            setImageUrl(snapshot.imageUrl);
            setImageInput(snapshot.imageUrl);
          } else {
            setImageUrl(DEFAULT_TREE_IMAGE);
            setImageInput(DEFAULT_TREE_IMAGE);
            send({ type: 'set_image', imageUrl: DEFAULT_TREE_IMAGE });
          }
          setStrokes(snapshot.strokes || []);
          setScreen('game');
          resolve();
          return;
        }

        if (msg.type === 'room_state') {
          const snapshot = msg.payload?.snapshot || {};
          if (snapshot.imageUrl) {
            setImageUrl(snapshot.imageUrl);
            setImageInput(snapshot.imageUrl);
          }
          setStrokes(snapshot.strokes || []);
          return;
        }

        if (msg.type === 'stroke_added') {
          const stroke = msg.payload?.stroke;
          if (!stroke) return;
          setStrokes((prev) => [...prev, stroke]);
          return;
        }

        if (msg.type === 'canvas_cleared') {
          setStrokes([]);
          return;
        }

        if (msg.type === 'error') {
          reject(new Error(msg.payload?.message || 'Socket error'));
        }
      };

      ws.onerror = () => {
        setConnected(false);
        reject(new Error('Failed to connect'));
      };

      ws.onclose = () => {
        setConnected(false);
      };
    });
  }, [playerName, send]);

  const leave = useCallback(() => {
    const ws = wsRef.current;
    if (!ws) return;
    try {
      ws.send(JSON.stringify({ type: 'leave_room' }));
    } catch {
      // ignore
    }
    ws.close();
    wsRef.current = null;
  }, []);

  useEffect(() => () => leave(), [leave]);

  useEffect(() => {
    if (!paramRoomId) return;
    const id = normalizeRoomId(paramRoomId);
    let cancelled = false;

    setScreen('joining');
    setRoomError('');

    connectAndJoin(id)
      .then(() => {
        if (!cancelled) navigate(`/minigames/coloring-room/${id}`, { replace: true });
      })
      .catch((err) => {
        if (!cancelled) {
          setRoomError(err.message || 'Unable to join room');
          setScreen('lobby');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paramRoomId, connectAndJoin, navigate]);

  const toPoint = useCallback((clientX, clientY) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  }, []);

  const onPointerDown = (e) => {
    if (screen !== 'game') return;
    const p = toPoint(e.clientX, e.clientY);
    if (!p) return;
    drawingRef.current = true;
    pointsRef.current = [p];
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    const p = toPoint(e.clientX, e.clientY);
    if (!p) return;
    pointsRef.current.push(p);
    redraw([...strokes, { points: pointsRef.current, color, size: brush }]);
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (pointsRef.current.length < 2) {
      pointsRef.current = [];
      redraw(strokes);
      return;
    }

    const stroke = {
      color,
      size: brush,
      points: pointsRef.current.slice(0, 600),
      by: playerName,
      ts: Date.now(),
    };

    setStrokes((prev) => [...prev, stroke]);
    send({ type: 'add_stroke', stroke });
    pointsRef.current = [];
  };

  const handleCreate = async () => {
    const id = generateRoomId();
    setRoomError('');
    try {
      await connectAndJoin(id);
      navigate(`/minigames/coloring-room/${id}`, { replace: true });
    } catch (err) {
      setRoomError(err.message || 'Failed to create room');
    }
  };

  const handleJoin = async () => {
    const id = normalizeRoomId(joinInput);
    if (!isValidRoomId(id)) {
      setRoomError('Enter a valid room id like swift-river');
      return;
    }

    setRoomError('');
    try {
      await connectAndJoin(id);
      navigate(`/minigames/coloring-room/${id}`, { replace: true });
    } catch (err) {
      setRoomError(err.message || 'Failed to join room');
    }
  };

  const handleSetImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    setImageUrl(url);
    send({ type: 'set_image', imageUrl: url });
  };

  const handleClear = () => {
    setStrokes([]);
    send({ type: 'clear_canvas' });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic');

    const processImage = async (imageFile) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result;
        if (typeof url === 'string') {
          setImageUrl(url);
          setImageInput(url);
          send({ type: 'set_image', imageUrl: url });
        }
      };
      reader.onerror = () => {
        console.error('Failed to read file');
      };
      reader.readAsDataURL(imageFile);
    };

    if (isHeic) {
      heic2any({
        blob: file,
        toType: 'image/jpeg',
      })
        .then((jpegBlob) => {
          processImage(jpegBlob);
        })
        .catch((err) => {
          console.error('HEIC conversion failed:', err);
          // Fallback: try to use original if conversion fails
          processImage(file);
        });
    } else {
      processImage(file);
    }
  };

  const handleSelectDefault = (imageUrl) => {
    setImageUrl(imageUrl);
    setImageInput(imageUrl);
    setShowImageGallery(false);
    send({ type: 'set_image', imageUrl });
  };

  const handleDownload = useCallback(async () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_W;
    exportCanvas.height = CANVAS_H;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (imageUrl) {
      try {
        const image = new Image();
        image.src = imageUrl;
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
        ctx.globalAlpha = 0.32;
        ctx.drawImage(image, 0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = outlineOpacity;
        ctx.drawImage(image, 0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1;
      } catch {
        // Keep export working even if image cannot be loaded.
      }
    }

    strokes.forEach((stroke) => drawStroke(ctx, stroke));

    const link = document.createElement('a');
    link.download = `coloring-${roomId || 'room'}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [imageUrl, outlineOpacity, roomId, strokes]);

  if (screen !== 'game') {
    return (
      <div className="cr-wrap">
        <div className="cr-card cr-lobby">
          <h1>Coloring Room</h1>
          <p className="cr-sub">Realtime kids coloring with sockets.</p>
          <p className="cr-sub">Playing as <strong>{playerName}</strong></p>
          {roomError ? <p className="cr-error">{roomError}</p> : null}

          <button className="cr-btn primary" onClick={handleCreate}>Create Room</button>

          <div className="cr-row">
            <input
              className="cr-input"
              placeholder="swift-river"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button className="cr-btn" onClick={handleJoin}>Join</button>
          </div>

          <p className="cr-sub">Socket: {WS_URL}</p>
          {screen === 'joining' ? <p className="cr-sub">Connecting...</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="cr-wrap">
      <div className="cr-card">
        <div className="cr-top">
          <h2>Coloring Room</h2>
          <div className="cr-meta">Room <strong>{roomId}</strong> | {connected ? 'Connected' : 'Offline'}</div>
        </div>

        <div className="cr-toolbar">
          <div className="cr-image-section">
            <div className="cr-image-controls">
              <button className="cr-btn btn-sm" onClick={() => setShowImageGallery(!showImageGallery)}>🖼️ Gallery</button>
              <label className="cr-upload-btn">
                📤 Upload
                <input type="file" accept="image/*,.heic,.heif" onChange={handleFileUpload} hidden />
              </label>
              <input
                className="cr-input input-sm"
                placeholder="Paste image URL"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
              />
              <button className="cr-btn btn-sm" onClick={handleSetImage}>Load</button>
            </div>
            {showImageGallery && (
              <div className="cr-gallery">
                {DEFAULT_IMAGES.map((img) => (
                  <button
                    key={img.name}
                    className="cr-gallery-item"
                    onClick={() => handleSelectDefault(img.url)}
                    title={img.name}
                  >
                    <img src={img.url} alt={img.name} />
                    <span>{img.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="cr-controls-section">
            <div className="cr-control-group">
              <label className="cr-control-label">
                <span>🎨 Color</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="cr-color-picker" />
              </label>
              <label className="cr-control-label">
                <span>🖌️ Size</span>
                <input type="range" min="2" max="24" value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
                <span className="cr-value">{brush}px</span>
              </label>
              <label className="cr-control-label">
                <span>📝 Lines</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(outlineOpacity * 100)}
                  onChange={(e) => setOutlineOpacity(Number(e.target.value) / 100)}
                />
                <span className="cr-value">{Math.round(outlineOpacity * 100)}%</span>
              </label>
            </div>
            <div className="cr-action-group">
              <button className="cr-btn" onClick={handleDownload}>⬇️ Download</button>
              <button className="cr-btn danger" onClick={handleClear}>🗑️ Clear</button>
              <button className="cr-btn ghost" onClick={() => { leave(); setScreen('lobby'); navigate('/minigames/coloring-room'); }}>👋 Leave</button>
            </div>
          </div>
        </div>

        <div
          className="cr-stage"
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imageUrl ? (
            <>
              <img
                className="cr-image cr-image-base"
                src={imageUrl}
                alt="Coloring template base"
              />
              <img
                className="cr-image cr-image-outline"
                src={imageUrl}
                alt="Coloring template outline"
                style={{ opacity: outlineOpacity }}
              />
            </>
          ) : <div className="cr-placeholder">Load an image URL to start coloring</div>}
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="cr-canvas" />
        </div>
      </div>
    </div>
  );
}
