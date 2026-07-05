import { Card } from '../components/Card'

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            This will be built in {phase}. Come back once your Garmin account is connected and
            syncing.
          </p>
        </div>
      </Card>
    </div>
  )
}
