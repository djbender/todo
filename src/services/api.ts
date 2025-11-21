import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { mockApi } from './mockApi';
import type { Todo } from '../types/todo';

export const todosApi = createApi({
  reducerPath: 'todosApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Todo'],
  endpoints: (builder) => ({
    getTodos: builder.query<Todo[], void>({
      queryFn: async () => {
        try {
          const data = await mockApi.getTodos();
          return { data };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to fetch todos' } };
        }
      },
      providesTags: ['Todo'],
    }),

    getTodoById: builder.query<Todo, string>({
      queryFn: async (id) => {
        try {
          const data = await mockApi.getTodoById(id);
          if (!data) {
            return { error: { status: 404, data: 'Todo not found' } };
          }
          return { data };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to fetch todo' } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Todo', id }],
    }),

    createTodo: builder.mutation<Todo, string>({
      queryFn: async (title) => {
        try {
          const data = await mockApi.createTodo(title);
          return { data };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to create todo' } };
        }
      },
      invalidatesTags: ['Todo'],
    }),

    updateTodo: builder.mutation<Todo, { id: string; updates: Partial<Todo> }>({
      queryFn: async ({ id, updates }) => {
        try {
          const data = await mockApi.updateTodo(id, updates);
          return { data };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to update todo' } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Todo', id }, 'Todo'],
    }),

    deleteTodo: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await mockApi.deleteTodo(id);
          return { data: undefined };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to delete todo' } };
        }
      },
      invalidatesTags: ['Todo'],
    }),
  }),
});

export const {
  useGetTodosQuery,
  useGetTodoByIdQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todosApi;
