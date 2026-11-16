import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Columns3,
  FileText,
  History,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: BriefcaseBusiness,
    title: 'Every application, one place',
    text: 'Track positions, statuses, priorities, notes, and deadlines without a spreadsheet circus.',
  },
  {
    icon: Columns3,
    title: 'Kanban that actually moves',
    text: 'Drag applications across stages. Your status changes are saved and logged automatically.',
  },
  {
    icon: CalendarDays,
    title: 'Dates that don’t sneak up',
    text: 'See interviews, follow-ups, and deadlines in one clean monthly or weekly calendar.',
  },
  {
    icon: Building2,
    title: 'Know your companies',
    text: 'Keep contacts, websites, and notes organized. One company, as many applications as you like.',
  },
  {
    icon: FileText,
    title: 'Documents, privately stored',
    text: 'Upload resumes and cover letters to secure cloud storage. Download them anytime.',
  },
  {
    icon: BarChart3,
    title: 'Progress you can see',
    text: 'Real statistics from your own data reveal what is working — and what needs a tweak.',
  },
]

const STEPS = [
  { n: '01', title: 'Add an opportunity', text: 'Log the role, company, and details you found out in the wild.' },
  { n: '02', title: 'Move it along', text: 'Update the status as you apply, interview, and hear back.' },
  { n: '03', title: 'Stay on top of it', text: 'Use reminders, interviews, and analytics to keep the search moving.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-background">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight">ApplyLine</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="hidden px-3 py-2 text-sm font-medium text-muted hover:text-text sm:block">
              Log in
            </Link>
            <Button asChild size="sm">
              <Link to="/register">Get started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for the job search, not the job board
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Your career. <span className="text-primary">Your lifeline.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Finding the right role is what keeps the search alive. ApplyLine helps you organize
              every application, interview, and deadline in one calm place — so you can focus on
              landing the job, not remembering where you applied.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/register">Start organizing — it's free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted">No AI. No noise. Just your search, under control.</p>
          </div>
        </section>

        <section className="border-y border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">Everything you need to stay organized</h2>
              <p className="mt-2 text-muted">Purpose-built features, nothing you don't need.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="card p-5 transition-colors hover:border-primary/40">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
              <p className="mt-2 text-muted">Three simple steps to a calmer job search.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.n} className="relative rounded-xl border border-border bg-surface p-6">
                  <span className="text-3xl font-extrabold text-primary/60">{step.n}</span>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface/40 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <History className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Your search, on the record</h2>
            <p className="mt-3 text-muted">
              Every status change and milestone is logged, so you always know how far you've come.
              Reading your own progress has a way of keeping you going.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/register">Create your free account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted">
                <BellRing className="h-4 w-4" /> Reminders included
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-background">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-semibold text-text">ApplyLine</span>
            <span>— Your career. Your lifeline.</span>
          </div>
          <p>© {new Date().getFullYear()} ApplyLine. Built for the search.</p>
        </div>
      </footer>
    </div>
  )
}
