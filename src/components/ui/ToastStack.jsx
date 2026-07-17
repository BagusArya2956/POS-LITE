import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import Button from './Button.jsx'

function ToastStack({ notifications, onDismiss }) {
  if (notifications.length === 0) {
    return null
  }

  const toneIcon = {
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  }

  const toneClass = {
    success: 'border-emerald-200 bg-white',
    warning: 'border-amber-200 bg-white',
    info: 'border-blue-200 bg-white',
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => {
        const Icon = toneIcon[notification.tone] || CheckCircle2

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto rounded-3xl border p-4 shadow-lg ${toneClass[notification.tone] || toneClass.success}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-700">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-500">{notification.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-2 py-1"
                onClick={() => onDismiss(notification.id)}
              >
                Close
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ToastStack
