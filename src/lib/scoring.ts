import type { MatchResultType } from '../types/database'
import type { RankingEntry } from '../types/app'

export function calculateChampionPredictionPoints(
  predictedTeamId: string,
  predictedTeamPoints: number,
  championTeamId: string | null,
  runnerUpTeamId: string | null,
  thirdPlaceTeamId: string | null,
): number {
  if (predictedTeamId === championTeamId) {
    return predictedTeamPoints
  }
  if (predictedTeamId === runnerUpTeamId) {
    return predictedTeamPoints / 2
  }
  if (predictedTeamId === thirdPlaceTeamId) {
    return predictedTeamPoints / 4
  }
  return 0
}

export function calculateMatchPredictionPoints(params: {
  predictedJapanScore: number
  predictedOpponentScore: number
  predictedResult: MatchResultType
  actualJapanScore: number
  actualOpponentScore: number
  actualResult: MatchResultType
}): number {
  const resultHit = params.predictedResult === params.actualResult
  const scoreHit =
    params.predictedJapanScore === params.actualJapanScore &&
    params.predictedOpponentScore === params.actualOpponentScore

  let points = 0
  if (resultHit) {
    points += 10
  }
  if (resultHit && scoreHit) {
    points += 5
  }
  return points
}

export function sortRanking(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    return b.championPredictionPoints - a.championPredictionPoints
  })
}
