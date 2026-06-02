alter table profiles enable row level security;
alter table tournaments enable row level security;
alter table teams enable row level security;
alter table champion_predictions enable row level security;
alter table matches enable row level security;
alter table match_predictions enable row level security;
alter table match_results enable row level security;
alter table tournament_results enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- profiles
create policy "Users can read all profiles"
on profiles for select to authenticated using (true);

create policy "Users can insert own profile"
on profiles for insert to authenticated
with check (id = auth.uid());

create policy "Users can update own profile display name"
on profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can update profiles"
on profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- tournaments
create policy "Authenticated users can read tournaments"
on tournaments for select to authenticated using (true);

create policy "Admins can insert tournaments"
on tournaments for insert to authenticated
with check (public.is_admin());

create policy "Admins can update tournaments"
on tournaments for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete tournaments"
on tournaments for delete to authenticated
using (public.is_admin());

-- teams
create policy "Authenticated users can read teams"
on teams for select to authenticated using (true);

create policy "Admins can insert teams"
on teams for insert to authenticated
with check (public.is_admin());

create policy "Admins can update teams"
on teams for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete teams"
on teams for delete to authenticated
using (public.is_admin());

-- champion_predictions
create policy "Authenticated users can read all champion predictions"
on champion_predictions for select to authenticated using (true);

create policy "Users can insert own champion prediction before deadline"
on champion_predictions for insert to authenticated
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

-- matches
create policy "Authenticated users can read matches"
on matches for select to authenticated using (true);

create policy "Admins can insert matches"
on matches for insert to authenticated
with check (public.is_admin());

create policy "Admins can update matches"
on matches for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete matches"
on matches for delete to authenticated
using (public.is_admin());

-- match_predictions
create policy "Authenticated users can read all match predictions"
on match_predictions for select to authenticated using (true);

create policy "Users can insert own match prediction before deadline"
on match_predictions for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from matches
    where matches.id = match_predictions.match_id
      and now() < matches.prediction_deadline
  )
);

-- match_results
create policy "Authenticated users can read match results"
on match_results for select to authenticated using (true);

create policy "Admins can insert match results"
on match_results for insert to authenticated
with check (public.is_admin());

create policy "Admins can update match results"
on match_results for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete match results"
on match_results for delete to authenticated
using (public.is_admin());

-- tournament_results
create policy "Authenticated users can read tournament results"
on tournament_results for select to authenticated using (true);

create policy "Admins can insert tournament results"
on tournament_results for insert to authenticated
with check (public.is_admin());

create policy "Admins can update tournament results"
on tournament_results for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete tournament results"
on tournament_results for delete to authenticated
using (public.is_admin());
