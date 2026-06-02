import type { MatchResultType } from './database'

export interface RankingEntry {
  userId: string
  displayName: string
  totalPoints: number
  championPredictionPoints: number
  matchPredictionPoints: number
  predictedChampionTeamName: string | null
}

export const RESULT_LABELS: Record<MatchResultType, string> = {
  japan_win: '日本勝利',
  draw: '引き分け',
  japan_loss: '日本敗北',
}

export const STAGE_LABELS: Record<string, string> = {
  group: 'グループステージ',
  round_of_16: 'ラウンド16',
  quarter_final: '準々決勝',
  semi_final: '準決勝',
  third_place: '3位決定戦',
  final: '決勝',
}
