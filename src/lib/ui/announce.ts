import { useSyncExternalStore } from 'react'

// One polite live region for the whole app (see `Announcer`). Messages from mutations and from
// real-time changes land here so assistive tech hears them without moving focus.
let message = ''
const listeners = new Set<() => void>()

export function announce(text: string) {
  message = ''
  listeners.forEach((l) => l())
  // Clear first, set on the next tick: the same text twice in a row is still read again.
  setTimeout(() => {
    message = text
    listeners.forEach((l) => l())
  }, 50)
}

export const useAnnouncement = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
    () => message,
    () => '',
  )
