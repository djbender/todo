import { configureStore } from '@reduxjs/toolkit'
import { todosApi } from './api'
import { mockApi, resetMockApi } from './mockApi'

const createTestStore = () =>
  configureStore({
    reducer: { [todosApi.reducerPath]: todosApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(todosApi.middleware),
  })

describe('todosApi', () => {
  beforeEach(() => {
    resetMockApi()
  })

  describe('getTodoById', () => {
    it('returns todo when found', async () => {
      const store = createTestStore()
      // First get all todos to find an ID
      const todosResult = await store.dispatch(todosApi.endpoints.getTodos.initiate())
      const todoId = todosResult.data![0].id

      const result = await store.dispatch(todosApi.endpoints.getTodoById.initiate(todoId))
      expect(result.data?.id).toBe(todoId)
    })

    it('returns 404 error when todo not found', async () => {
      const store = createTestStore()
      const result = await store.dispatch(todosApi.endpoints.getTodoById.initiate('nonexistent-id'))
      expect(result.error).toEqual({ status: 404, data: 'Todo not found' })
    })

    it('returns 500 error when mockApi throws', async () => {
      const store = createTestStore()
      vi.spyOn(mockApi, 'getTodoById').mockRejectedValueOnce(new Error('boom'))
      const result = await store.dispatch(todosApi.endpoints.getTodoById.initiate('any-id'))
      expect(result.error).toEqual({ status: 500, data: 'Failed to fetch todo' })
    })
  })

  describe('createTodo', () => {
    it('returns error when creation fails', async () => {
      const store = createTestStore()
      // First populate cache so optimistic update can run
      await store.dispatch(todosApi.endpoints.getTodos.initiate())

      const result = await store.dispatch(todosApi.endpoints.createTodo.initiate('[FAIL]'))
      expect(result.error).toEqual({ status: 500, data: 'Failed to create todo' })
    })

    it('rolls back optimistic update on failure', async () => {
      const store = createTestStore()
      // Get initial todos
      const initial = await store.dispatch(todosApi.endpoints.getTodos.initiate())
      const initialCount = initial.data!.length

      // Try to create failing todo
      await store.dispatch(todosApi.endpoints.createTodo.initiate('[FAIL]'))

      // Verify rollback - cache should have same count
      const state = store.getState()
      const cached = todosApi.endpoints.getTodos.select()(state)
      expect(cached.data?.length).toBe(initialCount)
    })
  })

  describe('reorderTodos', () => {
    it('reorders todos successfully', async () => {
      const store = createTestStore()
      // Get initial todos
      const initial = await store.dispatch(todosApi.endpoints.getTodos.initiate())
      const ids = initial.data!.map(t => t.id)

      // Reverse order
      const reversed = [...ids].reverse()
      const result = await store.dispatch(todosApi.endpoints.reorderTodos.initiate(reversed))

      expect(result.data?.map(t => t.id)).toEqual(reversed)
    })

    it('applies optimistic reorder', async () => {
      const store = createTestStore()
      // Get initial todos
      const initial = await store.dispatch(todosApi.endpoints.getTodos.initiate())
      const ids = initial.data!.map(t => t.id)

      // Reverse order
      const reversed = [...ids].reverse()
      await store.dispatch(todosApi.endpoints.reorderTodos.initiate(reversed))

      // Check cache reflects reorder
      const state = store.getState()
      const cached = todosApi.endpoints.getTodos.select()(state)
      expect(cached.data?.map(t => t.id)).toEqual(reversed)
    })

    it('returns error when reorder fails', async () => {
      const store = createTestStore()
      vi.spyOn(mockApi, 'reorderTodos').mockRejectedValueOnce(new Error('boom'))
      const result = await store.dispatch(todosApi.endpoints.reorderTodos.initiate(['a']))
      expect(result.error).toEqual({ status: 500, data: 'Failed to reorder todos' })
    })

    it('rolls back optimistic reorder on failure', async () => {
      const store = createTestStore()
      const initial = await store.dispatch(todosApi.endpoints.getTodos.initiate())
      const originalIds = initial.data!.map(t => t.id)

      vi.spyOn(mockApi, 'reorderTodos').mockRejectedValueOnce(new Error('boom'))
      await store.dispatch(todosApi.endpoints.reorderTodos.initiate([...originalIds].reverse()))

      // Cache should roll back to original order
      const state = store.getState()
      const cached = todosApi.endpoints.getTodos.select()(state)
      expect(cached.data?.map(t => t.id)).toEqual(originalIds)
    })
  })
})
