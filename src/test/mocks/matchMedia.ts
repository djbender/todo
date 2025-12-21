type Listener = (e: { matches: boolean }) => void

let listeners: Listener[] = []
let currentMatches = false

export const matchMediaMock = {
  setMatches: (matches: boolean) => {
    currentMatches = matches
    listeners.forEach(fn => fn({ matches }))
  },
  reset: () => {
    listeners = []
    currentMatches = false
  },
}

Object.defineProperty(window, 'matchMedia', {
  value: () => ({
    matches: currentMatches,
    addEventListener: (_event: string, fn: Listener) => {
      listeners.push(fn)
    },
    removeEventListener: (_event: string, fn: Listener) => {
      listeners = listeners.filter(l => l !== fn)
    },
  }),
})
