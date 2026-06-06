import { useEffect, useState } from 'react'
import { ConfirmModal } from '../components/ConfirmModal'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { getActiveTournament } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
import { useAppOutletContext } from '../hooks/useOutletContext'
import type {
  ChampionPrediction,
  Team,
  Tournament,
} from '../types/database'

export function ChampionPredictionPage() {
  const { profile } = useAppOutletContext()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [existing, setExisting] = useState<
    (ChampionPrediction & { teams: Team }) | null
  >(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deadlinePassed =
    tournament?.champion_prediction_deadline != null &&
    new Date(tournament.champion_prediction_deadline) <= new Date()

  useEffect(() => {
    async function load() {
      try {
        const t = await getActiveTournament()
        setTournament(t)
        if (!t) return

        const [teamsRes, predRes] = await Promise.all([
          supabase.from('teams').select('*').order('champion_points'),
          supabase
            .from('champion_predictions')
            .select('*, teams(*)')
            .eq('tournament_id', t.id)
            .eq('user_id', profile.id)
            .maybeSingle(),
        ])

        if (teamsRes.error) throw teamsRes.error
        if (predRes.error) throw predRes.error

        setTeams(teamsRes.data as Team[])
        if (predRes.data) {
          const row = predRes.data as ChampionPrediction & { teams: Team }
          setExisting(row)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile.id])

  async function handleSubmit() {
    if (!tournament || !selectedTeamId) return
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('champion_predictions')
      .insert({
        tournament_id: tournament.id,
        user_id: profile.id,
        team_id: selectedTeamId,
      })

    setSubmitting(false)
    setShowConfirm(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    const team = teams.find((t) => t.id === selectedTeamId)
    setExisting({
      id: '',
      tournament_id: tournament.id,
      user_id: profile.id,
      team_id: selectedTeamId,
      created_at: new Date().toISOString(),
      teams: team!,
    })
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  if (loading) return <LoadingState />
  if (!tournament) return <Alert variant="error">有効な大会が見つかりません</Alert>

  if (existing) {
    return (
      <>
        <PageHeader title="優勝国予想" description="提出済みの予想です" />
        <div className="card card--submitted">
          <Badge variant="success">提出済み</Badge>
          <div className="confirmed-pick">
            <span className="confirmed-pick__flag" aria-hidden="true">
              🏆
            </span>
            <div>
              <div className="confirmed-pick__name">{existing.teams.name}</div>
              <div className="confirmed-pick__pts">
                {existing.teams.champion_points}pt
              </div>
            </div>
          </div>
          <p className="muted">提出後の変更はできません。</p>
        </div>
      </>
    )
  }

  if (deadlinePassed) {
    return (
      <>
        <PageHeader title="優勝国予想" />
        <div className="card">
          <Badge variant="muted">受付終了</Badge>
          <p style={{ marginTop: '0.75rem' }}>
            予想受付は終了しました。あなたは優勝国予想を提出していません。
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="優勝国予想"
        description="優勝国を1つ選んでください。提出後は変更できません。"
      />

      <div className="card">
        <div className="team-grid">
          {teams.map((team) => (
            <label key={team.id} className="team-option">
              <input
                type="radio"
                name="team"
                value={team.id}
                checked={selectedTeamId === team.id}
                onChange={() => setSelectedTeamId(team.id)}
              />
              <span className="team-option__name">{team.name}</span>
              <Badge variant="gold">{team.champion_points}pt</Badge>
              <span className="team-option__check" aria-hidden="true">
                ✓
              </span>
            </label>
          ))}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <button
          type="button"
          disabled={!selectedTeamId}
          onClick={() => setShowConfirm(true)}
        >
          予想を提出する
        </button>

        <ConfirmModal
          open={showConfirm}
          title="提出の確認"
          message={`この予想は提出後に変更できません。\n本当に提出しますか？\n\n予想：${selectedTeam?.name ?? ''}`}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      </div>
    </>
  )
}
