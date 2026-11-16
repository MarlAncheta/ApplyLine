import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import { Button } from '@/components/ui/button'
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/ui/feedback'

describe('LandingPage', () => {
  it('renders the brand, tagline, and calls to action', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getAllByText(/ApplyLine/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Your career\./).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Your lifeline\./).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Get started/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Log in/i })).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('renders children and respects disabled state', () => {
    render(<Button disabled>Submit</Button>)
    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toBeDisabled()
  })

  it('shows a spinner while loading', () => {
    render(<Button loading>Saving</Button>)
    expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled()
  })
})

describe('Badges and empty states', () => {
  it('renders human-readable status and priority labels', () => {
    render(<><StatusBadge status="under_review" /><PriorityBadge priority="high" /></>)
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders an empty state with a title', () => {
    render(<EmptyState title="Nothing here yet" description="Add something." />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByText('Add something.')).toBeInTheDocument()
  })
})

describe('LoginPage', () => {
  it('shows validation errors for empty fields', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    const button = screen.getByRole('button', { name: /Log in/i })
    button.click()
    const { waitFor } = await import('@testing-library/react')
    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email address/)).toBeInTheDocument()
      expect(screen.getByText(/Password is required/)).toBeInTheDocument()
    })
  })
})
