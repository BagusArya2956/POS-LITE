import { cn } from '../../lib/helpers.js'

function Card({ children, className, padded = true }) {
  return <div className={cn('panel-card', padded && 'p-5 lg:p-6', className)}>{children}</div>
}

export default Card
