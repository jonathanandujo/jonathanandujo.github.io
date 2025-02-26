import './minesweeper.css';
import React, { useState } from 'react';

function Minesweeper() {
  const [board, setBoard] = useState(createBoard(10, 10, 10));
  const [gameOver, setGameOver] = useState(false);

  function createBoard(rows, cols, mines) {
    // Initialize board with empty cells
    let board = Array(rows).fill().map(() => Array(cols).fill({ isMine: false, isOpen: false, isFlagged: false, adjacentMines: 0 }));

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      let row = Math.floor(Math.random() * rows);
      let col = Math.floor(Math.random() * cols);
      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines for each cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!board[row][col].isMine) {
          let adjacentMines = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (row + i >= 0 && row + i < rows && col + j >= 0 && col + j < cols && board[row + i][col + j].isMine) {
                adjacentMines++;
              }
            }
          }
          board[row][col].adjacentMines = adjacentMines;
        }
      }
    }

    return board;
  }

  function handleCellClick(row, col) {
    if (gameOver || board[row][col].isOpen) return;

    const newBoard = board.slice();
    if (newBoard[row][col].isMine) {
      setGameOver(true);
      alert('Game Over');
      return;
    }

    openCell(newBoard, row, col);
    setBoard(newBoard);
  }

  function openCell(board, row, col) {
    if (row < 0 || row >= board.length || col < 0 || col >= board[0].length || board[row][col].isOpen) return;

    board[row][col].isOpen = true;
    if (board[row][col].adjacentMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          openCell(board, row + i, col + j);
        }
      }
    }
  }

  const Cell = ({ cell, onClick, onRightClick }) => {
    let cellContent = '';
    if (cell.isOpen) {
      cellContent = cell.isMine ? '💣' : cell.adjacentMines > 0 ? cell.adjacentMines : '';
    } else if (cell.isFlagged) {
      cellContent = '🚩';
    }

    return (
      <div
        onClick={onClick}
        onContextMenu={onRightClick}
        className={`cell ${cell.isOpen ? 'open' : ''} ${cell.isMine ? 'mine' : ''}`}
      >
        {cellContent}
      </div>
    );
  };

  const handleRightClick = (e, row, col) => {
    e.preventDefault();
    if (gameOver || board[row][col].isOpen) return;

    const newBoard = board.slice();
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
  };

  const openAdjacentCells = (board, row, col) => {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (row + i >= 0 && row + i < board.length && col + j >= 0 && col + j < board[0].length && !board[row + i][col + j].isOpen && !board[row + i][col + j].isMine) {
          board[row + i][col + j].isOpen = true;
          if (board[row + i][col + j].adjacentMines === 0) {
            openAdjacentCells(board, row + i, col + j);
          }
        }
      }
    }
  };

  return (
    <div>
      <h1>Minesweeper</h1>
      <div className="board">
        {board.map((row, rowIndex) =>
          <div className="row" key={rowIndex}>
            {row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onRightClick={(e) => handleRightClick(e, rowIndex, colIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Minesweeper;
