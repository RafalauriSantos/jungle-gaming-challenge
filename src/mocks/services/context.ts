import type { AppEvent } from '@/api/events'
import type { Db } from '../db'

/** What a service may touch: the database, delayed work, and the outgoing event channel. */
export interface Ctx {
  db: Db
  schedule: (ms: number, job: () => void) => void
  publish: (event: AppEvent) => void
}
