-- Rebuild only DDD candidate return sequences that do not match the exact
-- reverse of their source-documented outbound sequence.
-- The previous candidate sequences are preserved in the private backup table.
-- TER/BRT/AFTU/TATA and all verified directions are intentionally untouched.

create schema if not exists private;

create table if not exists private.mobility_direction_sequence_backups (
  direction_id uuid primary key,
  line_id uuid not null,
  dataset_version_id uuid,
  network_code text not null,
  line_code text not null,
  direction_code text not null,
  direction_method text not null,
  status text not null,
  stop_ids uuid[] not null,
  stop_names text[] not null,
  backed_up_at timestamptz not null default now(),
  repair_reason text not null
);

create temp table tmp_ddd_reverse_repairs on commit drop as
with pairs as (
  select
    r.id as return_id,
    o.id as outbound_id,
    r.line_id,
    r.dataset_version_id,
    n.code as network_code,
    l.code as line_code,
    r.direction_code,
    r.direction_method,
    r.status::text as status
  from public.mobility_directions r
  join public.mobility_directions o
    on o.line_id = r.line_id
   and o.dataset_version_id = r.dataset_version_id
   and o.direction_method = 'source_documented'
  join public.mobility_lines l on l.id = r.line_id
  join public.mobility_networks n on n.id = l.network_id
  where r.direction_method = 'reverse_derived'
    and r.status = 'candidate'
    and n.code = 'ddd'
),
actual as (
  select
    ls.direction_id,
    array_agg(ls.stop_id order by ls.stop_sequence) as stop_ids,
    array_agg(coalesce(s.canonical_name, '') order by ls.stop_sequence) as stop_names
  from public.mobility_line_stops ls
  left join public.mobility_stops s on s.id = ls.stop_id
  group by ls.direction_id
),
expected as (
  select
    p.return_id,
    array_agg(ls.stop_id order by ls.stop_sequence desc) as stop_ids,
    array_agg(coalesce(s.canonical_name, '') order by ls.stop_sequence desc) as stop_names
  from pairs p
  join public.mobility_line_stops ls on ls.direction_id = p.outbound_id
  left join public.mobility_stops s on s.id = ls.stop_id
  group by p.return_id
)
select
  p.*,
  a.stop_ids as actual_ids,
  a.stop_names as actual_names,
  e.stop_ids as expected_ids,
  e.stop_names as expected_names
from pairs p
join actual a on a.direction_id = p.return_id
join expected e on e.return_id = p.return_id
where a.stop_ids is distinct from e.stop_ids;

insert into private.mobility_direction_sequence_backups (
  direction_id, line_id, dataset_version_id, network_code, line_code,
  direction_code, direction_method, status, stop_ids, stop_names, repair_reason
)
select
  return_id, line_id, dataset_version_id, network_code, line_code,
  direction_code, direction_method, status, actual_ids, actual_names,
  'Backup before rebuilding return sequence from reversed source-documented outbound sequence.'
from tmp_ddd_reverse_repairs
on conflict (direction_id) do nothing;

delete from public.mobility_line_stops
where direction_id in (select return_id from tmp_ddd_reverse_repairs);

insert into public.mobility_line_stops (
  direction_id, stop_id, stop_sequence, source_id, verified_at
)
select
  repairs.return_id,
  outbound.stop_id,
  row_number() over (
    partition by repairs.return_id
    order by outbound.stop_sequence desc
  )::integer,
  outbound.source_id,
  outbound.verified_at
from tmp_ddd_reverse_repairs repairs
join public.mobility_line_stops outbound
  on outbound.direction_id = repairs.outbound_id;

do $$
declare
  remaining_mismatches integer;
begin
  with direction_sequences as (
    select
      d.id,
      d.line_id,
      d.direction_method,
      d.dataset_version_id,
      array_agg(ls.stop_id order by ls.stop_sequence) as stop_ids
    from public.mobility_directions d
    join public.mobility_line_stops ls on ls.direction_id = d.id
    where d.direction_method in ('source_documented', 'reverse_derived')
    group by d.id
  ),
  returns as (
    select
      r.line_id,
      r.stop_ids as actual_ids,
      array(
        select x
        from unnest(o.stop_ids) with ordinality u(x, ord)
        order by ord desc
      ) as expected_ids
    from direction_sequences r
    join direction_sequences o
      on o.line_id = r.line_id
     and o.dataset_version_id = r.dataset_version_id
     and o.direction_method = 'source_documented'
    join public.mobility_lines l on l.id = r.line_id
    join public.mobility_networks n on n.id = l.network_id
    where r.direction_method = 'reverse_derived'
      and r.dataset_version_id is not null
      and n.code = 'ddd'
  )
  select count(*) into remaining_mismatches
  from returns
  where actual_ids is distinct from expected_ids;

  if remaining_mismatches > 0 then
    raise exception 'DDD reverse sequence repair incomplete: % mismatches remain', remaining_mismatches;
  end if;
end $$;
