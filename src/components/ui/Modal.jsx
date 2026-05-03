import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/helpers.js'

function Modal({ open, onClose, title, children, className, contentClassName }) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className={cn('surface-card w-full max-w-3xl overflow-hidden', className)}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={cn('max-h-[80vh] overflow-y-auto p-6', contentClassName)}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export default Modal
