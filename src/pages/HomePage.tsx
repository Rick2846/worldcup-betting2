import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE_CATCHCOPY } from '../constants/branding'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { Podium } from '../components/ui/Podium'
import { StatCard } from '../components/ui/StatCard'
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

  if (loading) return <LoadingState />

  const deadlinePassed = nextMatch
    ? isDeadlinePassed(nextMatch.prediction_deadline, now)
    : false

  const receptionOpen =
    nextMatch && !isDeadlinePassed(nextMatch.prediction_deadline, now)

  return (
    <>
      <div className="hero-banner">
        <p className="hero-banner__catchcopy">{SITE_CATCHCOPY}</p>
        <p className="hero-banner__greeting">{profile.display_name} さん、おかえりなさい</p>
      </div>

      {myRanking && (
        <div className="stat-grid">
          <StatCard label="合計ポイント" value={`${myRanking.totalPoints}`} sub="pt" accent />
          <StatCard
            label="優勝国"
            value={`${myRanking.championPredictionPoints}`}
            sub="pt"
          />
          <StatCard
            label="日本戦"
            value={`${myRanking.matchPredictionPoints}`}
            sub="pt"
          />
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>ランキング TOP 3</h2>
        {topRanking.length === 0 ? (
          <EmptyState title="まだデータがありません" />
        ) : (
          <>
            <Podium
              entries={topRanking.map((r, i) => ({
                rank: i + 1,
                name: r.displayName,
                points: r.totalPoints,
                highlight: r.userId === profile.id,
              }))}
            />
            <Link to="/ranking" className="link-arrow">
              全順位を見る
            </Link>
          </>
        )}
      </div>

      {nextMatch ? (
        <div className="card card--featured">
          <div className="match-card__title">
            <span className="match-card__teams">
              日本 vs {nextMatch.opponent_team_name}
            </span>
            <Badge variant={receptionOpen ? 'success' : 'muted'}>
              {getReceptionStatus(nextMatch.prediction_deadline)}
            </Badge>
            <Badge variant={nextMatchHasResult ? 'gold' : 'default'}>
              {getResultStatus(nextMatchHasResult)}
            </Badge>
          </div>

          <div className="match-meta">
            <div className="match-meta__item">
              <span className="match-meta__label">ステージ</span>
              <span className="match-meta__value">
                {STAGE_LABELS[nextMatch.stage] ?? nextMatch.stage}
              </span>
            </div>
            <div className="match-meta__item">
              <span className="match-meta__label">試合日時</span>
              <span className="match-meta__value">
                {formatDateTime(nextMatch.match_datetime)}
              </span>
            </div>
            <div className="match-meta__item">
              <span className="match-meta__label">予想締切</span>
              <span className="match-meta__value">
                {formatDateTime(nextMatch.prediction_deadline)}
              </span>
            </div>
            <div className="match-meta__item">
              <span className="match-meta__label">締切まで</span>
              <span className="match-meta__value match-meta__value--countdown">
                {getTimeUntilDeadline(nextMatch.prediction_deadline, now)}
              </span>
            </div>
          </div>

          <div className="submission-status__item">
            <span className="submission-status__label">あなたの予想</span>
            {myMatchPred ? (
              <Badge variant="success">
                {formatMatchPredictionText(myMatchPred, nextMatch)}
              </Badge>
            ) : deadlinePassed ? (
              <Badge variant="danger">未提出（締切済み）</Badge>
            ) : (
              <Badge variant="warning">未提出</Badge>
            )}
          </div>

          {!myMatchPred && !deadlinePassed && (
            <div className="btn-group">
              <Link to="/matches" className="btn">
                この試合を予想する
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2>次の日本戦</h2>
          <EmptyState
            title="まだ試合が登録されていません"
            description="管理者が試合を追加するまでお待ちください"
          />
        </div>
      )}

      <div className="card">
        <h2>提出状況</h2>
        <div className="submission-status">
          <div className="submission-status__item">
            <span className="submission-status__label">優勝国予想</span>
            {myChampion ? (
              <Badge variant="success">提出済み</Badge>
            ) : (
              <Link to="/champion" className="btn btn--ghost">
                予想する
              </Link>
            )}
          </div>
          <div className="submission-status__item">
            <span className="submission-status__label">日本戦一覧</span>
            <Link to="/matches/list" className="link-arrow">
              全員の予想を見る
            </Link>
          </div>
        </div>
      </div>

      {tournament && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          大会: {tournament.name}
        </p>
      )}
    </>
  )
}
