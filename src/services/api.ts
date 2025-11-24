import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { nanoid } from '@reduxjs/toolkit';
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
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Todo' as const, id })),
              { type: 'Todo', id: 'LIST' },
            ]
          : [{ type: 'Todo', id: 'LIST' }],
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
      async onQueryStarted(title, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          todosApi.util.updateQueryData('getTodos', undefined, (draft) => {
            draft.push({
              id: 'temp-' + nanoid(),
              title,
              completed: false,
            });
          })
        );
        try {
          const { data: newTodo } = await queryFulfilled;
          dispatch(
            todosApi.util.updateQueryData('getTodos', undefined, (draft) => {
              const tempIndex = draft.findIndex((todo) => todo.id.startsWith('temp-'));
              if (tempIndex !== -1) {
                draft[tempIndex].id = newTodo.id;
                draft[tempIndex].title = newTodo.title;
                draft[tempIndex].completed = newTodo.completed;
              }
            })
          );
        } catch {
          patchResult.undo();
        }
      },
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
      async onQueryStarted({ id, updates }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          todosApi.util.updateQueryData('getTodos', undefined, (draft) => {
            const todo = draft.find((t) => t.id === id);
            if (todo) {
              Object.assign(todo, updates);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          todosApi.util.updateQueryData('getTodos', undefined, (draft) => {
            const index = draft.findIndex((todo) => todo.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    reorderTodos: builder.mutation<Todo[], string[]>({
      queryFn: async (orderedIds) => {
        try {
          const data = await mockApi.reorderTodos(orderedIds);
          return { data };
        } catch (error) {
          return { error: { status: 500, data: 'Failed to reorder todos' } };
        }
      },
      async onQueryStarted(orderedIds, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          todosApi.util.updateQueryData('getTodos', undefined, (draft) => {
            // Optimistically reorder the todos
            const reordered = orderedIds
              .map(id => draft.find(todo => todo.id === id))
              .filter((todo): todo is Todo => todo !== undefined);
            draft.splice(0, draft.length, ...reordered);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetTodosQuery,
  useGetTodoByIdQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useReorderTodosMutation,
} = todosApi;
