export type UserRole = 'user' | 'admin'
export type MatchResultType = 'japan_win' | 'draw' | 'japan_loss'
export type PenaltyWinner = 'japan' | 'opponent'
export type MatchStage =
  | 'group'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final'

export interface Profile {
  id: string
  display_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  champion_prediction_deadline: string | null
  is_active: boolean
  created_at: string
}

export interface Team {
  id: string
  name: string
  champion_points: number
  created_at: string
}

export interface ChampionPrediction {
  id: string
  tournament_id: string
  user_id: string
  team_id: string
  created_at: string
}

export interface Match {
  id: string
  tournament_id: string
  opponent_team_name: string
  stage: MatchStage
  match_datetime: string
  prediction_deadline: string
  is_knockout: boolean
  created_at: string
}

export interface MatchPrediction {
  id: string
  match_id: string
  user_id: string
  japan_score_prediction: number
  opponent_score_prediction: number
  predicted_result: MatchResultType
  predict_penalty: boolean
  penalty_winner: PenaltyWinner | null
  created_at: string
}

export interface MatchResult {
  id: string
  match_id: string
  japan_score: number
  opponent_score: number
  actual_result: MatchResultType
  went_to_penalty: boolean
  penalty_winner: PenaltyWinner | null
  created_at: string
  updated_at: string
}

export interface TournamentResult {
  id: string
  tournament_id: string
  champion_team_id: string | null
  runner_up_team_id: string | null
  third_place_team_id: string | null
  created_at: string
  updated_at: string
}
