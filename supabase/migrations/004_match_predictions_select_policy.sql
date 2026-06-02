-- Replace open SELECT with deadline-aware visibility for others' predictions

drop policy if exists "Authenticated users can read all match predictions" on match_predictions;

create policy "Users can read own match predictions anytime"
on match_predictions
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can read others match predictions after deadline"
on match_predictions
for select
to authenticated
using (
  user_id <> auth.uid()
  and exists (
    select 1
    from matches
    where matches.id = match_predictions.match_id
      and now() >= matches.prediction_deadline
  )
);
