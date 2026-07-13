import { OperationsCommandOverviewCard } from './OperationsCommandOverviewCard.jsx'

export function OperationsCommandOverviewCompatibility(props) {
  const { visibleReadinessOperations } = props

  return (
    <div className="operational-readiness-list" aria-label="Selected turnaround readiness workspace">
      {visibleReadinessOperations.map(item => (
        <OperationsCommandOverviewCard item={item} key={item.id} {...props} />
      ))}
    </div>
  )
}
