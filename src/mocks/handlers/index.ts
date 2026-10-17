import { accountHandlers } from './account'
import { catalogHandlers } from './catalog'
import { commerceHandlers } from './commerce'

export const handlers = [...catalogHandlers, ...accountHandlers, ...commerceHandlers]
