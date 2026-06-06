-- 2回実行しても重複しないよう、存在チェック付きで投入する
insert into teams (name, champion_points)
select v.name, v.points
from (
  values
    ('スペイン', 70),
    ('フランス', 75),
    ('イングランド', 85),
    ('ブラジル', 100),
    ('アルゼンチン', 105),
    ('ポルトガル', 130),
    ('ドイツ', 160),
    ('オランダ', 180),
    ('クロアチア', 210),
    ('ベルギー', 230),
    ('モロッコ', 260),
    ('日本', 300),
    ('ノルウェー', 350)
) as v(name, points)
where not exists (select 1 from teams t where t.name = v.name);

insert into tournaments (name, champion_prediction_deadline, is_active)
select 'FIFA World Cup 2026', '2026-06-10T00:00:00+00:00', true
where not exists (
  select 1 from tournaments where name = 'FIFA World Cup 2026'
);
