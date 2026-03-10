------------------------------------------------------------
-- Users table — PROD
------------------------------------------------------------
CREATE TABLE public.prod__users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- Users table — LOCAL
------------------------------------------------------------
CREATE TABLE public.local__users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- Sessions table — PROD
------------------------------------------------------------
CREATE TABLE public.prod__sessions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.prod__users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- Sessions table — LOCAL
------------------------------------------------------------
CREATE TABLE public.local__sessions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.local__users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- Indexes for fast token lookups
------------------------------------------------------------
CREATE INDEX idx_prod__sessions_token ON public.prod__sessions(token);
CREATE INDEX idx_local__sessions_token ON public.local__sessions(token);

------------------------------------------------------------
-- RLS
------------------------------------------------------------
ALTER TABLE public.prod__users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local__users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prod__sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local__sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON public.prod__users
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all" ON public.local__users
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all" ON public.prod__sessions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all" ON public.local__sessions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
