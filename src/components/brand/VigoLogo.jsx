import { cn } from '../../lib/helpers.js'

const sizeClasses = {
  sm: { frame: 'h-10 w-10 rounded-[12px]', svg: 'h-6 w-6' },
  md: { frame: 'h-11 w-11 rounded-[14px]', svg: 'h-6 w-6' },
  lg: { frame: 'h-[72px] w-[72px] rounded-[20px]', svg: 'h-10 w-10' },
}

function VigoLogo({ size = 'md', className, frameClassName, glyphClassName, withBackground = true }) {
  const sizing = sizeClasses[size] || sizeClasses.md

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
        withBackground
          ? 'bg-black text-white shadow-[0_6px_18px_rgba(15,23,42,0.16)]'
          : 'bg-transparent text-slate-950',
        sizing.frame,
        className,
        frameClassName,
      )}
      aria-label="VIGO"
      role="img"
    >
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn(sizing.svg, glyphClassName)}>
        <path d="M7 10H16.2L24 29.2L31.8 10H41L28.2 38H19.8L7 10Z" fill="currentColor" />
      </svg>
    </div>
  )
}

export default VigoLogo
