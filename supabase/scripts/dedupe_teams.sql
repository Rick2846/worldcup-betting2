-- チーム名の重複を解消する（003_seed_data.sql を2回実行した場合など）
-- Supabase Dashboard → SQL Editor → New query に貼り付けて Run
--
-- 同名チームは created_at が最古の1件を残し、参照をそちらへ付け替えてから削除します。

BEGIN;

WITH canonical AS (
  SELECT DISTINCT ON (name) id, name
  FROM teams
  ORDER BY name, created_at ASC, id ASC
),
dupes AS (
  SELECT t.id AS dupe_id, c.id AS keep_id
  FROM teams t
  INNER JOIN canonical c ON c.name = t.name
  WHERE t.id <> c.id
)
UPDATE champion_predictions cp
SET team_id = d.keep_id
FROM dupes d
WHERE cp.team_id = d.dupe_id;

WITH canonical AS (
  SELECT DISTINCT ON (name) id, name
  FROM teams
  ORDER BY name, created_at ASC, id ASC
),
dupes AS (
  SELECT t.id AS dupe_id, c.id AS keep_id
  FROM teams t
  INNER JOIN canonical c ON c.name = t.name
  WHERE t.id <> c.id
)
UPDATE tournament_results tr
SET champion_team_id = d.keep_id
FROM dupes d
WHERE tr.champion_team_id = d.dupe_id;

WITH canonical AS (
  SELECT DISTINCT ON (name) id, name
  FROM teams
  ORDER BY name, created_at ASC, id ASC
),
dupes AS (
  SELECT t.id AS dupe_id, c.id AS keep_id
  FROM teams t
  INNER JOIN canonical c ON c.name = t.name
  WHERE t.id <> c.id
)
UPDATE tournament_results tr
SET runner_up_team_id = d.keep_id
FROM dupes d
WHERE tr.runner_up_team_id = d.dupe_id;

WITH canonical AS (
  SELECT DISTINCT ON (name) id, name
  FROM teams
  ORDER BY name, created_at ASC, id ASC
),
dupes AS (
  SELECT t.id AS dupe_id, c.id AS keep_id
  FROM teams t
  INNER JOIN canonical c ON c.name = t.name
  WHERE t.id <> c.id
)
UPDATE tournament_results tr
SET third_place_team_id = d.keep_id
FROM dupes d
WHERE tr.third_place_team_id = d.dupe_id;

WITH canonical AS (
  SELECT DISTINCT ON (name) id, name
  FROM teams
  ORDER BY name, created_at ASC, id ASC
),
dupes AS (
  SELECT t.id AS dupe_id, c.id AS keep_id
  FROM teams t
  INNER JOIN canonical c ON c.name = t.name
  WHERE t.id <> c.id
)
DELETE FROM teams t
USING dupes d
WHERE t.id = d.dupe_id;

COMMIT;

-- 確認: 13件・重複なしであること
SELECT name, champion_points, count(*) AS cnt
FROM teams
GROUP BY name, champion_points
HAVING count(*) > 1;

SELECT count(*) AS team_count FROM teams;
