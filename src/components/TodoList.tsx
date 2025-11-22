import React, { useState } from 'react';
import {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} from '../services/api';

export const TodoList: React.FC = () => {
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const { data: todos, isLoading, isError, error } = useGetTodosQuery();
  const [createTodo, { isLoading: isCreating }] = useCreateTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      await createTodo(newTodoTitle).unwrap();
      setNewTodoTitle('');
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateTodo({ id, updates: { completed: !completed } }).unwrap();
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id).unwrap();
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  if (isLoading) {
    return <main><p>Loading todos...</p></main>;
  }

  if (isError) {
    return <main><mark>Error: {JSON.stringify(error)}</mark></main>;
  }

  return (
    <main>
      <h1>My Todo List</h1>

      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="Enter a new todo..."
          disabled={isCreating}
        />
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Adding...' : 'Add Todo'}
        </button>
      </form>

      <ul className="todo-list">
        {todos?.map((todo) => (
          <li key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id, todo.completed)}
            />
            <span className={todo.completed ? 'completed' : ''}>
              {todo.title}
            </span>
            <button onClick={() => handleDelete(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {todos?.length === 0 && (
        <p className="empty-state">No todos yet. Add one to get started!</p>
      )}
    </main>
  );
};
