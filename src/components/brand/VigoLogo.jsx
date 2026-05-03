import { cn } from '../../lib/helpers.js'

const sizeClasses = {
  sm: {
    frame: 'h-10 w-10 rounded-2xl',
    svg: 'h-5 w-5',
  },
  md: {
    frame: 'h-12 w-12 rounded-[20px]',
    svg: 'h-6 w-6',
  },
  lg: {
    frame: 'h-20 w-20 rounded-[28px]',
    svg: 'h-11 w-11',
  },
}

function VigoLogo({ size = 'md', className, frameClassName, glyphClassName, withBackground = true }) {
  const sizing = sizeClasses[size] || sizeClasses.md

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden',
        withBackground
          ? 'bg-white text-[#11183f] shadow-[0_16px_32px_rgba(15,23,42,0.12)] ring-1 ring-slate-200'
          : 'bg-transparent text-[#11183f]',
        sizing.frame,
        className,
        frameClassName,
      )}
    >
      <svg
        viewBox="0 0 88 80"
        fill="none"
        aria-hidden="true"
        className={cn(sizing.svg, glyphClassName)}
      >
        <path
          d="M8 10H38L60 48L44 76L8 10Z"
          fill="currentColor"
        />
        <path d="M56 10H84L60 44L48 26L56 10Z" fill="currentColor" />
      </svg>
    </div>
  )
}

export default VigoLogo
