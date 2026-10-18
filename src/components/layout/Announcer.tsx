import { useAnnouncement } from '@/lib/ui/announce'

export function Announcer() {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" data-testid="announcer" className="sr-only">
      {useAnnouncement()}
    </div>
  )
}
