interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = '提出する',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? '送信中…' : confirmLabel}
          </button>
          <button type="button" className="secondary" onClick={onCancel} disabled={loading}>
            戻る
          </button>
        </div>
      </div>
    </div>
  )
}
