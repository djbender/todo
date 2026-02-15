import { render, screen, fireEvent } from '@testing-library/react'
import { waitFor } from '../test/setup'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { todosApi } from '../services/api'
import { TodoList } from './TodoList'
import { ToastContainer } from './Toast'
import { setGetTodosShouldFail, setMockTodos } from '../services/mockApi'

const user = userEvent.setup({ delay: null })

const createTestStore = () =>
  configureStore({
    reducer: { [todosApi.reducerPath]: todosApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(todosApi.middleware),
  })

const renderTodoList = () => {
  const store = createTestStore()
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
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByText('Learn RTK Query')).toBeInTheDocument()
    })
  })

  it('renders the header', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument()
    })
  })

  it('renders add todo form', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a new todo...')).toBeInTheDocument()
    })
  })

  it('creates a new todo', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a new todo...')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Enter a new todo...'), 'New test todo')
    await user.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(screen.getByText('New test todo')).toBeInTheDocument()
    })
  })

  it('clears input after creating todo', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a new todo...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Enter a new todo...')
    await user.type(input, 'Another todo')
    await user.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('toggles todo completion', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByText('Learn RTK Query')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[0]
    await user.click(firstCheckbox)

    await waitFor(() => {
      expect(firstCheckbox).toBeChecked()
    })
  })

  it('deletes a todo', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByText('Learn RTK Query')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.queryByText('Learn RTK Query')).not.toBeInTheDocument()
    })
  })

  it('does not submit empty todo', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a new todo...')).toBeInTheDocument()
    })

    const initialTodoCount = screen.getAllByRole('listitem').length
    await user.click(screen.getByRole('button', { name: 'Add Todo' }))

    expect(screen.getAllByRole('listitem')).toHaveLength(initialTodoCount)
  })

  it('shows error toast on toggle failure', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByText('[FAIL] This update always fails')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox')
    const failCheckbox = checkboxes[checkboxes.length - 1]
    await user.click(failCheckbox)

    await waitFor(() => {
      expect(screen.getByText('Failed to update todo')).toBeInTheDocument()
    })
  })

  it('shows error toast on delete failure', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByText('[FAIL] This update always fails')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    const failDeleteButton = deleteButtons[deleteButtons.length - 1]
    await user.click(failDeleteButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to delete todo')).toBeInTheDocument()
    })
  })

  it('shows empty state when no todos', async () => {
    setMockTodos([])
    renderTodoList()

    await waitFor(() => {
      expect(screen.getByText('No todos yet. Add one to get started!')).toBeInTheDocument()
    })
  })

  it('shows error state when getTodos fails', async () => {
    setGetTodosShouldFail(true)
    renderTodoList()

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('preserves temp ID mapping across renders', async () => {
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter a new todo...')).toBeInTheDocument()
    })

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
    renderTodoList()
    await waitFor(() => {
      expect(screen.getByText('Learn RTK Query')).toBeInTheDocument()
    })

    const todoItem = screen.getAllByRole('listitem')[0]
    expect(todoItem.getAttribute('data-animated')).toBe('false')

    fireEvent.animationEnd(todoItem)

    // Toggle a todo to trigger re-render
    const checkbox = screen.getAllByRole('checkbox')[0]
    await user.click(checkbox)

    await waitFor(() => {
      expect(todoItem.getAttribute('data-animated')).toBe('true')
    })
  })

})
