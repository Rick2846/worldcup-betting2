import { useEffect, useState } from 'react'
import { getActiveTournament } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import type { Profile, Team } from '../types/database'

interface ListRow {
  profile: Profile
  teamName: string | null
}

export function ChampionPredictionsListPage() {
  const [rows, setRows] = useState<ListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const tournament = await getActiveTournament()
        if (!tournament) {
          setError('有効な大会が見つかりません')
          return
        }

        const [profilesRes, predsRes, teamsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('display_name'),
          supabase
            .from('champion_predictions')
            .select('*')
            .eq('tournament_id', tournament.id),
          supabase.from('teams').select('*'),
        ])

        if (profilesRes.error) throw profilesRes.error
        if (predsRes.error) throw predsRes.error
        if (teamsRes.error) throw teamsRes.error

        const profiles = profilesRes.data as Profile[]
        const teams = teamsRes.data as Team[]
        const teamById = new Map(teams.map((t) => [t.id, t]))
        const predByUser = new Map(
          predsRes.data.map((p) => [p.user_id, p.team_id]),
        )

        setRows(
          profiles.map((profile) => {
            const teamId = predByUser.get(profile.id)
            return {
              profile,
              teamName: teamId ? (teamById.get(teamId)?.name ?? '—') : null,
            }
          }),
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingState />
  if (error) return <Alert variant="error">{error}</Alert>

  return (
    <>
      <PageHeader title="優勝国予想一覧" description="メンバー全員の優勝国予想" />

      <div className="card">
        {rows.length === 0 ? (
          <EmptyState title="メンバーがいません" />
        ) : (
          <div className="table-wrap">
            <table className="list-table">
              <thead>
                <tr>
                  <th>名前</th>
                  <th>予想</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ profile, teamName }) => (
                  <tr key={profile.id}>
                    <td>{profile.display_name}</td>
                    <td>
                      {teamName ? (
                        <Badge variant="default">{teamName}</Badge>
                      ) : (
                        <Badge variant="muted">未提出</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
