import {
  calculateChampionPredictionPoints,
  calculateMatchPredictionPoints,
  sortRanking,
} from './scoring'
import { supabase } from './supabaseClient'
import type { RankingEntry } from '../types/app'
import type {
  ChampionPrediction,
  Match,
  MatchPrediction,
  MatchResult,
  Profile,
  Team,
  TournamentResult,
} from '../types/database'

export async function buildRanking(
  tournamentId: string,
): Promise<RankingEntry[]> {
  const [
    profilesRes,
    teamsRes,
    championPredsRes,
    matchesRes,
    matchPredsRes,
    matchResultsRes,
    tournamentResultRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('display_name'),
    supabase.from('teams').select('*'),
    supabase
      .from('champion_predictions')
      .select('*')
      .eq('tournament_id', tournamentId),
    supabase.from('matches').select('*').eq('tournament_id', tournamentId),
    supabase.from('match_predictions').select('*'),
    supabase.from('match_results').select('*'),
    supabase
      .from('tournament_results')
      .select('*')
      .eq('tournament_id', tournamentId)
      .maybeSingle(),
  ])

  if (profilesRes.error) throw profilesRes.error
  if (teamsRes.error) throw teamsRes.error
  if (championPredsRes.error) throw championPredsRes.error
  if (matchesRes.error) throw matchesRes.error
  if (matchPredsRes.error) throw matchPredsRes.error
  if (matchResultsRes.error) throw matchResultsRes.error
  if (tournamentResultRes.error) throw tournamentResultRes.error

  const profiles = profilesRes.data as Profile[]
  const teams = teamsRes.data as Team[]
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const championPreds = championPredsRes.data as ChampionPrediction[]
  const championPredByUser = new Map(
    championPreds.map((p) => [p.user_id, p]),
  )
  const matches = matchesRes.data as Match[]
  const matchIds = new Set(matches.map((m) => m.id))
  const matchPreds = (matchPredsRes.data as MatchPrediction[]).filter((p) =>
    matchIds.has(p.match_id),
  )
  const matchResults = (matchResultsRes.data as MatchResult[]).filter((r) =>
    matchIds.has(r.match_id),
  )
  const resultByMatchId = new Map(matchResults.map((r) => [r.match_id, r]))
  const tournamentResult = tournamentResultRes.data as TournamentResult | null

  const entries: RankingEntry[] = profiles.map((profile) => {
    const championPred = championPredByUser.get(profile.id)
    let championPoints = 0
    let predictedChampionTeamName: string | null = null

    if (championPred) {
      const team = teamById.get(championPred.team_id)
      predictedChampionTeamName = team?.name ?? null
      if (team && tournamentResult) {
        championPoints = calculateChampionPredictionPoints(
          championPred.team_id,
          team.champion_points,
          tournamentResult.champion_team_id,
          tournamentResult.runner_up_team_id,
          tournamentResult.third_place_team_id,
        )
      }
    }

    const userMatchPreds = matchPreds.filter((p) => p.user_id === profile.id)
    let matchPoints = 0
    for (const pred of userMatchPreds) {
      const result = resultByMatchId.get(pred.match_id)
      if (!result) continue
      matchPoints += calculateMatchPredictionPoints({
        predictedJapanScore: pred.japan_score_prediction,
        predictedOpponentScore: pred.opponent_score_prediction,
        predictedResult: pred.predicted_result,
        actualJapanScore: result.japan_score,
        actualOpponentScore: result.opponent_score,
        actualResult: result.actual_result,
      })
    }

    return {
      userId: profile.id,
      displayName: profile.display_name,
      totalPoints: championPoints + matchPoints,
      championPredictionPoints: championPoints,
      matchPredictionPoints: matchPoints,
      predictedChampionTeamName,
    }
  })

  return sortRanking(entries)
}
