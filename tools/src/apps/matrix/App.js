import './App.css';
import TodoList from './components/todo';

function Matrix() {
  return (
    <div className="App">
      <div className="flex-grid">
        <div className="grid-item">
          <TodoList title="Do First" priority="1" />
        </div>
        <div className="grid-item">
          <TodoList title="Schedule" priority="2" />
        </div>
        <div className="grid-item">
          <TodoList title="Delegate" priority="3" />
        </div>
        <div className="grid-item">
          <TodoList title="Don-t do" priority="4" />
        </div>
      </div>
    </div>
  );
}

export default Matrix;
