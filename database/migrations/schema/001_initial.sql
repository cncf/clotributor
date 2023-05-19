do $$ begin execute
'alter database ' || current_database() || ' set default_text_search_config = simple';
end; $$;

create extension if not exists pgcrypto;

create table if not exists foundation (
    foundation_id text primary key,
    display_name text not null check (display_name <> ''),
    data_url text not null check (data_url <> '')
);

create type maturity as enum ('graduated', 'incubating', 'sandbox');

create table if not exists project (
    project_id uuid primary key default gen_random_uuid(),
    name text not null check (name <> ''),
    display_name text check (display_name <> ''),
    description text check (description <> ''),
    logo_url text check (logo_url <> ''),
    logo_dark_url text check (logo_dark_url <> ''),
    devstats_url text check (devstats_url <> ''),
    accepted_at date,
    maturity maturity,
    maintainers_wanted jsonb,
    digest text,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    foundation_id text not null references foundation on delete restrict,
    unique (foundation_id, name)
);

create index project_foundation_id_idx on project (foundation_id);

create table if not exists repository (
    repository_id uuid primary key default gen_random_uuid(),
    name text not null check (name <> ''),
    description text,
    url text not null check (url <> ''),
    homepage_url text,
    topics text[],
    languages text[],
    stars integer,
    digest text,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    tracked_at timestamptz,
    project_id uuid not null references project on delete cascade,
    unique (project_id, url)
);

create index repository_project_id_idx on repository (project_id);

create type area as enum ('docs');
create type kind as enum ('bug', 'feature', 'enhancement');
create type difficulty as enum ('easy', 'medium', 'hard');

create table if not exists issue (
    issue_id bigint primary key,
    title text not null check (title <> ''),
    url text not null check (url <> ''),
    number integer not null,
    labels text[] not null,
    digest text,
    area area,
    kind kind,
    difficulty difficulty,
    mentor_available boolean,
    mentor text,
    good_first_issue boolean,
    tsdoc tsvector not null,
    published_at timestamptz not null default current_timestamp,
    created_at timestamptz not null default current_timestamp,
    updated_at timestamptz not null default current_timestamp,
    repository_id uuid not null references repository on delete cascade
);

create index issue_tsdoc_idx on issue using gin (tsdoc);
create index issue_repository_id_idx on issue (repository_id);
