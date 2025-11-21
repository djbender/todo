import type { Todo } from '../types/todo';

// Simulated database
let todos: Todo[] = [
  { id: '1', title: 'Learn RTK Query', completed: false },
  { id: '2', title: 'Build a todo app', completed: false },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  async getTodos(): Promise<Todo[]> {
    await delay(500);
    return [...todos];
  },

  async getTodoById(id: string): Promise<Todo | undefined> {
    await delay(300);
    return todos.find(todo => todo.id === id);
  },

  async createTodo(title: string): Promise<Todo> {
    await delay(500);
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
    };
    todos.push(newTodo);
    return newTodo;
  },

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    await delay(500);
    const index = todos.findIndex(todo => todo.id === id);
    if (index === -1) throw new Error('Todo not found');
    todos[index] = { ...todos[index], ...updates };
    return todos[index];
  },

  async deleteTodo(id: string): Promise<void> {
    await delay(500);
    todos = todos.filter(todo => todo.id !== id);
  },
};
