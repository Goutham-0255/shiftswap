import { describe, expect, it } from 'vitest'
import { formatShiftTime, shiftHours, shiftParts } from './format'

describe('formatShiftTime', () => {
  it('shows a day shift on one line', () => {
    expect(formatShiftTime({ start: '2026-03-02T07:00', end: '2026-03-02T15:00' })).toBe(
      'Mon 2 Mar, 07:00–15:00',
    )
  })

  it('shows both days for a night shift that crosses midnight', () => {
    expect(formatShiftTime({ start: '2026-03-08T23:00', end: '2026-03-09T07:00' })).toBe(
      'Sun 8 Mar, 23:00 – Mon 9 Mar, 07:00',
    )
  })

  it('handles a night shift that crosses into a new month', () => {
    expect(formatShiftTime({ start: '2026-03-31T22:00', end: '2026-04-01T06:00' })).toBe(
      'Tue 31 Mar, 22:00 – Wed 1 Apr, 06:00',
    )
  })
})

describe('shiftHours', () => {
  it('counts a day shift', () => {
    expect(shiftHours({ start: '2026-03-02T07:00', end: '2026-03-02T15:00' })).toBe(8)
  })

  it('counts a night shift across midnight', () => {
    expect(shiftHours({ start: '2026-03-08T23:00', end: '2026-03-09T07:00' })).toBe(8)
  })

  it('counts half hours', () => {
    expect(shiftHours({ start: '2026-03-02T07:00', end: '2026-03-02T19:30' })).toBe(12.5)
  })
})

describe('shiftParts', () => {
  it('marks a night shift as ending the next day', () => {
    expect(shiftParts({ start: '2026-03-08T23:00', end: '2026-03-09T07:00' })).toEqual({
      day: 'Sun 8 Mar',
      time: '23:00 – 07:00 (next day)',
    })
  })
})
