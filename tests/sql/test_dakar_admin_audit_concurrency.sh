#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required for the isolated PostgreSQL concurrency test}"

concurrent_inserts=24
pids=()

for i in $(seq 1 "$concurrent_inserts"); do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
    -c "SET request.jwt.claim.role = 'service_role';
        INSERT INTO public.dakar_admin_audit_events (
          actor_id, action, target_type, target_id, details
        ) VALUES (
          NULL,
          'AUDIT_CONCURRENCY_TEST',
          'synthetic_fixture',
          'parallel-$i',
          jsonb_build_object('fixture', true, 'index', $i)
        );" >/dev/null &
  pids+=("$!")
done

for pid in "${pids[@]}"; do
  wait "$pid"
done

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  latest_event public.dakar_admin_audit_events%rowtype;
  chain_state public.dakar_admin_audit_chain_state%rowtype;
BEGIN
  IF (
    SELECT count(*)
      FROM public.dakar_admin_audit_events
     WHERE action = 'AUDIT_CONCURRENCY_TEST'
  ) <> 24 THEN
    RAISE EXCEPTION 'Concurrent audit inserts were lost';
  END IF;

  IF EXISTS (
    WITH ordered AS (
      SELECT chain_sequence,
             previous_hash,
             lag(chain_sequence) OVER (ORDER BY chain_sequence) AS prior_sequence,
             lag(event_hash) OVER (ORDER BY chain_sequence) AS prior_hash
        FROM public.dakar_admin_audit_events
    )
    SELECT 1
      FROM ordered
     WHERE (prior_sequence IS NULL AND
            (chain_sequence <> 1 OR previous_hash <> repeat('0', 64)))
        OR (prior_sequence IS NOT NULL AND
            (chain_sequence <> prior_sequence + 1 OR previous_hash <> prior_hash))
  ) THEN
    RAISE EXCEPTION 'Concurrent audit inserts broke sequence or hash continuity';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.dakar_admin_audit_events AS event
     WHERE event.event_hash IS DISTINCT FROM public.dakar_admin_sha256(
       jsonb_build_object(
         'chain_sequence', event.chain_sequence,
         'id', event.id,
         'actor_id', event.actor_id,
         'action', event.action,
         'target_type', event.target_type,
         'target_id', event.target_id,
         'details', event.details,
         'created_at_epoch_microseconds',
           (extract(epoch from event.created_at) * 1000000)::bigint,
         'previous_hash', event.previous_hash
       )::text
     )
  ) THEN
    RAISE EXCEPTION 'Concurrent audit event hash does not match its payload';
  END IF;

  SELECT * INTO latest_event
    FROM public.dakar_admin_audit_events
   ORDER BY chain_sequence DESC
   LIMIT 1;
  SELECT * INTO chain_state
    FROM public.dakar_admin_audit_chain_state
   WHERE singleton = true;

  IF chain_state.last_chain_sequence IS DISTINCT FROM latest_event.chain_sequence
     OR chain_state.last_event_hash IS DISTINCT FROM latest_event.event_hash THEN
    RAISE EXCEPTION 'Concurrent audit chain head does not match the latest event';
  END IF;
END;
$$;
SQL
