import React, { useState, useEffect } from 'react';

const TodoList = (props) => {
    const [inputTask, setInputTask] = useState('');
    const [list, setList] = useState(JSON.parse(window.localStorage.getItem('dbPriority' + props.priority)) ?? []);

    const handleAddTodo = () => {
        const newTask = {
            id: crypto.randomUUID(),
            todo: inputTask
            //order: Math.max(...list.map(e=> e.order ?? 0),0)+1
        };
        setList([...list, newTask]);
        setInputTask('');
    };

    useEffect(() => {
        saveInDb();
    }, [list]);

    const handleDeleteTodo = (id) => {
        const newList = list.filter((todo) => todo.id !== id);
        setList(newList);
    };

    const handleInputChange = (event) => {
        setInputTask(event.target.value);
        console.log(event);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter')
            handleAddTodo();
    }

    const saveInDb = () => {
        window.localStorage.setItem('dbPriority' + props.priority, JSON.stringify(list));
    }

    const moveUp = (index) => {
        if (index > 0) {
            const updatedList = [...list];
            [updatedList[index], updatedList[index - 1]] =
                [updatedList[index - 1], updatedList[index]];
            setList(updatedList);
        }
    }

    const moveDown = (index) => {
        if (index < list.length - 1) {
            const updatedList = [...list];
            [updatedList[index], updatedList[index + 1]] =
                [updatedList[index + 1], updatedList[index]];
            setList(updatedList);
        }
    }

    return (
        <div className="Todo">
            <h1>{props.title}</h1>

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
                        {index < list.length -1 && <button onClick={() => moveDown(index)}>
                            ⬇
                        </button>
                        }
                        <button onClick={() => handleDeleteTodo(todo.id)}>
                            ❌
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TodoList; 