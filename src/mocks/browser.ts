import { setupWorker } from 'msw/browser'
import { control } from './control'
import { handlers } from './handlers'
import { socketHandlers } from './socket'

declare global {
  interface Window {
    __mock?: typeof control
  }
}

window.__mock = control
export const worker = setupWorker(...handlers, ...socketHandlers)
