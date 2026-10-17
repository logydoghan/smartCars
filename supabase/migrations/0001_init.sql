-- SmartCars schema: one row per car page. The agents rewrite a car's row each time they
-- refresh it; nested lists (reviews, owner themes, recalls) are stored as JSON.

create table if not exists cars (
  slug                 text primary key,
  year                 integer not null,
  make                 text not null,
  model                text not null,
  body                 text not null check (body in ('SUV', 'Sedan', 'Truck', 'Hatchback', 'Minivan')),
  powertrain           text not null check (powertrain in ('Gas', 'Hybrid', 'Electric')),
  price_from           integer,
  headline             text not null,
  verdict              text not null,
  agreement_level      text not null check (agreement_level in ('mostly agree', 'mixed', 'split')),
  critic_score         numeric(3, 1),
  critic_consensus     text not null default '',
  -- [{ outlet, url, title, published, score, score_10, summary, likes[], dislikes[] }]
  critics              jsonb not null default '[]'::jsonb,
  owner_overview       text not null default '',
  -- [{ title, component, summary, count, complaint_ids[] }]
  owner_themes         jsonb not null default '[]'::jsonb,
  complaint_count      integer not null default 0,
  -- [{ component, count }]
  complaint_components jsonb not null default '[]'::jsonb,
  crash_count          integer not null default 0,
  fire_count           integer not null default 0,
  injury_count         integer not null default 0,
  -- [{ campaign, reported, component, summary, consequence, remedy, park_it }]
  recalls              jsonb not null default '[]'::jsonb,
  -- [{ topic, headline, critics, owners, records, kind, strength }]
  disagreements        jsonb not null default '[]'::jsonb,
  agreements           jsonb not null default '[]'::jsonb,
  updated_at           timestamptz not null default now()
);

create index if not exists cars_make_model_idx on cars (make, model, year);

-- The website reads with the public anon key; only the agents (service connection) write.
alter table cars enable row level security;
create policy "Public read" on cars for select using (true);
