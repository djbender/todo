import '@testing-library/jest-dom'
import { waitFor as rtlWaitFor } from '@testing-library/react'
import { afterEach } from 'vitest'
import './mocks/localStorage'
import { matchMediaMock } from './mocks/matchMedia'
import { resetMockApi } from '../services/mockApi'

export const waitFor: typeof rtlWaitFor = (cb, options) =>
  rtlWaitFor(cb, { interval: 10, ...options })

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  matchMediaMock.reset()
  resetMockApi()
})
