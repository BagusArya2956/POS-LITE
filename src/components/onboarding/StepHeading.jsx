export function StepHeading({ eyebrow, title, description, align = 'left' }) {
  return <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-2xl`}>
    {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>}
    <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">{title}</h1>
    {description && <p className="mt-3 text-base leading-7 text-slate-500 sm:text-lg">{description}</p>}
  </div>
}
