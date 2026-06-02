# 身内用ワールドカップ予想サイト

React + TypeScript + Vite + Supabase + Cloudflare Pages 向けの予想アプリです。

## セットアップ

### 1. Supabase

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQL Editor または CLI で `supabase/migrations/` 内のファイルを **順番に** 実行:
   - `001_create_tables.sql`
   - `002_rls_policies.sql`
   - `003_seed_data.sql`
   - `004_match_predictions_select_policy.sql`（締切前は他人の日本戦予想を非公開）
3. Authentication で Email ログインを有効化
4. **URL Configuration**（パスワード再設定メール用）:
   - **Site URL**: `https://worldcup-betting.pages.dev`（本番の URL）
   - **Redirect URLs** に以下を追加:
     - `https://worldcup-betting.pages.dev/reset-password`
     - `http://localhost:5173/reset-password`（ローカル開発用）
5. **パスワード変更**: Dashboard の「Send password recovery」または、ログイン画面の「パスワード再設定メールを送る」→ メールのリンク → `/reset-password` で新パスワードを保存
6. **新規ユーザーは管理者が Supabase Dashboard から追加する**（アプリ画面からの新規登録は不可）:
   - Authentication → Users → **Add user**
   - メールとパスワードを設定して作成（`profiles` はサインアップ時トリガーで自動作成）
7. 最初の管理者: ユーザー追加後、SQL で role を更新:

```sql
update profiles set role = 'admin' where email = 'your@email.com';
```

### 2. 環境変数

`.env.local` に設定（anon key のみ。service_role は使わない）:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. ローカル開発

```bash
npm install
npm run dev
```

### 4. Cloudflare Pages

- Build command: `npm run build`
- Build output: `dist`
- 環境変数に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定
- `public/_redirects` で SPA ルーティング対応済み

## ディレクトリ構成

```text
src/
  components/   # Layout, ProtectedRoute, ConfirmModal
  pages/        # 各画面
  lib/          # supabaseClient, scoring, ranking, auth
  types/        # TypeScript 型
supabase/migrations/  # DB + RLS + シード
```

## セキュリティ

- フロントエンドは **anon key のみ**
- 予想の変更不可は RLS（UPDATE/DELETE ポリシーなし）+ DB トリガーで二重防御
- 1人1回提出は UNIQUE 制約
