/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS?: string
  /** Socket.IO server origin; empty means the page's own origin. */
  readonly VITE_REALTIME_URL?: string
}
