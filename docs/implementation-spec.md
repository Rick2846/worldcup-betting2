# 新ワールドカップ予想サイト 実装仕様書

## 1. 現状

既にサイトAは完成・運用中。

### サイトA

| 項目 | 内容 |
|------|------|
| 用途 | りくの地元メンバー用 |
| URL | worldcup-betting.pages.dev |
| DB | りくのSupabase Project A |
| Hosting | Cloudflare Pages |
| 状態 | 既に完成・運用中 |

今回、新しく作るのは別メンバー用のサイトB。

### サイトB

| 項目 | 内容 |
|------|------|
| 用途 | 友達の友達メンバー用 |
| メンバー | Aとは完全に別 |
| DB | 新しいSupabase Project B |
| Hosting | 新しいCloudflare Pages Project |
| GitHub | Aのrepoをコピーして別repo化 |
| 方針 | AとはDB・URL・管理を完全分離 |

---

## 2. 最終方針

### 採用する構成

- **A**はそのまま維持する。
- **B**は以下をすべて新しく作る。

| 項目 | 方針 |
|------|------|
| GitHub repo | AをコピーしてB用repoを作成 |
| Supabase | B用の新Projectを作成 |
| Cloudflare Pages | B用の新Projectを作成 |
| URL | Aとは別URL |
| DB | Aとは完全に別DB |
| 管理者・参加者 | B専用で設定 |

---

## 3. この方針にする理由

- **AのDB** = りくの地元用
- **BのDB** = 友達の友達用

として完全分離する。

---

## 4. Supabase無料枠について

りくのSupabase無料枠で、B用に2つ目のProjectを作成する。

- **Supabase Project A**：既存サイトA用
- **Supabase Project B**：新サイトB用

これで、Supabase無料枠はほぼ使い切る想定。

---

## 5. Cloudflareについて

Cloudflare Pagesでは、B用に新しいPages Projectを作成する。

- **Cloudflare Pages A**：既存サイトA
- **Cloudflare Pages B**：新サイトB

Cloudflare Pagesは無料枠で複数サイトを運用しやすいため、A/B両方をりくのCloudflareアカウントで管理して問題ない。

---

## 6. B作成の作業手順

### Step 1. GitHub repoをコピーする

既存のA用repoをコピーして、B用repoを作る。

- 候補名：`worldcup-betting-friend` / `worldcup-betting-b`
- **おすすめ：`worldcup-betting-friend`**

### Step 2. Supabaseで新規Project Bを作成する

りくのSupabaseアカウントで、新しいProjectを作成する。

B用に取得するもの：

- Supabase Project URL
- Supabase Publishable key

> **注意点：**
> - DB password はフロントエンドにもCloudflareにも入れない
> - service_role key も使わない
> - Database connection string も入れない

### Step 3. Project BでSQL migrationを実行する

B用Supabase ProjectのSQL Editorで、既存repo内のmigrationを順番に実行する。

実行順（**必ずこの順番で実行すること**）：

1. `001_create_tables.sql`
2. `002_rls_policies.sql`
3. `003_seed_data.sql`

### Step 4. B用の参加者をAuth Usersに追加する

Supabase Dashboardで手動追加する。

場所：`Authentication → Users → Add user`

Bの参加者ごとに追加する。アプリ上の新規登録は使わない方針。

> **理由：** Supabase無料版の内蔵メール送信制限により、`email rate limit exceeded` が出やすいため。

### Step 5. B用adminをprofilesで設定する

Bの管理者を決めて、SQL Editorでroleをadminに変更する。

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

必要に応じてdisplay_nameも整える。

```sql
UPDATE profiles
SET display_name = '名前'
WHERE email = 'user@example.com';
```

### Step 6. B用Cloudflare Pages Projectを作成する

Cloudflare Pagesで新しいProjectを作成する。

| 項目 | 値 |
|------|----|
| Framework preset | React / Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 空欄 or `/` |
| Production branch | `main` |

### Step 7. Cloudflare環境変数をB用に設定する

BのCloudflare Pagesには、B用Supabase ProjectのURL/keyを設定する。

```
VITE_SUPABASE_URL=Project BのSupabase URL
VITE_SUPABASE_ANON_KEY=Project BのPublishable key
VITE_SUPABASE_PUBLISHABLE_KEY=Project BのPublishable key
```

> `ANON_KEY` と `PUBLISHABLE_KEY` は、コード側の変数名対策として両方入れてOK。値は同じPublishable keyでよい。

**絶対に入れないもの：**

- DB password
- service_role key
- Database connection string

---

## 7. 友達からもらう必要がある情報

B作成前に、最低限以下を確認する。

| 必要情報 | 内容 |
|---------|------|
| 参加者の名前 | 表示名として使用 |
| 参加者のメールアドレス | Supabase Auth Usersに登録 |
| adminにする人 | 管理画面を使える人 |
| 大会名 | Aと同じでよいか、変更するか |
| 優勝国とポイント | Aと同じでよいか |
| 日本戦の試合予定 | 試合追加に必要 |

### 確定済み情報

- 参加者の名前：Aと同じで、名前変更から設定してもらう
- 参加者のメールアドレス：全員分りくが保持
- Admin：りく
- 日本戦の試合予定：Aと全く一緒

### 優勝国ポイント設定（B専用）

| 国 | ポイント |
|----|---------|
| スペイン | 70pt |
| フランス | 75pt |
| イングランド | 85pt |
| ブラジル | 100pt |
| アルゼンチン | 105pt |
| ポルトガル | 130pt |
| ドイツ | 160pt |
| オランダ | 180pt |
| クロアチア | 210pt |
| ベルギー | 230pt |
| モロッコ | 260pt |
| 日本 | 300pt |
| ノルウェー | 350pt |

それ以外の得点計算などはAと全く一緒。

### 参加者リストの形式例

```csv
Name, Email, Role
Taro, taro@example.com, admin
Yuta, yuta@example.com, user
Sana, sana@example.com, user
```

---

## 8. Bに引き継ぐAサイトの仕様

Bも基本的にAと同じ仕様で作る。

### 主な機能

- ログイン
- 優勝国予想
- 優勝国一覧
- 日本戦予想
- 日本戦一覧
- ランキング
- 管理画面

### 重要ルール

- 優勝国予想は提出後変更不可
- 日本戦予想も提出後変更不可
- 日本戦予想は締切後に全員公開
- 締切前は本人の予想だけ確認可能
- 管理者は試合追加・結果入力・ポイント編集が可能

---

## 9. 直近でAに追加した仕様（Bにも反映予定）

Aでは以下の改善を進めている。Bにも同じ仕様を反映する想定。

### トップページ

- 直近の日本戦を表示
- その試合の予想締切日時を表示
- 締切までの残り時間を表示
- 提出済みなら「あなたの予想：〇〇」と表示
- 未提出なら「未提出」と表示

### 日本戦一覧

- 締切後に全員の予想を公開
- 締切前は本人の予想だけ確認可能

### 管理画面

- 試合日時を入力したとき、予想締切を試合開始1日前に自動設定

---

## 10. 作業時の注意点

### AとBを絶対に混ぜない

一番注意するべき事故はこれ。

> **BサイトなのにAのDBを見に行く**

これを防ぐため、必ず以下を確認する。

- A Cloudflare → A Supabase
- B Cloudflare → B Supabase

特にCloudflareの環境変数設定時に注意する。

### GitHubにsecretsを入れない

GitHubに入れてはいけないもの：

- `.env`
- `.env.local`
- DB password
- service_role key
- Database connection string

`.gitignore` に以下を入れる：

```
.env
.env.local
.env.*.local
node_modules
dist
```

---

## 11. 最終チェックリスト

### GitHub

- [ ] A用repoをコピーした
- [ ] B用repo名を決めた
- [ ] `.env` 系ファイルがGitHubに入っていない
- [ ] `.gitignore` を確認した

### Supabase B

- [ ] 新Project Bを作成した
- [ ] Project URLを取得した
- [ ] Publishable keyを取得した
- [ ] SQL migrationを `001 → 002 → 003` の順で実行した
- [ ] B用参加者をAuth Usersに追加した
- [ ] adminのroleを設定した
- [ ] display_nameを必要に応じて修正した

### Cloudflare B

- [ ] 新しいPages Projectを作成した
- [ ] GitHub repoを接続した
- [ ] Framework presetをReact/Viteにした
- [ ] Build commandを `npm run build` にした
- [ ] Build output directoryを `dist` にした
- [ ] Production branchを `main` にした
- [ ] B用Supabase URL/keyを環境変数に設定した
- [ ] A用Supabase情報が混ざっていないか確認した

### 動作確認

- [ ] ログインできる
- [ ] 優勝国予想を提出できる
- [ ] 提出後に変更できない
- [ ] 日本戦予想を提出できる
- [ ] 締切前は本人の予想だけ見える
- [ ] 締切後は全員の予想が見える
- [ ] ランキングが表示される
- [ ] adminだけ管理画面に入れる
- [ ] adminが試合追加できる
- [ ] adminが結果入力できる
- [ ] adminがポイント編集できる
- [ ] トップページに直近の日本戦が表示される
- [ ] 締切までの残り時間が表示される

---

## 12. 結論

今回の方針はこれで確定。

- **A**：既存のまま維持
- **B**：Aのコードをコピーして新repo作成
- **B**：りくのSupabaseアカウントで新Project作成
- **B**：りくのCloudflareアカウントで新Pages Project作成
- **A/B**はDB・URL・参加者・管理者を完全分離

> **一番大事なのは、BのCloudflare環境変数にAのSupabase情報を入れないこと。**
> ここだけ事故ると、BサイトなのにAのDBを操作する可能性がある。
