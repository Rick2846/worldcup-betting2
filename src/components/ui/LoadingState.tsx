interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = '読み込み中…' }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
