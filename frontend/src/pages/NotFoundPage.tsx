import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-2xl font-bold">This page went looking for a job</h1>
      <p className="max-w-sm text-muted">It isn't here. Let's get you back to something useful.</p>
      <Button asChild><Link to="/">Back to ApplyLine</Link></Button>
    </div>
  )
}
