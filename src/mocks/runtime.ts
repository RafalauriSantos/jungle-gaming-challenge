import { db } from './db'
import { createScheduler } from './scheduler'
import type { Ctx } from './services/context'
import { realtime } from './socket'

const scheduler = createScheduler(db)

/** The services' view of the running mock: the database, delayed jobs, and the socket. */
export const ctx: Ctx = { db, schedule: scheduler.after, publish: realtime.publish }
