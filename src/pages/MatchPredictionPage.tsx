import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmModal } from '../components/ConfirmModal'
import { getActiveTournament } from '../lib/auth'
import {
  formatDateTime,
  getTimeUntilDeadline,
  isDeadlinePassed,
} from '../lib/date'
import { formatMatchPredictionText } from '../lib/matches'
import { supabase } from '../lib/supabaseClient'
import { useAppOutletContext } from '../hooks/useOutletContext'
import { RESULT_LABELS, STAGE_LABELS } from '../types/app'
import type { Match, MatchPrediction, MatchResultType } from '../types/database'

export function MatchPredictionPage() {
  const { profile } = useAppOutletContext()
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')
  const [existingPred, setExistingPred] = useState<MatchPrediction | null>(null)
  const [japanScore, setJapanScore] = useState('0')
  const [opponentScore, setOpponentScore] = useState('0')
  const [predictedResult, setPredictedResult] =
    useState<MatchResultType>('japan_win')
  const [predictPenalty, setPredictPenalty] = useState(false)
  const [penaltyWinner, setPenaltyWinner] = useState<'japan' | 'opponent'>('japan')
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  const selectedMatch = matches.find((m) => m.id === selectedMatchId)
  const deadlinePassed =
    selectedMatch != null && isDeadlinePassed(selectedMatch.prediction_deadline, now)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const tournament = await getActiveTournament()
        if (!tournament) return

        const { data, error: err } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', tournament.id)
          .order('match_datetime')

        if (err) throw err
        const list = data as Match[]
        setMatches(list)
        if (list.length > 0) {
          setSelectedMatchId(list[0].id)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedMatchId) return

    async function loadPred() {
      const { data, error: err } = await supabase
        .from('match_predictions')
        .select('*')
        .eq('match_id', selectedMatchId)
        .eq('user_id', profile.id)
        .maybeSingle()

      if (err) {
        setError(err.message)
        return
      }
      setExistingPred(data)
    }
    loadPred()
  }, [selectedMatchId, profile.id])

  async function handleSubmit() {
    if (!selectedMatch) return
    const js = parseInt(japanScore, 10)
    const os = parseInt(opponentScore, 10)
    if (Number.isNaN(js) || Number.isNaN(os) || js < 0 || os < 0) {
      setError('スコアは0以上の整数で入力してください')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('match_predictions').insert({
      match_id: selectedMatch.id,
      user_id: profile.id,
      japan_score_prediction: js,
      opponent_score_prediction: os,
      predicted_result: predictedResult,
      predict_penalty: selectedMatch.is_knockout && predictPenalty,
      penalty_winner:
        selectedMatch.is_knockout && predictPenalty ? penaltyWinner : null,
    })

    setSubmitting(false)
    setShowConfirm(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setExistingPred({
      id: '',
      match_id: selectedMatch.id,
      user_id: profile.id,
      japan_score_prediction: js,
      opponent_score_prediction: os,
      predicted_result: predictedResult,
      predict_penalty: selectedMatch.is_knockout && predictPenalty,
      penalty_winner:
        selectedMatch.is_knockout && predictPenalty ? penaltyWinner : null,
      created_at: new Date().toISOString(),
    })
  }

  if (loading) return <p>読み込み中…</p>

  if (matches.length === 0) {
    return (
      <div className="card">
        <h2>日本戦予想</h2>
        <p className="muted">まだ試合が登録されていません。</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>日本戦予想</h2>

      <div className="form-row">
        <label htmlFor="match">試合を選択</label>
        <select
          id="match"
          value={selectedMatchId}
          onChange={(e) => {
            setSelectedMatchId(e.target.value)
            setExistingPred(null)
            setError(null)
          }}
        >
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              日本 vs {m.opponent_team_name}（{STAGE_LABELS[m.stage] ?? m.stage}）
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <>
          <div className="deadline-banner">
            <p>
              <strong>予想締切：</strong>
              {formatDateTime(selectedMatch.prediction_deadline)}
            </p>
            <p>
              <strong>締切まで：</strong>
              {getTimeUntilDeadline(selectedMatch.prediction_deadline, now)}
            </p>
          </div>

          {existingPred ? (
            <>
              <p>
                あなたの予想：
                <br />
                <strong>
                  {formatMatchPredictionText(existingPred, selectedMatch)}
                </strong>
              </p>
              <p className="muted">
                この予想はすでに提出済みです。提出後の変更はできません。
              </p>
            </>
          ) : deadlinePassed ? (
            <p>予想受付は終了しました。あなたはこの試合の予想を提出していません。</p>
          ) : (
            <>
              <h3>日本 vs {selectedMatch.opponent_team_name}</h3>
              <div className="form-row">
                <label htmlFor="japan">日本の得点</label>
                <input
                  id="japan"
                  type="number"
                  min={0}
                  value={japanScore}
                  onChange={(e) => setJapanScore(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="opponent">
                  {selectedMatch.opponent_team_name}の得点
                </label>
                <input
                  id="opponent"
                  type="number"
                  min={0}
                  value={opponentScore}
                  onChange={(e) => setOpponentScore(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="result">勝敗予想</label>
                <select
                  id="result"
                  value={predictedResult}
                  onChange={(e) =>
                    setPredictedResult(e.target.value as MatchResultType)
                  }
                >
                  <option value="japan_win">日本勝利</option>
                  <option value="draw">引き分け</option>
                  <option value="japan_loss">日本敗北</option>
                </select>
              </div>

              {selectedMatch.is_knockout && (
                <>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={predictPenalty}
                        onChange={(e) => setPredictPenalty(e.target.checked)}
                      />{' '}
                      PK戦になる
                    </label>
                  </div>
                  {predictPenalty && (
                    <div className="form-row">
                      <label htmlFor="pk">PK後の勝者</label>
                      <select
                        id="pk"
                        value={penaltyWinner}
                        onChange={(e) =>
                          setPenaltyWinner(e.target.value as 'japan' | 'opponent')
                        }
                      >
                        <option value="japan">日本</option>
                        <option value="opponent">
                          {selectedMatch.opponent_team_name}
                        </option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {error && <p className="error">{error}</p>}

              <button type="button" onClick={() => setShowConfirm(true)}>
                予想を提出する
              </button>

              <ConfirmModal
                open={showConfirm}
                title="提出の確認"
                message={`この予想は提出後に変更できません。\n本当に提出しますか？\n\n予想：日本 ${japanScore} - ${opponentScore} ${selectedMatch.opponent_team_name} / ${RESULT_LABELS[predictedResult]}`}
                onConfirm={handleSubmit}
                onCancel={() => setShowConfirm(false)}
                loading={submitting}
              />
            </>
          )}
        </>
      )}

      <p style={{ marginTop: '1rem' }}>
        <Link to="/matches/list">日本戦予想一覧を見る →</Link>
      </p>
    </div>
  )
}
