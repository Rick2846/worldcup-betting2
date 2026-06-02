import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getActiveTournament } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
import { useAppOutletContext } from '../hooks/useOutletContext'
import { RESULT_LABELS } from '../types/app'
import type {
  Match,
  MatchResultType,
  MatchStage,
  Team,
  Tournament,
  TournamentResult,
} from '../types/database'

export function AdminPage() {
  const { profile } = useAppOutletContext()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [tournamentResult, setTournamentResult] = useState<TournamentResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [opponentName, setOpponentName] = useState('')
  const [stage, setStage] = useState<MatchStage>('group')
  const [matchDatetime, setMatchDatetime] = useState('')
  const [predictionDeadline, setPredictionDeadline] = useState('')
  const [isKnockout, setIsKnockout] = useState(false)

  const [resultMatchId, setResultMatchId] = useState('')
  const [japanScore, setJapanScore] = useState('0')
  const [opponentScore, setOpponentScore] = useState('0')
  const [actualResult, setActualResult] = useState<MatchResultType>('japan_win')

  const [championTeamId, setChampionTeamId] = useState('')
  const [runnerUpTeamId, setRunnerUpTeamId] = useState('')
  const [thirdPlaceTeamId, setThirdPlaceTeamId] = useState('')

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  async function reload() {
    const t = await getActiveTournament()
    setTournament(t)
    if (!t) return

    const [teamsRes, matchesRes, trRes] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('matches').select('*').eq('tournament_id', t.id).order('match_datetime'),
      supabase.from('tournament_results').select('*').eq('tournament_id', t.id).maybeSingle(),
    ])

    if (teamsRes.data) setTeams(teamsRes.data as Team[])
    if (matchesRes.data) {
      const m = matchesRes.data as Match[]
      setMatches(m)
      if (m.length > 0 && !resultMatchId) setResultMatchId(m[0].id)
    }
    if (trRes.data) {
      const tr = trRes.data as TournamentResult
      setTournamentResult(tr)
      setChampionTeamId(tr.champion_team_id ?? '')
      setRunnerUpTeamId(tr.runner_up_team_id ?? '')
      setThirdPlaceTeamId(tr.third_place_team_id ?? '')
    }
  }

  useEffect(() => {
    reload().catch((e) =>
      setError(e instanceof Error ? e.message : '読み込みに失敗しました'),
    )
  }, [])

  async function updateTeamPoints(teamId: string, points: number) {
    setError(null)
    const { error: err } = await supabase
      .from('teams')
      .update({ champion_points: points })
      .eq('id', teamId)
    if (err) setError(err.message)
    else {
      setMessage('チームポイントを更新しました')
      await reload()
    }
  }

  async function addMatch(e: React.FormEvent) {
    e.preventDefault()
    if (!tournament) return
    setError(null)

    const { error: err } = await supabase.from('matches').insert({
      tournament_id: tournament.id,
      opponent_team_name: opponentName,
      stage,
      match_datetime: new Date(matchDatetime).toISOString(),
      prediction_deadline: new Date(predictionDeadline).toISOString(),
      is_knockout: isKnockout,
    })

    if (err) setError(err.message)
    else {
      setMessage('試合を追加しました')
      setOpponentName('')
      await reload()
    }
  }

  async function saveMatchResult(e: React.FormEvent) {
    e.preventDefault()
    if (!resultMatchId) return
    setError(null)

    const payload = {
      match_id: resultMatchId,
      japan_score: parseInt(japanScore, 10),
      opponent_score: parseInt(opponentScore, 10),
      actual_result: actualResult,
      went_to_penalty: false,
      penalty_winner: null,
      updated_at: new Date().toISOString(),
    }

    const existing = await supabase
      .from('match_results')
      .select('id')
      .eq('match_id', resultMatchId)
      .maybeSingle()

    const err = existing.data
      ? (
          await supabase
            .from('match_results')
            .update(payload)
            .eq('match_id', resultMatchId)
        ).error
      : (await supabase.from('match_results').insert(payload)).error

    if (err) setError(err.message)
    else {
      setMessage('試合結果を保存しました')
      await reload()
    }
  }

  async function saveTournamentResult(e: React.FormEvent) {
    e.preventDefault()
    if (!tournament) return
    setError(null)

    const payload = {
      tournament_id: tournament.id,
      champion_team_id: championTeamId || null,
      runner_up_team_id: runnerUpTeamId || null,
      third_place_team_id: thirdPlaceTeamId || null,
      updated_at: new Date().toISOString(),
    }

    const err = tournamentResult
      ? (
          await supabase
            .from('tournament_results')
            .update(payload)
            .eq('tournament_id', tournament.id)
        ).error
      : (await supabase.from('tournament_results').insert(payload)).error

    if (err) setError(err.message)
    else {
      setMessage('大会最終結果を保存しました')
      await reload()
    }
  }

  return (
    <>
      <div className="card">
        <h2>管理者ページ</h2>
        {message && <p className="muted">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>チーム設定ポイント</h2>
        {teams.map((team) => (
          <TeamPointsRow key={team.id} team={team} onSave={updateTeamPoints} />
        ))}
      </div>

      <div className="card">
        <h2>日本戦の追加</h2>
        <form onSubmit={addMatch}>
          <div className="form-row">
            <label>相手国名</label>
            <input
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>ステージ</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as MatchStage)}
            >
              <option value="group">グループ</option>
              <option value="round_of_16">ラウンド16</option>
              <option value="quarter_final">準々決勝</option>
              <option value="semi_final">準決勝</option>
              <option value="third_place">3位決定戦</option>
              <option value="final">決勝</option>
            </select>
          </div>
          <div className="form-row">
            <label>試合日時</label>
            <input
              type="datetime-local"
              value={matchDatetime}
              onChange={(e) => setMatchDatetime(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>予想締切</label>
            <input
              type="datetime-local"
              value={predictionDeadline}
              onChange={(e) => setPredictionDeadline(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={isKnockout}
                onChange={(e) => setIsKnockout(e.target.checked)}
              />{' '}
              ノックアウト（PK予想可）
            </label>
          </div>
          <button type="submit">試合を追加</button>
        </form>
      </div>

      <div className="card">
        <h2>試合結果の入力</h2>
        <form onSubmit={saveMatchResult}>
          <div className="form-row">
            <label>試合</label>
            <select
              value={resultMatchId}
              onChange={(e) => setResultMatchId(e.target.value)}
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  日本 vs {m.opponent_team_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>日本得点</label>
            <input
              type="number"
              min={0}
              value={japanScore}
              onChange={(e) => setJapanScore(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>相手得点</label>
            <input
              type="number"
              min={0}
              value={opponentScore}
              onChange={(e) => setOpponentScore(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>結果</label>
            <select
              value={actualResult}
              onChange={(e) =>
                setActualResult(e.target.value as MatchResultType)
              }
            >
              {(Object.keys(RESULT_LABELS) as MatchResultType[]).map((k) => (
                <option key={k} value={k}>
                  {RESULT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">結果を保存</button>
        </form>
      </div>

      <div className="card">
        <h2>大会最終結果</h2>
        <form onSubmit={saveTournamentResult}>
          <div className="form-row">
            <label>優勝</label>
            <select
              value={championTeamId}
              onChange={(e) => setChampionTeamId(e.target.value)}
            >
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>準優勝</label>
            <select
              value={runnerUpTeamId}
              onChange={(e) => setRunnerUpTeamId(e.target.value)}
            >
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>3位</label>
            <select
              value={thirdPlaceTeamId}
              onChange={(e) => setThirdPlaceTeamId(e.target.value)}
            >
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">最終結果を保存</button>
        </form>
      </div>
    </>
  )
}

function TeamPointsRow({
  team,
  onSave,
}: {
  team: Team
  onSave: (id: string, points: number) => void
}) {
  const [points, setPoints] = useState(String(team.champion_points))

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
      <span style={{ minWidth: 120 }}>{team.name}</span>
      <input
        type="number"
        min={0}
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        style={{ width: 80 }}
      />
      <button type="button" onClick={() => onSave(team.id, parseInt(points, 10))}>
        保存
      </button>
    </div>
  )
}
