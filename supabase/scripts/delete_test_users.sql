-- テストユーザーのみ削除（試合・予想データは触らない）
-- Supabase SQL Editor で実行 → 本番に即反映（push 不要）

-- 削除前に対象を確認
SELECT id, display_name, email, role
FROM public.profiles
WHERE display_name = 'テスト'
   OR display_name ILIKE 'test%'
   OR email ILIKE 'test.%'
   OR email ILIKE '%+test%@%';

-- 問題なければ実行
DELETE FROM auth.users
WHERE id IN (
  SELECT id FROM public.profiles
  WHERE display_name = 'テスト'
     OR display_name ILIKE 'test%'
     OR email ILIKE 'test.%'
     OR email ILIKE '%+test%@%'
);

-- 残ったユーザーを確認
SELECT display_name, email, role FROM public.profiles ORDER BY display_name;
