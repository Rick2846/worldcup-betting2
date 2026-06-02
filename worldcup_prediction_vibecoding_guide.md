# 身内用ワールドカップ予想サイト バイブコーディング指南書

## 0. このドキュメントの目的

このドキュメントは、AIを使って身内用のワールドカップ予想サイトを作成するための開発指南書である。

目的は、以下の機能を持つWebアプリを、できるだけシンプルかつ安全に作ること。

- 身内メンバーだけがログインして使える
- 優勝国予想を提出できる
- 日本戦ごとのスコア・勝敗予想を提出できる
- 一度提出した予想は変更できない
- 提出済みの予想は他の参加者も閲覧できる
- 結果に応じて自動採点する
- ランキングを表示する

---

## 1. 推奨技術構成

### 1.1 推奨スタック

```text
Frontend:
- React
- TypeScript
- Vite

Hosting:
- Cloudflare Pages

Authentication:
- Supabase Auth

Database:
- Supabase PostgreSQL

Authorization:
- Supabase RLS

Optional:
- Cloudflare Access
```

### 1.2 なぜこの構成にするか

AIでバイブコーディングする場合、DB設計が曖昧だと実装が崩れやすい。

そのため、Firebaseよりも、テーブル構造が明確なSupabase PostgreSQLを使う。

Supabaseなら、以下のような指示をAIに出しやすい。

```text
- usersテーブルを作る
- teamsテーブルを作る
- votesテーブルを作る
- 1人1票だけにする
- 自分の予想だけINSERTできる
- UPDATE/DELETEは禁止する
- ログインユーザー全員が予想一覧を閲覧できる
```

### 1.3 Cloudflare Accessについて

身内だけに完全に制限したい場合は、Cloudflare Accessを追加する。

ただし、MVPでは以下のどちらかでよい。

#### パターンA：シンプル構成

```text
Cloudflare Pages
+ Supabase Auth
+ Supabase RLS
```

この場合、サイト自体のURLは開けるが、ログインしないと中身を使えない。

#### パターンB：より安全な構成

```text
Cloudflare Pages
+ Cloudflare Access
+ Supabase Auth
+ Supabase RLS
```

この場合、サイトにアクセスする前にCloudflare Accessの認証が入り、さらにアプリ内でもSupabase Authでログインする。

最初はパターンAで十分。  
本当に身内だけにしたくなったら、あとからCloudflare Accessを追加する。

---

## 2. サイト概要

本サイトは、身内メンバーだけでワールドカップの結果を予想し、ポイントを競うWebアプリである。

予想内容は大きく2つ。

```text
1. 優勝国予想
2. 日本戦予想
```

ユーザーはログイン後に予想を提出する。

提出された予想はDBに保存され、他の参加者も閲覧できる。

---

## 3. 主要ルール

### 3.1 優勝国予想

ユーザーは大会前に優勝国を1つ予想する。

#### ルール

```text
- 1人1回だけ提出できる
- 提出後は変更不可
- 提出後は全参加者から閲覧可能
- 誰がどの国を優勝国に予想したかは常時閲覧可能
- 未提出ユーザーは「未提出」と表示する
```

### 3.2 優勝国ごとの設定ポイント

各国には、事前に設定ポイントを与える。

```text
スペイン：70pt
フランス：75pt
イングランド：85pt
ブラジル：100pt
アルゼンチン：105pt
ポルトガル：130pt
ドイツ：160pt
オランダ：180pt
```

### 3.3 優勝国予想の採点

予想した国の最終成績に応じてポイントを加算する。

```text
優勝：設定ポイントを満額加算
準優勝：設定ポイントの1/2を加算
3位：設定ポイントの1/4を加算
その他：0pt
```

#### 例

ドイツを予想した場合：

```text
優勝：160pt
準優勝：80pt
3位：40pt
その他：0pt
```

---

## 4. 日本戦予想ルール

### 4.1 日本戦予想

ユーザーは日本代表の試合ごとに、スコアと勝敗を予想する。

日本戦予想は、日本が敗退するまで毎試合実施する。

#### ルール

```text
- 各日本戦につき、1ユーザー1回だけ予想できる
- 一度提出した予想は変更不可
- 試合開始後は提出不可
- 提出後は他の参加者も閲覧可能
- 未提出ユーザーは「未提出」と表示する
```

### 4.2 日本戦予想の入力内容

ユーザーが入力する内容：

```text
- 日本の得点
- 相手国の得点
- 勝敗予想
```

勝敗予想は以下のいずれか。

```text
- 日本勝利
- 引き分け
- 日本敗北
```

### 4.3 日本戦の採点

```text
勝敗的中：10pt
スコア完全一致：追加で5pt
```

最大15pt。

#### 例1：勝敗・スコア完全一致

```text
予想：日本 2 - 1 ドイツ
結果：日本 2 - 1 ドイツ

獲得ポイント：15pt
```

#### 例2：勝敗のみ的中

```text
予想：日本 1 - 0 ドイツ
結果：日本 2 - 1 ドイツ

獲得ポイント：10pt
```

#### 例3：勝敗不的中

```text
予想：日本 1 - 2 ドイツ
結果：日本 2 - 1 ドイツ

獲得ポイント：0pt
```

---

## 5. PK戦の扱い

決勝トーナメントでPK戦までもつれると予想する場合、PKスコアは予想しない。

例：

```text
日本勝利・2-2
```

これは、以下の意味になる。

```text
PK戦前のスコア：日本 2 - 2 相手国
最終勝者：日本
```

### 5.1 PK戦の入力項目

決勝トーナメントの試合では、以下の入力項目を使う。

```text
- 日本の得点
- 相手国の得点
- PK戦になるか
- PK後の勝者
```

ただし、PKの具体的なスコアは予想しない。

### 5.2 PK戦の採点例

```text
予想：
日本 2 - 2 ドイツ
PK後の勝者：日本

結果：
日本 2 - 2 ドイツ
PK後の勝者：日本

獲得ポイント：
勝敗的中 10pt
スコア完全一致 +5pt
合計 15pt
```

---

## 6. 同点時の順位ルール

ランキングで合計ポイントが同じ場合は、優勝国予想で獲得したポイントが高い人を上位とする。

```text
第1基準：合計ポイントが高い順
第2基準：優勝国予想ポイントが高い順
```

例：

```text
Aさん：合計100pt、優勝国予想80pt
Bさん：合計100pt、優勝国予想40pt

→ Aさんが上位
```

---

## 7. 画面一覧

MVPで必要な画面は以下。

```text
1. ログイン画面
2. トップページ
3. 優勝国予想ページ
4. 優勝国予想一覧ページ
5. 日本戦予想ページ
6. 日本戦予想一覧ページ
7. ランキングページ
8. 管理者ページ
```

---

## 8. 画面仕様

### 8.1 ログイン画面

#### 機能

```text
- メールアドレスでログイン
- ログインしていないユーザーは各ページにアクセス不可
- 許可されていないユーザーは利用不可
```

---

### 8.2 トップページ

#### 表示内容

```text
- サイトタイトル
- 現在のランキング上位
- 自分の合計ポイント
- 優勝国予想の提出状況
- 次の日本戦予想の提出状況
- 各ページへのリンク
```

---

### 8.3 優勝国予想ページ

#### 未提出の場合

```text
優勝国を選択してください。

スペイン：70pt
フランス：75pt
イングランド：85pt
ブラジル：100pt
アルゼンチン：105pt
ポルトガル：130pt
ドイツ：160pt
オランダ：180pt

[予想を提出する]
```

提出前に確認画面を出す。

```text
この予想は提出後に変更できません。
本当に提出しますか？

予想：ドイツ

[提出する] [戻る]
```

#### 提出済みの場合

```text
あなたの優勝国予想：
ドイツ

この予想は提出済みです。
提出後の変更はできません。
```

---

### 8.4 優勝国予想一覧ページ

全員の優勝国予想を表示する。

#### 表示例

```text
優勝国予想一覧

Riku：ドイツ
Taro：ブラジル
Yuta：スペイン
Sana：未提出
Grace：フランス
```

#### 仕様

```text
- ログインユーザー全員が閲覧可能
- 誰がどの国を予想したかを常時表示
- 未提出者も表示
```

---

### 8.5 日本戦予想ページ

#### 未提出の場合

```text
日本 vs ドイツ

日本の得点：[  ]
ドイツの得点：[  ]
勝敗予想：[日本勝利 / 引き分け / 日本敗北]

[予想を提出する]
```

提出前に確認画面を出す。

```text
この予想は提出後に変更できません。
本当に提出しますか？

予想：日本 2 - 1 ドイツ / 日本勝利

[提出する] [戻る]
```

#### 提出済みの場合

```text
日本 vs ドイツ

あなたの予想：
日本 2 - 1 ドイツ / 日本勝利

この予想はすでに提出済みです。
提出後の変更はできません。
```

#### 締切後・未提出の場合

```text
日本 vs ドイツ

予想受付は終了しました。
あなたはこの試合の予想を提出していません。
```

---

### 8.6 日本戦予想一覧ページ

各試合ごとに、全員の予想を表示する。

#### 表示例

```text
日本 vs ドイツ 予想一覧

Riku：日本 2 - 1 ドイツ / 日本勝利
Taro：日本 1 - 1 ドイツ / 引き分け
Yuta：日本 0 - 2 ドイツ / 日本敗北
Sana：未提出
```

#### 仕様

```text
- ログインユーザー全員が閲覧可能
- 提出済み予想は全員に公開
- 未提出者は「未提出」と表示
```

---

### 8.7 ランキングページ

#### 表示内容

```text
- 順位
- ユーザー名
- 合計ポイント
- 優勝国予想ポイント
- 日本戦予想ポイント
- 予想した優勝国
```

#### 表示例

```text
1位 Riku 185pt
2位 Taro 170pt
3位 Yuta 155pt
```

#### 並び順

```text
1. 合計ポイントが高い順
2. 合計ポイントが同じ場合、優勝国予想ポイントが高い順
```

---

### 8.8 管理者ページ

管理者だけが使えるページ。

#### 管理者ができること

```text
- 参加ユーザーの確認
- 優勝国候補の追加・編集
- 国ごとの設定ポイント編集
- 日本戦の試合追加
- 試合開始時刻の設定
- 予想締切時刻の設定
- 日本戦の結果入力
- 大会最終結果の入力
- ポイント再計算
```

---

## 9. DB設計

Supabase PostgreSQLを使う。

### 9.1 テーブル一覧

```text
profiles
teams
tournaments
champion_predictions
matches
match_predictions
match_results
tournament_results
```

---

## 10. SQL設計案

### 10.1 profiles

Supabase Authのユーザーと紐づくプロフィールテーブル。

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null unique,
  role text not null default 'user',
  created_at timestamptz not null default now(),

  constraint profiles_role_check check (role in ('user', 'admin'))
);
```

---

### 10.2 tournaments

大会情報を管理するテーブル。

```sql
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  champion_prediction_deadline timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

---

### 10.3 teams

国情報を管理するテーブル。

```sql
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  champion_points integer not null,
  created_at timestamptz not null default now(),

  constraint teams_champion_points_check check (champion_points >= 0)
);
```

初期データ：

```sql
insert into teams (name, champion_points) values
('スペイン', 70),
('フランス', 75),
('イングランド', 85),
('ブラジル', 100),
('アルゼンチン', 105),
('ポルトガル', 130),
('ドイツ', 160),
('オランダ', 180);
```

---

### 10.4 champion_predictions

優勝国予想を保存するテーブル。

```sql
create table champion_predictions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid not null references teams(id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint champion_predictions_unique unique (tournament_id, user_id)
);
```

#### 重要ルール

```text
- 1ユーザー1大会につき1つだけ保存
- UPDATE禁止
- DELETE禁止
- ログインユーザー全員がSELECT可能
```

---

### 10.5 matches

日本戦の試合情報を管理するテーブル。

```sql
create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  opponent_team_name text not null,
  stage text not null,
  match_datetime timestamptz not null,
  prediction_deadline timestamptz not null,
  is_knockout boolean not null default false,
  created_at timestamptz not null default now(),

  constraint matches_stage_check check (
    stage in ('group', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final')
  )
);
```

---

### 10.6 match_predictions

日本戦予想を保存するテーブル。

```sql
create table match_predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  japan_score_prediction integer not null,
  opponent_score_prediction integer not null,
  predicted_result text not null,
  predict_penalty boolean not null default false,
  penalty_winner text,
  created_at timestamptz not null default now(),

  constraint match_predictions_unique unique (match_id, user_id),
  constraint match_predictions_score_check check (
    japan_score_prediction >= 0 and opponent_score_prediction >= 0
  ),
  constraint match_predictions_result_check check (
    predicted_result in ('japan_win', 'draw', 'japan_loss')
  ),
  constraint match_predictions_penalty_winner_check check (
    penalty_winner is null or penalty_winner in ('japan', 'opponent')
  )
);
```

#### 重要ルール

```text
- 1ユーザー1試合につき1つだけ保存
- 一度INSERTしたらUPDATE禁止
- DELETE禁止
- 締切後はINSERT禁止
- ログインユーザー全員がSELECT可能
```

---

### 10.7 match_results

日本戦の結果を保存するテーブル。

```sql
create table match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references matches(id) on delete cascade,
  japan_score integer not null,
  opponent_score integer not null,
  actual_result text not null,
  went_to_penalty boolean not null default false,
  penalty_winner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint match_results_score_check check (
    japan_score >= 0 and opponent_score >= 0
  ),
  constraint match_results_actual_result_check check (
    actual_result in ('japan_win', 'draw', 'japan_loss')
  ),
  constraint match_results_penalty_winner_check check (
    penalty_winner is null or penalty_winner in ('japan', 'opponent')
  )
);
```

---

### 10.8 tournament_results

大会最終結果を保存するテーブル。

```sql
create table tournament_results (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null unique references tournaments(id) on delete cascade,
  champion_team_id uuid references teams(id) on delete restrict,
  runner_up_team_id uuid references teams(id) on delete restrict,
  third_place_team_id uuid references teams(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 11. RLS方針

全テーブルでRLSを有効化する。

```sql
alter table profiles enable row level security;
alter table tournaments enable row level security;
alter table teams enable row level security;
alter table champion_predictions enable row level security;
alter table matches enable row level security;
alter table match_predictions enable row level security;
alter table match_results enable row level security;
alter table tournament_results enable row level security;
```

---

## 12. 管理者判定関数

RLSで管理者判定を使うため、関数を作る。

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;
```

---

## 13. RLS Policy案

### 13.1 profiles

```sql
create policy "Users can read all profiles"
on profiles
for select
to authenticated
using (true);

create policy "Users can insert own profile"
on profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile display name"
on profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can update profiles"
on profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

---

### 13.2 tournaments

```sql
create policy "Authenticated users can read tournaments"
on tournaments
for select
to authenticated
using (true);

create policy "Admins can insert tournaments"
on tournaments
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update tournaments"
on tournaments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete tournaments"
on tournaments
for delete
to authenticated
using (public.is_admin());
```

---

### 13.3 teams

```sql
create policy "Authenticated users can read teams"
on teams
for select
to authenticated
using (true);

create policy "Admins can insert teams"
on teams
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update teams"
on teams
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete teams"
on teams
for delete
to authenticated
using (public.is_admin());
```

---

### 13.4 champion_predictions

```sql
create policy "Authenticated users can read all champion predictions"
on champion_predictions
for select
to authenticated
using (true);

create policy "Users can insert own champion prediction before deadline"
on champion_predictions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from tournaments
    where tournaments.id = champion_predictions.tournament_id
      and (
        tournaments.champion_prediction_deadline is null
        or now() < tournaments.champion_prediction_deadline
      )
  )
);
```

UPDATEとDELETEのpolicyは作らない。  
これにより、提出後の変更と削除を禁止する。

---

### 13.5 matches

```sql
create policy "Authenticated users can read matches"
on matches
for select
to authenticated
using (true);

create policy "Admins can insert matches"
on matches
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update matches"
on matches
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete matches"
on matches
for delete
to authenticated
using (public.is_admin());
```

---

### 13.6 match_predictions

```sql
create policy "Authenticated users can read all match predictions"
on match_predictions
for select
to authenticated
using (true);

create policy "Users can insert own match prediction before deadline"
on match_predictions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from matches
    where matches.id = match_predictions.match_id
      and now() < matches.prediction_deadline
  )
);
```

UPDATEとDELETEのpolicyは作らない。  
これにより、日本戦予想は一度提出したら変更不可になる。

---

### 13.7 match_results

```sql
create policy "Authenticated users can read match results"
on match_results
for select
to authenticated
using (true);

create policy "Admins can insert match results"
on match_results
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update match results"
on match_results
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete match results"
on match_results
for delete
to authenticated
using (public.is_admin());
```

---

### 13.8 tournament_results

```sql
create policy "Authenticated users can read tournament results"
on tournament_results
for select
to authenticated
using (true);

create policy "Admins can insert tournament results"
on tournament_results
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update tournament results"
on tournament_results
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete tournament results"
on tournament_results
for delete
to authenticated
using (public.is_admin());
```

---

## 14. 採点ロジック

### 14.1 優勝国予想ポイント

```ts
function calculateChampionPredictionPoints(
  predictedTeamId: string,
  predictedTeamPoints: number,
  championTeamId: string | null,
  runnerUpTeamId: string | null,
  thirdPlaceTeamId: string | null
): number {
  if (predictedTeamId === championTeamId) {
    return predictedTeamPoints;
  }

  if (predictedTeamId === runnerUpTeamId) {
    return predictedTeamPoints / 2;
  }

  if (predictedTeamId === thirdPlaceTeamId) {
    return predictedTeamPoints / 4;
  }

  return 0;
}
```

### 14.2 日本戦予想ポイント

```ts
type MatchResultType = 'japan_win' | 'draw' | 'japan_loss';

function calculateMatchPredictionPoints(params: {
  predictedJapanScore: number;
  predictedOpponentScore: number;
  predictedResult: MatchResultType;
  actualJapanScore: number;
  actualOpponentScore: number;
  actualResult: MatchResultType;
}): number {
  let points = 0;

  const resultHit = params.predictedResult === params.actualResult;
  const scoreHit =
    params.predictedJapanScore === params.actualJapanScore &&
    params.predictedOpponentScore === params.actualOpponentScore;

  if (resultHit) {
    points += 10;
  }

  if (resultHit && scoreHit) {
    points += 5;
  }

  return points;
}
```

### 14.3 合計ポイント

```ts
totalPoints = championPredictionPoints + matchPredictionPointsTotal;
```

### 14.4 ランキング並び替え

```ts
ranking.sort((a, b) => {
  if (b.totalPoints !== a.totalPoints) {
    return b.totalPoints - a.totalPoints;
  }

  return b.championPredictionPoints - a.championPredictionPoints;
});
```

---

## 15. 実装方針

### 15.1 フロントエンドで守ること

```text
- 提出済みなら編集ボタンを表示しない
- 提出前に確認モーダルを出す
- 締切後は提出ボタンを無効化する
- 未提出者は「未提出」と表示する
- ログインしていない場合はログイン画面へ誘導する
```

### 15.2 DB側で必ず守ること

フロントエンドだけで制御してはいけない。  
DB側でも以下を必ず守る。

```text
- champion_predictionsは1ユーザー1大会1件だけ
- match_predictionsは1ユーザー1試合1件だけ
- 予想テーブルのUPDATEは禁止
- 予想テーブルのDELETEは禁止
- match_predictionsのINSERTは締切前だけ
- champion_predictionsのINSERTは締切前だけ
- SELECTはログインユーザー全員に許可
```

---

## 16. ディレクトリ構成案

```text
worldcup-prediction-app/
  src/
    components/
      Layout.tsx
      ProtectedRoute.tsx
      ConfirmModal.tsx
    pages/
      LoginPage.tsx
      HomePage.tsx
      ChampionPredictionPage.tsx
      ChampionPredictionsListPage.tsx
      MatchPredictionPage.tsx
      MatchPredictionsListPage.tsx
      RankingPage.tsx
      AdminPage.tsx
    lib/
      supabaseClient.ts
      scoring.ts
      auth.ts
    types/
      database.ts
      app.ts
    App.tsx
    main.tsx
  supabase/
    migrations/
      001_create_tables.sql
      002_rls_policies.sql
      003_seed_teams.sql
  .env.example
  package.json
  README.md
```

---

## 17. 環境変数

`.env.example`

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 重要

```text
service_role keyをフロントエンドに置かない。
```

ReactやViteで使うのはanon keyのみ。

---

## 18. AIに実装させる順番

一気に全部作らせない。  
AIには小さい単位で作らせる。

### Step 1：DB設計

```text
Supabase PostgreSQL用に、以下のテーブルを作るSQL migrationを作成してください。

- profiles
- tournaments
- teams
- champion_predictions
- matches
- match_predictions
- match_results
- tournament_results

要件:
- 予想テーブルはUPDATE/DELETE不可にしたい
- champion_predictionsはunique(tournament_id, user_id)
- match_predictionsはunique(match_id, user_id)
- scoreは0以上
- roleはuser/adminのみ
```

### Step 2：RLS

```text
Supabase RLS policyを作成してください。

要件:
- ログインユーザーは全員の予想をSELECTできる
- ログインユーザーは自分の予想だけINSERTできる
- champion_predictionsとmatch_predictionsはUPDATE/DELETE禁止
- match_predictionsは締切前だけINSERT可能
- champion_predictionsは締切前だけINSERT可能
- 管理者だけ試合・結果・国情報を作成/更新/削除できる
- service_role keyに依存しない
```

### Step 3：Supabase client

```text
React + TypeScript + ViteでSupabase clientを作成してください。

要件:
- .envからVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを読む
- supabaseClient.tsに分離する
- service_role keyは使わない
```

### Step 4：ログイン

```text
Supabase Authを使ったログイン画面を作成してください。

要件:
- メールアドレスログイン
- ログイン状態を取得
- 未ログインならLoginPageに移動
- ログイン済みならHomePageに移動
```

### Step 5：優勝国予想

```text
優勝国予想ページを作成してください。

要件:
- teamsテーブルから国一覧と設定ポイントを取得
- すでに提出済みなら自分の予想だけ表示し、提出フォームは表示しない
- 未提出なら国を1つ選んで提出できる
- 提出前に確認モーダルを出す
- 提出後は変更できない
- champion_predictionsにINSERTする
```

### Step 6：優勝国予想一覧

```text
優勝国予想一覧ページを作成してください。

要件:
- ログインユーザー全員が閲覧可能
- profilesとchampion_predictionsとteamsをjoinして表示
- 提出済みユーザーは予想国を表示
- 未提出ユーザーは「未提出」と表示
```

### Step 7：日本戦予想

```text
日本戦予想ページを作成してください。

要件:
- matchesテーブルから次の日本戦を取得
- すでに提出済みなら自分の予想を表示し、編集不可
- 未提出かつ締切前なら予想を提出できる
- 提出後は変更できない
- match_predictionsにINSERTする
- unique(match_id, user_id)制約に対応する
- 提出前に確認モーダルを出す
```

### Step 8：日本戦予想一覧

```text
日本戦予想一覧ページを作成してください。

要件:
- 試合ごとに全員の予想を表示
- 提出済みユーザーはスコアと勝敗を表示
- 未提出ユーザーは「未提出」と表示
- ログインユーザー全員が閲覧可能
```

### Step 9：採点

```text
scoring.tsを作成してください。

要件:
- 優勝国予想ポイントを計算する関数
- 日本戦予想ポイントを計算する関数
- 合計ポイントを計算する関数
- 同点の場合は優勝国予想ポイントが高い人を上位にするランキングソート関数
```

### Step 10：ランキング

```text
ランキングページを作成してください。

要件:
- 全ユーザーを表示
- 合計ポイントを表示
- 優勝国予想ポイントを表示
- 日本戦予想ポイントを表示
- 合計ポイントが高い順
- 同点の場合は優勝国予想ポイントが高い順
```

### Step 11：管理者ページ

```text
管理者ページを作成してください。

要件:
- roleがadminのユーザーだけ表示可能
- 日本戦を追加できる
- 試合結果を入力できる
- 大会最終結果を入力できる
- チームの設定ポイントを編集できる
```

---

## 19. バイブコーディング用メインプロンプト

以下をAIに最初に渡す。

```text
Cloudflare Pages + React + TypeScript + Vite + Supabaseで、身内用のワールドカップ予想サイトを作成したいです。

目的:
身内メンバーだけでワールドカップの優勝国予想と日本戦予想を行い、ポイントを競うWebアプリを作成します。

技術構成:
- React
- TypeScript
- Vite
- Cloudflare Pages
- Supabase Auth
- Supabase PostgreSQL
- Supabase RLS

重要ルール:
- service_role keyは絶対にフロントエンドに置かない
- フロントエンドではanon keyのみ使用する
- Supabase RLSを必ず有効化する
- 予想の変更不可ルールはフロントエンドだけでなくDB側でも守る
- AIっぽい過剰なコメントは不要
- コードはシンプルで読みやすくする

機能要件:
1. ログイン機能
- Supabase Authでログインする
- ログインしていないユーザーは利用できない
- profilesテーブルでユーザー名とroleを管理する

2. 優勝国予想
- ユーザーは大会前に優勝国を1つ予想する
- 1ユーザー1大会につき1回だけ提出できる
- 提出後は変更不可
- 誰がどの国を優勝国に予想したかは常時閲覧可能
- 未提出ユーザーは「未提出」と表示する

3. 優勝国ポイント
- スペイン：70pt
- フランス：75pt
- イングランド：85pt
- ブラジル：100pt
- アルゼンチン：105pt
- ポルトガル：130pt
- ドイツ：160pt
- オランダ：180pt
- 優勝なら設定ポイント満額
- 準優勝なら設定ポイントの1/2
- 3位なら設定ポイントの1/4
- その他なら0pt

4. 日本戦予想
- 日本戦ごとにスコアと勝敗を予想する
- 1ユーザー1試合につき1回だけ提出できる
- 一度提出したら変更不可
- DBに保存後、UPDATE/DELETE不可
- 試合開始後または締切後は提出不可
- 提出済みの予想は他のログインユーザーも閲覧可能
- 未提出ユーザーは「未提出」と表示する

5. 日本戦ポイント
- 勝敗的中で10pt
- スコア完全一致で追加5pt
- 最大15pt
- 決勝トーナメントでPK戦の場合、PKスコアは予想しない
- PK前のスコアと最終勝者だけ扱う

6. ランキング
- 合計ポイント順に表示する
- 合計ポイント = 優勝国予想ポイント + 日本戦予想ポイント
- 同点の場合、優勝国予想ポイントが高い人を上位にする

7. 管理者機能
- roleがadminのユーザーだけ管理者ページを使える
- 管理者は試合を追加できる
- 管理者は試合結果を入力できる
- 管理者は大会最終結果を入力できる
- 管理者はチームの設定ポイントを編集できる

まずは、DB schema、RLS policy、ディレクトリ構成、実装ステップを作成してください。
その後、各ファイルを順番に実装してください。
```

---

## 20. 実装時の注意点

### 20.1 変更不可はDBで守る

日本戦予想と優勝国予想は、一度提出したら変更不可。

フロントエンドで編集ボタンを消すだけでは不十分。

必ずDB側で以下を設定する。

```text
- UPDATE policyを作らない
- DELETE policyを作らない
- unique制約を付ける
```

### 20.2 予想提出前に確認を入れる

提出後に変更できないため、確認画面は必須。

```text
この予想は提出後に変更できません。
本当に提出しますか？
```

### 20.3 未提出者を表示する

一覧ページでは、提出済みの人だけでなく、未提出者も表示する。

そのため、profilesを基準にして、予想テーブルをleft joinする。

### 20.4 service_role keyを使わない

フロントエンドにservice_role keyを置くと危険。

必ずanon keyのみ使う。

### 20.5 RLSをオフにしない

AIが実装中に「簡単にするためRLSを無効化しましょう」と言ってきても、無効化しない。

---

## 21. MVPの完成条件

以下ができたらMVP完成。

```text
- ログインできる
- 優勝国予想を提出できる
- 優勝国予想は変更できない
- 全員の優勝国予想一覧を見られる
- 日本戦予想を提出できる
- 日本戦予想は変更できない
- 全員の日本戦予想一覧を見られる
- 管理者が試合結果を入力できる
- ポイントが計算される
- ランキングが表示される
```

---

## 22. 将来追加してもよい機能

MVP後に追加する候補。

```text
- コメント機能
- 予想締切までのカウントダウン
- LINE通知
- Discord通知
- 過去大会の保存
- 複数大会対応
- グループ分け
- 参加者招待機能
- 管理者によるユーザー承認
- 予想提出率の表示
- スマホUI改善
```

ただし、最初から入れすぎない。  
MVPでは、ログイン・予想・公開・採点・ランキングに集中する。

---

## 23. 開発の進め方

### Phase 1

```text
- Supabase project作成
- DB migration作成
- RLS設定
- 初期データ投入
```

### Phase 2

```text
- React + Vite作成
- Supabase client設定
- LoginPage作成
- ProtectedRoute作成
```

### Phase 3

```text
- 優勝国予想機能
- 優勝国予想一覧
```

### Phase 4

```text
- 日本戦予想機能
- 日本戦予想一覧
```

### Phase 5

```text
- 採点ロジック
- ランキング
```

### Phase 6

```text
- 管理者ページ
- 結果入力
- UI調整
- Cloudflare Pagesへデプロイ
```

---

## 24. 最終まとめ

このサイトの本質は、以下の4つ。

```text
1. 誰がログインしているかを管理する
2. 誰がどの国を優勝予想したか保存する
3. 誰が日本戦でどんなスコアを予想したか保存する
4. 結果に応じてポイント計算してランキング表示する
```

重要なのは、予想変更不可ルールをフロントエンドだけでなくDB側でも守ること。

最初に作るべき構成はこれ。

```text
Cloudflare Pages
+ React
+ TypeScript
+ Supabase Auth
+ Supabase PostgreSQL
+ Supabase RLS
```

これで、無料枠を使いながら、身内用の実用的なワールドカップ予想サイトを作成できる。
