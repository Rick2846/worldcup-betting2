import { useEffect, useState } from 'react'
import { getActiveTournament } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
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

  if (loading) return <p>読み込み中…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="card">
      <h2>優勝国予想一覧</h2>
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
              <td>{teamName ?? '未提出'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
