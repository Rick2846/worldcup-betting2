# 友達用ワールドカップ予想サイト（サイトB）

React + TypeScript + Vite + Supabase + Cloudflare Pages 向けの予想アプリです。

サイトA（地元メンバー用）とは **DB・URL・参加者を完全分離** した別インスタンスです。詳細は [docs/implementation-spec.md](./docs/implementation-spec.md) を参照してください。

## セットアップ

### 1. Supabase（Project B）

1. [Supabase](https://supabase.com) で **新規プロジェクト（B用）** を作成
2. SQL Editor で `supabase/migrations/` 内のファイルを **順番に** 実行:
   - `001_create_tables.sql`
   - `002_rls_policies.sql`
   - `003_seed_data.sql`（B専用の優勝国ポイント設定）
   - `004_match_predictions_select_policy.sql`（締切前は他人の日本戦予想を非公開）
3. Authentication で Email ログインを有効化
4. **URL Configuration**（パスワード再設定メール用）:
   - **Site URL**: サイトBの本番 URL（例: `https://worldcup-betting-friend.pages.dev`）
   - **Redirect URLs** に以下を追加:
     - `https://<サイトBのURL>/reset-password`
     - `http://localhost:5173/reset-password`（ローカル開発用）
5. **パスワード変更**: Dashboard の「Send password recovery」または、ログイン画面の「パスワード再設定メールを送る」→ メールのリンク → `/reset-password` で新パスワードを保存
6. **新規ユーザーは管理者が Supabase Dashboard から追加する**（アプリ画面からの新規登録は不可）:
   - Authentication → Users → **Add user**
   - メールとパスワードを設定して作成（`profiles` はサインアップ時トリガーで自動作成）
7. 最初の管理者: ユーザー追加後、SQL で role を更新:

```sql
update profiles set role = 'admin' where email = 'your@email.com';
```

8. 表示名の調整（任意）:

```sql
update profiles set display_name = '名前' where email = 'user@example.com';
```

### 2. 環境変数

`.env.local` に設定（Publishable key のみ。**service_role は使わない**）:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`ANON_KEY` と `PUBLISHABLE_KEY` はどちらか一方でも動作しますが、Cloudflare では両方同じ値を設定しておくと安全です。

### 3. ローカル開発

```bash
npm install
npm run dev
```

### 4. Cloudflare Pages（Project B）

- Framework preset: React / Vite
- Build command: `npm run build`
- Build output: `dist`
- Production branch: `main`
- 環境変数（**Project B の Supabase の値のみ**）:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- `public/_redirects` で SPA ルーティング対応済み

> **重要:** サイトAの Supabase URL/key を絶対に入れないこと。

## B専用の優勝国ポイント

| 国 | ポイント |
|----|---------|
| スペイン | 70 |
| フランス | 75 |
| イングランド | 85 |
| ブラジル | 100 |
| アルゼンチン | 105 |
| ポルトガル | 130 |
| ドイツ | 160 |
| オランダ | 180 |
| クロアチア | 210 |
| ベルギー | 230 |
| モロッコ | 260 |
| 日本 | 300 |
| ノルウェー | 350 |

## ディレクトリ構成

```text
src/
  components/   # Layout, ProtectedRoute, ConfirmModal
  pages/        # 各画面
  lib/          # supabaseClient, scoring, ranking, auth
  types/        # TypeScript 型
supabase/migrations/  # DB + RLS + シード
docs/                 # 実装仕様書
```

## セキュリティ

- フロントエンドは **Publishable key（anon key）のみ**
- 予想の変更不可は RLS（UPDATE/DELETE ポリシーなし）+ DB トリガーで二重防御
- 1人1回提出は UNIQUE 制約
- `.env` / `.env.local` は Git に含めない
