import type { ReactNode } from 'react'

export function PageHeader({
  title,
  count,
  subtitle,
  actions,
}: {
  title: string
  count?: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <h1>
          {title}
          {count && <span className="count">{count}</span>}
        </h1>
        <p className="muted">{subtitle}</p>
      </div>
      {actions}
    </div>
  )
}
