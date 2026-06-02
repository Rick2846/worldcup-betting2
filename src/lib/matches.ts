import { isDeadlinePassed } from './date'
import type { Match, MatchPrediction } from '../types/database'
import { RESULT_LABELS } from '../types/app'

export function pickNextMatch(
  matches: Match[],
  matchIdsWithResult: Set<string>,
): Match | null {
  if (matches.length === 0) return null

  const now = Date.now()
  const candidates = matches.filter((m) => {
    const matchInFuture = new Date(m.match_datetime).getTime() > now
    const noResult = !matchIdsWithResult.has(m.id)
    return matchInFuture || noResult
  })

  const pool = candidates.length > 0 ? candidates : [...matches]

  pool.sort((a, b) => {
    const deadlineDiff =
      new Date(a.prediction_deadline).getTime() -
      new Date(b.prediction_deadline).getTime()
    if (deadlineDiff !== 0) return deadlineDiff
    return (
      new Date(a.match_datetime).getTime() - new Date(b.match_datetime).getTime()
    )
  })

  return pool[0]
}

export function formatMatchPredictionText(
  pred: MatchPrediction,
  match: Match,
): string {
  let text = `日本 ${pred.japan_score_prediction} - ${pred.opponent_score_prediction} ${match.opponent_team_name} / ${RESULT_LABELS[pred.predicted_result]}`
  if (pred.predict_penalty && pred.penalty_winner) {
    const winner =
      pred.penalty_winner === 'japan' ? '日本' : match.opponent_team_name
    text += `（PK：${winner}）`
  }
  return text
}

export function getResultStatus(hasResult: boolean): '結果入力済み' | '結果未入力' {
  return hasResult ? '結果入力済み' : '結果未入力'
}

export { isDeadlinePassed }
