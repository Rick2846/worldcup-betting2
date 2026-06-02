export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isDeadlinePassed(deadlineIso: string, now = Date.now()): boolean {
  return new Date(deadlineIso).getTime() <= now
}

export function getTimeUntilDeadline(deadlineIso: string, now = Date.now()): string {
  const diff = new Date(deadlineIso).getTime() - now
  if (diff <= 0) return '締切済み'

  const totalMinutes = Math.floor(diff / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) {
    return `あと${days}日${hours}時間${minutes}分`
  }
  if (hours > 0) {
    return `あと${hours}時間${minutes}分`
  }
  return `あと${minutes}分`
}

/** datetime-local 形式 (YYYY-MM-DDTHH:mm) から24時間前を返す */
export function getDefaultPredictionDeadline(matchDatetimeLocal: string): string {
  if (!matchDatetimeLocal) return ''
  const matchDate = new Date(matchDatetimeLocal)
  if (Number.isNaN(matchDate.getTime())) return ''

  matchDate.setTime(matchDate.getTime() - 24 * 60 * 60 * 1000)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${matchDate.getFullYear()}-${pad(matchDate.getMonth() + 1)}-${pad(matchDate.getDate())}T${pad(matchDate.getHours())}:${pad(matchDate.getMinutes())}`
}

export function getReceptionStatus(deadlineIso: string): '受付中' | '締切済み' {
  return isDeadlinePassed(deadlineIso) ? '締切済み' : '受付中'
}
