import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { matchMediaMock } from '../test/mocks/matchMedia'
import { DarkModeToggle } from './DarkModeToggle'

describe('DarkModeToggle', () => {
  it('renders a switch', () => {
    render(<DarkModeToggle />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('defaults to light mode', () => {
    render(<DarkModeToggle />)
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('toggles to dark mode on click', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('toggles back to light mode on second click', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('saves dark mode to localStorage', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('restores dark mode from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    document.documentElement.setAttribute('data-theme', 'dark')
    render(<DarkModeToggle />)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('sets data-theme attribute on document', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('has accessible label for light mode', () => {
    render(<DarkModeToggle />)
    expect(screen.getByRole('switch')).toHaveAccessibleName('Switch to dark mode')
  })

  it('has accessible label for dark mode', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).toHaveAccessibleName('Switch to light mode')
  })

  it('saves light mode to localStorage', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    await userEvent.click(screen.getByRole('switch'))
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('sets data-theme to light when toggling back', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    await userEvent.click(screen.getByRole('switch'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('reads initial state from data-theme attribute', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    render(<DarkModeToggle />)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('follows system preference when no user preference', () => {
    render(<DarkModeToggle />)
    act(() => {
      matchMediaMock.setMatches(true)
    })
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('ignores system preference when user has set preference', async () => {
    render(<DarkModeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    await userEvent.click(screen.getByRole('switch'))
    act(() => {
      matchMediaMock.setMatches(true)
    })
    expect(screen.getByRole('switch')).not.toBeChecked()
  })
})
