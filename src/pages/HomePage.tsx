import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveTournament } from '../lib/auth'
import {
  formatDateTime,
  getReceptionStatus,
  getTimeUntilDeadline,
} from '../lib/date'
import { buildRanking } from '../lib/ranking'
import {
  formatMatchPredictionText,
  getResultStatus,
  isDeadlinePassed,
  pickNextMatch,
} from '../lib/matches'
import { supabase } from '../lib/supabaseClient'
import { useAppOutletContext } from '../hooks/useOutletContext'
import { STAGE_LABELS } from '../types/app'
import type { RankingEntry } from '../types/app'
import type {
  ChampionPrediction,
  Match,
  MatchPrediction,
  MatchResult,
  Tournament,
} from '../types/database'

export function HomePage() {
  const { profile } = useAppOutletContext()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [myChampion, setMyChampion] = useState<ChampionPrediction | null>(null)
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [nextMatchHasResult, setNextMatchHasResult] = useState(false)
  const [myMatchPred, setMyMatchPred] = useState<MatchPrediction | null>(null)
  const [topRanking, setTopRanking] = useState<RankingEntry[]>([])
  const [myRanking, setMyRanking] = useState<RankingEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const t = await getActiveTournament()
        setTournament(t)
        if (!t) return

        const [championRes, matchesRes, resultsRes, ranking] = await Promise.all([
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
          supabase.from('match_results').select('match_id'),
          buildRanking(t.id),
        ])

        if (championRes.error) throw championRes.error
        if (matchesRes.error) throw matchesRes.error
        if (resultsRes.error) throw resultsRes.error

        setMyChampion(championRes.data)
        const matches = matchesRes.data as Match[]
        const resultIds = new Set(
          (resultsRes.data as Pick<MatchResult, 'match_id'>[]).map((r) => r.match_id),
        )
        const upcoming = pickNextMatch(matches, resultIds)
        setNextMatch(upcoming)
        setNextMatchHasResult(upcoming ? resultIds.has(upcoming.id) : false)

        if (upcoming) {
          const predRes = await supabase
            .from('match_predictions')
            .select('*')
            .eq('match_id', upcoming.id)
            .eq('user_id', profile.id)
            .maybeSingle()
          if (predRes.error) throw predRes.error
          setMyMatchPred(predRes.data)
        } else {
          setMyMatchPred(null)
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

  const deadlinePassed = nextMatch
    ? isDeadlinePassed(nextMatch.prediction_deadline, now)
    : false

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

      {nextMatch ? (
        <div className="card">
          <h2>次の日本戦</h2>
          <p>
            <strong>
              日本 vs {nextMatch.opponent_team_name}
            </strong>
          </p>
          <ul className="match-meta-list">
            <li>ステージ: {STAGE_LABELS[nextMatch.stage] ?? nextMatch.stage}</li>
            <li>試合日時: {formatDateTime(nextMatch.match_datetime)}</li>
            <li>予想締切: {formatDateTime(nextMatch.prediction_deadline)}</li>
            <li>締切まで: {getTimeUntilDeadline(nextMatch.prediction_deadline, now)}</li>
            <li>
              ステータス:{' '}
              <strong>{getReceptionStatus(nextMatch.prediction_deadline)}</strong>
              {' / '}
              {getResultStatus(nextMatchHasResult)}
            </li>
          </ul>

          <p>
            あなたの予想：
            {myMatchPred ? (
              <strong> {formatMatchPredictionText(myMatchPred, nextMatch)}</strong>
            ) : deadlinePassed ? (
              <strong> 未提出（締切済み）</strong>
            ) : (
              <>
                <strong> 未提出</strong>
                <br />
                <Link to="/matches" className="btn" style={{ marginTop: '0.5rem' }}>
                  この試合を予想する
                </Link>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="card">
          <h2>次の日本戦</h2>
          <p className="muted">まだ試合が登録されていません。</p>
        </div>
      )}

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
          <Link to="/matches/list">日本戦予想一覧を見る →</Link>
        </p>
      </div>

      {tournament && <p className="muted">大会: {tournament.name}</p>}
    </>
  )
}
