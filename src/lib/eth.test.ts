import { describe, expect, it } from 'vitest'
import {
  addEth,
  centiToEth,
  compareEth,
  ethToCenti,
  formatEth,
  mulEth,
  parseEth,
  scaleEth,
  subEth,
  sumEth,
} from './eth'

describe('MON-1#1: ETH decimal strings keep exact precision', () => {
  it('MON-1#1: parses up to 18 decimals and rejects anything else', () => {
    expect(parseEth('1.19')).toBe(1_190_000_000_000_000_000n)
    expect(parseEth('0.000000000000000001')).toBe(1n)
    expect(parseEth('7')).toBe(7_000_000_000_000_000_000n)
    for (const bad of ['', '-1', '1e3', '1,5', '.5', '1.', 'abc', '0.0000000000000000001', ' 1']) {
      expect(() => parseEth(bad), bad).toThrow()
    }
  })

  it('MON-1#1: adds without floating point error', () => {
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(sumEth(['2.38', '8.34', '16.11'])).toBe('26.83')
    expect(addEth('26.83', '0.016')).toBe('26.846')
    expect(sumEth([])).toBe('0')
  })

  it('MON-1#1: subtracts and refuses a negative result', () => {
    expect(subEth('1', '0.3')).toBe('0.7')
    expect(() => subEth('0.1', '0.2')).toThrow()
  })

  it('MON-1#1: multiplies by an integer quantity only', () => {
    expect(mulEth('1.19', 3)).toBe('3.57')
    expect(mulEth('0.016', 2)).toBe('0.032')
    expect(mulEth('1.39', 6)).toBe('8.34')
    expect(() => mulEth('1', 1.5)).toThrow()
    expect(() => mulEth('1', -1)).toThrow()
  })

  it('MON-1#1: scales by a fraction, rounding down', () => {
    expect(scaleEth('1.00', 115n, 100n)).toBe('1.15')
    expect(scaleEth('0.001', 1n, 3n)).toBe('0.000333333333333333')
  })

  it('MON-1#1: compares', () => {
    expect(compareEth('0.1', '0.10')).toBe(0)
    expect(compareEth('0.09', '0.1')).toBeLessThan(0)
    expect(compareEth('12', '9.99')).toBeGreaterThan(0)
  })

  it('MON-1#1: formats with at least two decimals and never rounds', () => {
    expect(formatEth('1.19')).toBe('1.19 ETH')
    expect(formatEth('1.1')).toBe('1.10 ETH')
    expect(formatEth('0.016')).toBe('0.016 ETH')
    expect(formatEth('26.846000')).toBe('26.846 ETH')
    expect(formatEth('0')).toBe('0.00 ETH')
    expect(formatEth('0.123456789012345678')).toBe('0.123456789012345678 ETH')
    expect(formatEth('123456789.1')).toBe('123456789.10 ETH')
  })

  it('MON-1#1: maps to whole hundredths for range controls', () => {
    expect(ethToCenti('11.87')).toBe(1187)
    expect(ethToCenti('0.019')).toBe(1)
    expect(centiToEth(1187)).toBe('11.87')
    expect(centiToEth(2)).toBe('0.02')
  })
})
