import { nanoid } from '@reduxjs/toolkit';
import type { Todo } from '../types/todo';

// Simulated database
let todos: Todo[] = [
  { id: nanoid(), title: 'Learn RTK Query', completed: false },
  { id: nanoid(), title: 'Build a todo app', completed: false },
  { id: 'fail-test', title: '[TEST] This update always fails', completed: false },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async getTodos(): Promise<Todo[]> {
    console.log('[Mock API] GET /todos');
    await delay(500);
    console.log('[Mock API] Response:', todos);
    return [...todos];
  },

  async getTodoById(id: string): Promise<Todo | undefined> {
    console.log('[Mock API] GET /todos/' + id);
    await delay(300);
    const todo = todos.find(todo => todo.id === id);
    console.log('[Mock API] Response:', todo);
    return todo;
  },

  async createTodo(title: string): Promise<Todo> {
    console.log('[Mock API] POST /todos', { title });
    await delay(500);
    const newTodo: Todo = {
      id: nanoid(),
      title,
      completed: false,
    };
    todos.push(newTodo);
    console.log('[Mock API] Response:', newTodo);
    return newTodo;
  },

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    console.log('[Mock API] PATCH /todos/' + id, updates);
    await delay(500);

    // Test case: always fail updates to the test item
    if (id === 'fail-test') {
      console.log('[Mock API] Response: Error - simulated failure');
      throw new Error('Simulated update failure');
    }

    const index = todos.findIndex(todo => todo.id === id);
    if (index === -1) throw new Error('Todo not found');
    todos[index] = { ...todos[index], ...updates };
    console.log('[Mock API] Response:', todos[index]);
    return todos[index];
  },

  async deleteTodo(id: string): Promise<void> {
    console.log('[Mock API] DELETE /todos/' + id);
    await delay(500);
    todos = todos.filter(todo => todo.id !== id);
    console.log('[Mock API] Response: deleted');
  },
};
