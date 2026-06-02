import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveTournament } from '../lib/auth'
import { buildRanking } from '../lib/ranking'
import { supabase } from '../lib/supabaseClient'
import { useAppOutletContext } from '../hooks/useOutletContext'
import type { RankingEntry } from '../types/app'
import type { ChampionPrediction, Match, MatchPrediction, Tournament } from '../types/database'

export function HomePage() {
  const { profile } = useAppOutletContext()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [myChampion, setMyChampion] = useState<ChampionPrediction | null>(null)
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [myMatchPred, setMyMatchPred] = useState<MatchPrediction | null>(null)
  const [topRanking, setTopRanking] = useState<RankingEntry[]>([])
  const [myRanking, setMyRanking] = useState<RankingEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const t = await getActiveTournament()
        setTournament(t)
        if (!t) return

        const [championRes, matchesRes, ranking] = await Promise.all([
          supabase
            .from('champion_predictions')
            .select('*')
            .eq('tournament_id', t.id)
            .eq('user_id', profile.id)
            .maybeSingle(),
          supabase
            .from('matches')
            .select('*')
            .eq('tournament_id', t.id)
            .order('match_datetime'),
          buildRanking(t.id),
        ])

        if (championRes.error) throw championRes.error
        if (matchesRes.error) throw matchesRes.error

        setMyChampion(championRes.data)
        const matches = matchesRes.data as Match[]
        const now = Date.now()
        const upcoming =
          matches.find((m) => new Date(m.prediction_deadline).getTime() > now) ??
          matches[matches.length - 1] ??
          null
        setNextMatch(upcoming)

        if (upcoming) {
          const predRes = await supabase
            .from('match_predictions')
            .select('*')
            .eq('match_id', upcoming.id)
            .eq('user_id', profile.id)
            .maybeSingle()
          if (predRes.error) throw predRes.error
          setMyMatchPred(predRes.data)
        }

        setTopRanking(ranking.slice(0, 3))
        setMyRanking(ranking.find((r) => r.userId === profile.id) ?? null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile.id])

  if (loading) return <p>読み込み中…</p>

  return (
    <>
      <div className="card">
        <h2>あなたの成績</h2>
        {myRanking ? (
          <p>
            合計 <strong>{myRanking.totalPoints}pt</strong>
            （優勝国 {myRanking.championPredictionPoints}pt / 日本戦{' '}
            {myRanking.matchPredictionPoints}pt）
          </p>
        ) : (
          <p className="muted">ランキングデータがありません</p>
        )}
      </div>

      <div className="card">
        <h2>ランキング上位</h2>
        {topRanking.length === 0 ? (
          <p className="muted">まだデータがありません</p>
        ) : (
          <ol>
            {topRanking.map((r, i) => (
              <li key={r.userId}>
                {i + 1}位 {r.displayName} — {r.totalPoints}pt
              </li>
            ))}
          </ol>
        )}
        <p>
          <Link to="/ranking">ランキングを見る →</Link>
        </p>
      </div>

      <div className="card">
        <h2>提出状況</h2>
        <p>
          優勝国予想：{' '}
          {myChampion ? (
            <strong>提出済み</strong>
          ) : (
            <Link to="/champion">未提出 — 予想する</Link>
          )}
        </p>
        <p>
          次の日本戦（
          {nextMatch
            ? `日本 vs ${nextMatch.opponent_team_name}`
            : '試合未登録'}
          ）：{' '}
          {nextMatch ? (
            myMatchPred ? (
              <strong>提出済み</strong>
            ) : new Date(nextMatch.prediction_deadline) > new Date() ? (
              <Link to="/matches">未提出 — 予想する</Link>
            ) : (
              <span className="muted">締切済み（未提出）</span>
            )
          ) : (
            <span className="muted">—</span>
          )}
        </p>
      </div>

      {tournament && (
        <p className="muted">大会: {tournament.name}</p>
      )}
    </>
  )
}
