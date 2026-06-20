import React from 'react';
import { Link } from 'react-router-dom';
import './MinigamesHub.css';

const games = [
  {
    id: 'penguin',
    title: 'Penguin Ice Catcher',
    icon: '🐧',
    description: 'Help the penguin catch ice cubes!',
    path: '/minigames/penguin',
  },
  {
    id: 'dolphin',
    title: 'Dolphin Fish Catcher',
    icon: '🐬',
    description: 'Help the dolphin catch fish!',
    path: '/minigames/dolphin',
  },
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    icon: '❌',
    description: '2-player multiplayer. Create or join a room!',
    path: '/minigames/tictactoe',
  },
  {
    id: 'coming-soon-2',
    title: 'Coming Soon',
    icon: '🔒',
    description: 'A new minigame is on the way!',
    path: null,
  },
];

export default function MinigamesHub() {
  return (
    <div className="minigames-hub">
      <h1 className="minigames-title">🎮 Minigames</h1>
      <div className="minigames-grid">
        {games.map((game) => {
          const card = (
            <div
              key={game.id}
              className={`minigame-card ${game.path ? '' : 'locked'}`}
            >
              <div className="minigame-icon">{game.icon}</div>
              <div className="minigame-name">{game.title}</div>
              <div className="minigame-desc">{game.description}</div>
            </div>
          );
          return game.path ? (
            <Link to={game.path} key={game.id} className="minigame-link">
              {card}
            </Link>
          ) : (
            <div key={game.id} className="minigame-link disabled">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
