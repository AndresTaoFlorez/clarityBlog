# Database Schema and Relations

This document describes the current database schema used by the backend service and provides SQL snippets to create and maintain the structure in a PostgreSQL/Supabase environment.

## Tables

### 1) users
- id (uuid, pk, default gen_random_uuid())
- name (varchar, not null)
- email (varchar, not null, unique)
- password (varchar, not null)
- role (varchar, null) — e.g., 'admin' | 'user'
- avatar (text, null, default '😊')
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 2) userdescriptions
- id (uuid, pk, default gen_random_uuid())
- user_id (uuid, not null, fk → users.id)
- biography (text, null)

### 3) articles
- id (uuid, pk, default gen_random_uuid())
- title (varchar, not null)
- description (text, null)
- user_id (uuid, not null, fk → users.id)
- category (text, null, default 'general')
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 4) comments
- id (uuid, pk, default gen_random_uuid())
- comment (text, not null)
- user_id (uuid, not null, fk → users.id)
- article_id (uuid, not null, fk → articles.id)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 5) categories (NEW)
- id (uuid, pk, default gen_random_uuid())
- slug (text, not null, unique) — machine name, e.g., 'technology'
- name (text, not null) — human name, e.g., 'Tecnología'
- created_at (timestamptz, default now())

Seed values for categories:
- ('general', 'General')
- ('technology', 'Tecnología')
- ('design', 'Diseño')
- ('business', 'Negocios')
- ('lifestyle', 'Estilo de vida')
- ('travel', 'Viajes')
- ('food', 'Comida')
- ('sports', 'Deportes')

Note: articles.category remains a text column defaulting to 'general'. You can optionally add a foreign key from articles.category → categories.slug for stricter integrity (recommended), or keep it as text and validate at the application layer.

## SQL (PostgreSQL / Supabase)

```sql
-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  email varchar not null unique,
  password varchar not null,
  role varchar,
  avatar text default '😊',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- userdescriptions
create table if not exists public.userdescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  biography text
);

-- articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title varchar not null,
  description text,
  user_id uuid not null references public.users(id) on delete cascade,
  category text default 'general',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  comment text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- categories (new)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz default now()
);

-- Optional: enforce FK from articles.category to categories.slug
-- alter table public.articles
--   add constraint fk_articles_category
--   foreign key (category) references public.categories(slug)
--   on update cascade on delete restrict;

-- Seed categories
insert into public.categories (slug, name)
values
  ('general', 'General'),
  ('technology', 'Tecnología'),
  ('design', 'Diseño'),
  ('business', 'Negocios'),
  ('lifestyle', 'Estilo de vida'),
  ('travel', 'Viajes'),
  ('food', 'Comida'),
  ('sports', 'Deportes')
on conflict (slug) do nothing;
```

## API Additions

- GET /api/categories — list all categories
- GET /api/categories/:slug/articles — list articles by category (paginated)
- Articles list supports filter: GET /api/articles?category=slug

Validation: On article create/update, validate provided category against categories table; fallback to 'general' if invalid (or reject with 400).

## Notes
- commentsTotal per article is exposed in the articles list endpoint to avoid extra per-card requests on the frontend.
- Pagination is offset-based for articles (page/limit), and cursor-based for article comments (nextCursor/previousCursor).
