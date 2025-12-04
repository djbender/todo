import { TodoList } from './components/TodoList';
import { ToastContainer } from './components/Toast';
import './App.css';

function App() {
  return (
    <>
      <TodoList />
      <ToastContainer />
      <footer>
        No data is persisted — refresh the page to start over.
      </footer>
    </>
  );
}

export default App;
