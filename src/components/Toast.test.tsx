import { render, screen, act } from '@testing-library/react'
import { ToastContainer, toast } from './Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders empty container', () => {
    render(<ToastContainer />)
    expect(document.querySelector('.toast-container')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<ToastContainer />)
    act(() => {
      toast.error('Something went wrong')
    })
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('applies error class', () => {
    render(<ToastContainer />)
    act(() => {
      toast.error('Error message')
    })
    expect(document.querySelector('.toast.error')).toBeInTheDocument()
  })

  it('shows success message', () => {
    render(<ToastContainer />)
    act(() => {
      toast.success('Saved successfully')
    })
    expect(screen.getByText('Saved successfully')).toBeInTheDocument()
  })

  it('applies success class', () => {
    render(<ToastContainer />)
    act(() => {
      toast.success('Success message')
    })
    expect(document.querySelector('.toast.success')).toBeInTheDocument()
  })

  it('auto-dismisses after 3 seconds', () => {
    render(<ToastContainer />)
    act(() => {
      toast.error('Temporary message')
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.queryByText('Temporary message')).not.toBeInTheDocument()
  })

  it('shows multiple toasts simultaneously', () => {
    render(<ToastContainer />)
    act(() => {
      toast.error('Error 1')
      toast.success('Success 1')
    })
    expect(document.querySelectorAll('.toast')).toHaveLength(2)
  })
})
