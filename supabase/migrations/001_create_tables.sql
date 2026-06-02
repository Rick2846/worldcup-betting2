-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null unique,
  role text not null default 'user',
  created_at timestamptz not null default now(),

  constraint profiles_role_check check (role in ('user', 'admin'))
);

-- tournaments
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  champion_prediction_deadline timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  champion_points integer not null,
  created_at timestamptz not null default now(),

  constraint teams_champion_points_check check (champion_points >= 0)
);

-- champion_predictions
create table champion_predictions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid not null references teams(id) on delete restrict,
  created_at timestamptz not null default now(),

  constraint champion_predictions_unique unique (tournament_id, user_id)
);

-- matches
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

-- match_predictions
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

-- match_results
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

-- tournament_results
create table tournament_results (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null unique references tournaments(id) on delete cascade,
  champion_team_id uuid references teams(id) on delete restrict,
  runner_up_team_id uuid references teams(id) on delete restrict,
  third_place_team_id uuid references teams(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Block UPDATE/DELETE on prediction tables (defense in depth)
create or replace function public.deny_prediction_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Predictions cannot be updated or deleted';
end;
$$;

create trigger champion_predictions_deny_update
  before update on champion_predictions
  for each row execute function public.deny_prediction_mutation();

create trigger champion_predictions_deny_delete
  before delete on champion_predictions
  for each row execute function public.deny_prediction_mutation();

create trigger match_predictions_deny_update
  before update on match_predictions
  for each row execute function public.deny_prediction_mutation();

create trigger match_predictions_deny_delete
  before delete on match_predictions
  for each row execute function public.deny_prediction_mutation();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
