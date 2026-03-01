import { describe, expect, it } from 'vitest'
import router from './index'

describe('router', () => {
  it('contains core routes', () => {
    expect(router.hasRoute('login')).toBe(true)
    expect(router.hasRoute('orders')).toBe(true)
    expect(router.hasRoute('menu')).toBe(true)
    expect(router.hasRoute('stats')).toBe(true)
  })
})
