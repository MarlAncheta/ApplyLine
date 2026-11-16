import { describe, it, expect } from 'vitest'
import { cn, formatBytes, titleCase } from '@/lib/utils'

describe('utility helpers', () => {
  it('merges tailwind classes with later values winning', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-muted', 'text-primary')).toBe('text-primary')
  })

  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(1024 * 1024 * 3)).toBe('3.0 MB')
  })

  it('converts snake_case to title case', () => {
    expect(titleCase('under_review')).toBe('Under Review')
    expect(titleCase('offer')).toBe('Offer')
  })
})
