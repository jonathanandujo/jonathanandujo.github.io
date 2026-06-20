import React, { useState } from 'react';

const TodoList = ({ title, priority, list, onAdd, onDelete, onMove, color, onColorChange }) => {
    const [inputTask, setInputTask] = useState('');

    const handleAddTodo = () => {
        onAdd(priority, inputTask);
        setInputTask('');
    };

    const handleDeleteTodo = (id) => {
        onDelete(priority, id);
    };

    const handleInputChange = (event) => {
        setInputTask(event.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter')
            handleAddTodo();
    }

    const moveUp = (index) => {
        if (index > 0) {
            onMove(priority, index, index - 1);
        }
    }

    const moveDown = (index) => {
        if (index < list.length - 1) {
            onMove(priority, index, index + 1);
        }
    }

    return (
        <div className="Todo" style={{ background: color }}>
            <h1>{title}</h1>

            <div className="Top">
                <input className="input" type="text" value={inputTask}
                    onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Name of your task" />

                <button className="btn" onClick={handleAddTodo}>➕</button>
            </div>

            <ul>
                {list.map((todo, index) => (
                    <li className="task" key={todo.id}>
                        <strong className='taskText'>
                        {todo.todo}
                        </strong>
                        {index > 0 && <button onClick={() => moveUp(index)}>
                            ⬆
                        </button>
                        }
                        {index < list.length - 1 && <button onClick={() => moveDown(index)}>
                            ⬇
                        </button>
                        }
                        <button onClick={() => handleDeleteTodo(todo.id)}>
                            ❌
                        </button>
                    </li>
                ))}
            </ul>

            <label className="quadrant-color-picker" title="Quadrant color">
                <span>🎨</span>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(priority, e.target.value)}
                    aria-label={`${title} color`}
                />
            </label>
        </div>
    );
};

export default TodoList; 