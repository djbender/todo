import { mockApi, resetMockApi } from './mockApi'

describe('mockApi', () => {
  beforeEach(() => {
    resetMockApi()
  })

  describe('getTodoById', () => {
    it('returns todo when found', async () => {
      const todos = await mockApi.getTodos()
      const todo = await mockApi.getTodoById(todos[0].id)
      expect(todo).toEqual(todos[0])
    })

    it('returns undefined when not found', async () => {
      const todo = await mockApi.getTodoById('nonexistent')
      expect(todo).toBeUndefined()
    })
  })

  describe('createTodo', () => {
    it('throws error for [FAIL] title', async () => {
      await expect(mockApi.createTodo('[FAIL]')).rejects.toThrow('Simulated create failure')
    })
  })

  describe('updateTodo', () => {
    it('throws error when todo not found', async () => {
      await expect(mockApi.updateTodo('nonexistent', { completed: true }))
        .rejects.toThrow('Todo not found')
    })
  })

  describe('reorderTodos', () => {
    it('reorders todos based on provided IDs', async () => {
      const todos = await mockApi.getTodos()
      const ids = todos.map(t => t.id)
      const reversed = [...ids].reverse()

      const result = await mockApi.reorderTodos(reversed)

      expect(result.map(t => t.id)).toEqual(reversed)
    })

    it('filters out nonexistent IDs', async () => {
      const todos = await mockApi.getTodos()
      const ids = [todos[0].id, 'nonexistent', todos[1].id]

      const result = await mockApi.reorderTodos(ids)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(todos[0].id)
      expect(result[1].id).toBe(todos[1].id)
    })
  })
})
