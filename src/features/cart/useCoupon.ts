import { useState } from 'react'
import { useUser } from '@/session/store'

/** The coupon code the user typed, kept for this tab and this user so a reload does not lose it. */
export function useCoupon() {
  const user = useUser()
  const key = `kurio.${user?.id}.coupon`
  const [coupon, setCouponState] = useState(() => {
    try {
      return sessionStorage.getItem(key) ?? ''
    } catch {
      return ''
    }
  })
  const setCoupon = (value: string) => {
    setCouponState(value)
    try {
      if (value) sessionStorage.setItem(key, value)
      else sessionStorage.removeItem(key)
    } catch {
      // Storage may be unavailable; the code still works for this render.
    }
  }
  return [coupon, setCoupon] as const
}
