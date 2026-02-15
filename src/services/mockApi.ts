import { nanoid } from '@reduxjs/toolkit';
import type { Todo } from '../types/todo';

const initialTodos = (): Todo[] => [
  { id: nanoid(), title: 'Learn RTK Query', completed: false },
  { id: nanoid(), title: 'Build a todo app', completed: true },
  { id: nanoid(), title: 'Drag items to reorder', completed: false },
  { id: 'fail-test', title: '[FAIL] This update always fails', completed: false },
];

// Simulated database
let todos: Todo[] = initialTodos();

let shouldFailGetTodos = false;

export const resetMockApi = () => {
  todos = initialTodos();
  shouldFailGetTodos = false;
};

export const setMockTodos = (newTodos: Todo[]) => {
  todos = newTodos;
};

export const setGetTodosShouldFail = (fail: boolean) => {
  shouldFailGetTodos = fail;
};

// Helper to simulate network delay
const delay = (ms: number) =>
  import.meta.env.MODE === 'test'
    ? Promise.resolve()
    : /* c8 ignore next -- only runs outside test mode */ new Promise(resolve => setTimeout(resolve, ms));

/* c8 ignore start -- logging disabled in test mode */
const log = (...args: unknown[]) => {
  if (import.meta.env.MODE !== 'test') console.log(...args);
};
/* c8 ignore stop */

export const mockApi = {
  async getTodos(): Promise<Todo[]> {
    log('[Mock API] GET /todos');
    await delay(500);
    if (shouldFailGetTodos) {
      throw new Error('Simulated getTodos failure');
    }
    log('[Mock API] Response:', todos);
    return [...todos];
  },

  async getTodoById(id: string): Promise<Todo | undefined> {
    log('[Mock API] GET /todos/' + id);
    await delay(300);
    const todo = todos.find(todo => todo.id === id);
    log('[Mock API] Response:', todo);
    return todo;
  },

  async createTodo(title: string): Promise<Todo> {
    log('[Mock API] POST /todos', { title });
    await delay(500);
    if (title === '[FAIL]') {
      throw new Error('Simulated create failure');
    }
    const newTodo: Todo = {
      id: nanoid(),
      title,
      completed: false,
    };
    todos.push(newTodo);
    log('[Mock API] Response:', newTodo);
    return newTodo;
  },

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    log('[Mock API] PATCH /todos/' + id, updates);
    await delay(500);

    // Test case: always fail updates to the test item
    if (id === 'fail-test') {
      log('[Mock API] Response: Error - simulated failure');
      throw new Error('Simulated update failure');
    }

    const index = todos.findIndex(todo => todo.id === id);
    if (index === -1) throw new Error('Todo not found');
    todos[index] = { ...todos[index], ...updates };
    log('[Mock API] Response:', todos[index]);
    return todos[index];
  },

  async deleteTodo(id: string): Promise<void> {
    log('[Mock API] DELETE /todos/' + id);
    await delay(500);

    // Test case: always fail deletes of the test item
    if (id === 'fail-test') {
      log('[Mock API] Response: Error - simulated failure');
      throw new Error('Simulated delete failure');
    }

    todos = todos.filter(todo => todo.id !== id);
    log('[Mock API] Response: deleted');
  },

  async reorderTodos(orderedIds: string[]): Promise<Todo[]> {
    log('[Mock API] POST /todos/reorder', orderedIds);
    await delay(300);

    // Reorder todos array based on orderedIds
    const reordered = orderedIds
      .map(id => todos.find(todo => todo.id === id))
      .filter((todo): todo is Todo => todo !== undefined);

    todos = reordered;
    log('[Mock API] Response:', todos);
    return [...todos];
  },
};
