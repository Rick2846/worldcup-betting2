-- テストデータ一括削除
-- Supabase Dashboard → SQL Editor → New query に貼り付けて Run
--
-- 削除対象:
--   - 登録済みの日本戦（matches）と試合結果・日本戦予想
--   - 全員の優勝国予想（本番前のリセット用）
--   - テスト用ユーザー（display_name / email が test 系、auth.users 含む）
--
-- 残すもの: teams, tournaments のシード、管理者以外の本番ユーザーは
--   下の「自分のテスト用メール」DELETE をコメントアウトしたまま実行
--
-- ※ match_predictions / champion_predictions は DELETE トリガーがあるため
--   一時的にトリガーを外してから削除します。

BEGIN;

-- 予想の DELETE トリガーを一時解除
DROP TRIGGER IF EXISTS match_predictions_deny_delete ON match_predictions;
DROP TRIGGER IF EXISTS champion_predictions_deny_delete ON champion_predictions;

-- 日本戦・試合結果・日本戦予想（CASCADE）
DELETE FROM matches;

-- 優勝国予想（全員分をリセットする場合）
DELETE FROM champion_predictions;

-- 大会最終結果を入れていた場合のみ（任意）
DELETE FROM tournament_results;

-- テスト用ユーザー（Authentication からも消える）
-- ※ Riku / Shunta など本番ユーザーは対象外
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM public.profiles
  WHERE display_name = 'テスト'
     OR display_name ILIKE 'test%'
     OR email ILIKE 'test.%'
     OR email ILIKE '%+test%@%'
);

-- 自分のテスト用 Gmail も消す場合: 下の行のメールを書き換えてコメントを外す
-- DELETE FROM auth.users WHERE email = 'your-test@gmail.com';

-- トリガー復元
CREATE TRIGGER match_predictions_deny_delete
  BEFORE DELETE ON match_predictions
  FOR EACH ROW EXECUTE FUNCTION public.deny_prediction_mutation();

CREATE TRIGGER champion_predictions_deny_delete
  BEFORE DELETE ON champion_predictions
  FOR EACH ROW EXECUTE FUNCTION public.deny_prediction_mutation();

COMMIT;

-- 実行後の確認（件数が 0 または期待どおりか見る）
SELECT 'matches' AS tbl, count(*) FROM matches
UNION ALL SELECT 'match_predictions', count(*) FROM match_predictions
UNION ALL SELECT 'champion_predictions', count(*) FROM champion_predictions
UNION ALL SELECT 'profiles', count(*) FROM profiles;
