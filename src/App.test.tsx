import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App'

const renderApp = () =>
  render(
    <Provider store={store}>
      <App />
    </Provider>
  )

describe('App', () => {
  it('renders footer with persistence note', () => {
    renderApp()
    expect(screen.getByText(/no data is persisted/i)).toBeInTheDocument()
  })
})
