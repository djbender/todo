import { vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { waitFor } from '../test/setup'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { todosApi } from '../services/api'
import { TodoList } from './TodoList'
import { ToastContainer } from './Toast'
import { setGetTodosShouldFail, setMockTodos } from '../services/mockApi'
import type { Todo } from '../types/todo'
import * as sortableModule from '@dnd-kit/sortable'

// eslint-disable-next-line no-var
var restoreUseSortable: () => void = () => {}

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@dnd-kit/sortable')>()
  const realImpl = (...args: Parameters<typeof mod.useSortable>) => mod.useSortable(...args)
  // var is hoisted above vi.mock so this assignment is safe
  restoreUseSortable = () => vi.mocked(sortableModule.useSortable).mockImplementation(realImpl)
  return { ...mod, useSortable: vi.fn().mockImplementation(realImpl) }
})

const user = userEvent.setup({ delay: null })

const defaultTodos: Todo[] = [
  { id: 'todo-1', title: 'Learn RTK Query', completed: false },
  { id: 'todo-2', title: 'Build a todo app', completed: true },
  { id: 'todo-3', title: 'Drag items to reorder', completed: false },
  { id: 'fail-test', title: '[FAIL] This update always fails', completed: false },
]

const createTestStore = () =>
  configureStore({
    reducer: { [todosApi.reducerPath]: todosApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(todosApi.middleware),
  })

/** Renders TodoList going through the full RTK Query async pipeline (for loading/error tests). */
const renderTodoList = () => {
  const store = createTestStore()
  return render(
    <Provider store={store}>
      <TodoList />
      <ToastContainer />
    </Provider>
  )
}

/**
 * Pre-seeds both the RTK Query cache (via upsertQueryData) and the mockApi
 * (for mutations that delegate to mockApi). The component sees cached data
 * on first render — no async query cycle needed.
 */
const renderWithData = async (todos: Todo[] = defaultTodos) => {
  setMockTodos(todos.map(t => ({ ...t })))
  const store = createTestStore()
  await store.dispatch(todosApi.util.upsertQueryData('getTodos', undefined, todos))
  return render(
    <Provider store={store}>
      <TodoList />
      <ToastContainer />
    </Provider>
  )
}

describe('TodoList', () => {
  it('shows loading state initially', () => {
    renderTodoList()
    expect(screen.getByText('Loading todos...')).toBeInTheDocument()
  })

  it('renders todos after loading', async () => {
    await renderWithData()
    expect(screen.getByText('Learn RTK Query')).toBeInTheDocument()
  })

  it('renders the header', async () => {
    await renderWithData()
    expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument()
  })

  it('renders add todo form', async () => {
    await renderWithData()
    expect(screen.getByPlaceholderText('Enter a new todo...')).toBeInTheDocument()
  })

  it('creates a new todo', async () => {
    await renderWithData()

    await user.type(screen.getByPlaceholderText('Enter a new todo...'), 'New test todo')
    await user.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(screen.getByText('New test todo')).toBeInTheDocument()
    })
  })

  it('clears input after creating todo', async () => {
    await renderWithData()

    const input = screen.getByPlaceholderText('Enter a new todo...')
    await user.type(input, 'Another todo')
    await user.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('toggles todo completion', async () => {
    await renderWithData()

    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[0]
    await user.click(firstCheckbox)

    await waitFor(() => {
      expect(firstCheckbox).toBeChecked()
    })
  })

  it('deletes a todo', async () => {
    await renderWithData()

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.queryByText('Learn RTK Query')).not.toBeInTheDocument()
    })
  })

  it('does not submit empty todo', async () => {
    await renderWithData()

    const initialTodoCount = screen.getAllByRole('listitem').length
    await user.click(screen.getByRole('button', { name: 'Add Todo' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(initialTodoCount)
  })

  it('shows error toast on toggle failure', async () => {
    await renderWithData()

    const checkboxes = screen.getAllByRole('checkbox')
    const failCheckbox = checkboxes[checkboxes.length - 1]
    await user.click(failCheckbox)

    await waitFor(() => {
      expect(screen.getByText('Failed to update todo')).toBeInTheDocument()
    })
  })

  it('shows error toast on delete failure', async () => {
    await renderWithData()

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    const failDeleteButton = deleteButtons[deleteButtons.length - 1]
    await user.click(failDeleteButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to delete todo')).toBeInTheDocument()
    })
  })

  it('ignores duplicate toggle while already toggling', async () => {
    await renderWithData()

    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[0]

    // Fire two clicks synchronously — second hits togglingIds guard
    fireEvent.click(firstCheckbox)
    fireEvent.click(firstCheckbox)

    await waitFor(() => {
      expect(firstCheckbox).toBeChecked()
    })
  })

  it('shows empty state when no todos', async () => {
    await renderWithData([])
    expect(screen.getByText('No todos yet. Add one to get started!')).toBeInTheDocument()
  })

  it('shows error state when getTodos fails', async () => {
    setGetTodosShouldFail(true)
    renderTodoList()

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('preserves temp ID mapping across renders', async () => {
    await renderWithData()

    // Create a todo (triggers temp→real ID mapping)
    await user.type(screen.getByPlaceholderText('Enter a new todo...'), 'Mapped todo')
    await user.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(screen.getByText('Mapped todo')).toBeInTheDocument()
    })

    // Toggle to trigger re-render (hits line 129 - already mapped check)
    const checkbox = screen.getAllByRole('checkbox')[0]
    await user.click(checkbox)

    await waitFor(() => {
      expect(checkbox).toBeChecked()
    })
  })

  it('marks item as animated after animation ends', async () => {
    await renderWithData()

    const todoItem = screen.getAllByRole('listitem')[0]
    expect(todoItem.getAttribute('data-animated')).toBe('false')

    // jsdom 28.1 exposes WebkitAnimation in element.style but lacks
    // AnimationEvent, causing React to listen for the webkit-prefixed
    // event name. Dispatch both so the test works regardless.
    fireEvent(todoItem, new Event('animationend', { bubbles: true }))
    fireEvent(todoItem, new Event('webkitAnimationEnd', { bubbles: true }))

    // Toggle a todo to trigger re-render
    const checkbox = screen.getAllByRole('checkbox')[0]
    await user.click(checkbox)

    await waitFor(() => {
      expect(todoItem.getAttribute('data-animated')).toBe('true')
    })
  })

  it('applies todo-item-dragging class when isDragging', async () => {
    vi.mocked(sortableModule.useSortable).mockImplementation(() => ({
      isDragging: true,
      active: null,
      activeIndex: -1,
      attributes: { role: 'button', tabIndex: 0, 'aria-disabled': false, 'aria-pressed': undefined, 'aria-roledescription': 'sortable', 'aria-describedby': '' },
      data: { current: { sortable: { containerId: '', index: 0, items: [] } } },
      rect: { current: null },
      index: 0,
      newIndex: 0,
      items: [],
      isOver: false,
      isSorting: false,
      listeners: undefined,
      node: { current: null },
      overIndex: -1,
      over: null,
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      setDroppableNodeRef: vi.fn(),
      setDraggableNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
    }))
    await renderWithData([{ id: 'todo-1', title: 'Dragging todo', completed: false }])
    expect(document.querySelector('.todo-item-dragging')).toBeInTheDocument()
    restoreUseSortable()
  })

})
