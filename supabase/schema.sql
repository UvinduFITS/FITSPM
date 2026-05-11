-- ============================================================
-- FitsPM – Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Projects table
create table if not exists projects (
  id bigint generated always as identity primary key,
  name text not null,
  tech_stack text[] not null default '{}',
  project_handler text not null,
  status text not null default 'ongoing'
    check (status in ('ongoing', 'completed', 'on-hold', 'cancelled')),
  start_date date,
  end_date date,
  description text,
  client_name text,
  project_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migration: add project_url to existing installs
alter table projects add column if not exists project_url text;

-- Project documents table
create table if not exists project_documents (
  id bigint generated always as identity primary key,
  project_id bigint references projects(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- Enable Row Level Security
alter table projects enable row level security;
alter table project_documents enable row level security;

-- Policies: all authenticated users can do everything
create policy "auth_select_projects" on projects
  for select to authenticated using (true);
create policy "auth_insert_projects" on projects
  for insert to authenticated with check (true);
create policy "auth_update_projects" on projects
  for update to authenticated using (true);
create policy "auth_delete_projects" on projects
  for delete to authenticated using (true);

create policy "auth_select_documents" on project_documents
  for select to authenticated using (true);
create policy "auth_insert_documents" on project_documents
  for insert to authenticated with check (true);
create policy "auth_delete_documents" on project_documents
  for delete to authenticated using (true);

-- ============================================================
-- Storage bucket (run separately in Supabase Dashboard)
-- Storage > New Bucket > Name: "project-documents" > Public: true
-- ============================================================
