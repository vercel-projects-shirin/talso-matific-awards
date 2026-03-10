------------------------------------------------------------
-- 1. Revert previous migration — CASCADE drops all tables,
--    policies, privileges, and sequences within the schemas
------------------------------------------------------------
DROP SCHEMA IF EXISTS prod CASCADE;
DROP SCHEMA IF EXISTS local CASCADE;

ALTER ROLE authenticator RESET pgrst.db_schemas;
NOTIFY pgrst, 'reload config';

------------------------------------------------------------
-- 2. Create prefixed tables in public schema — PROD
------------------------------------------------------------
CREATE TABLE public.prod__nominees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prod__nominations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  timestamp text,
  email text,
  nominator_name text NOT NULL,
  nominee_name text NOT NULL,
  category text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 3. Create prefixed tables in public schema — LOCAL
------------------------------------------------------------
CREATE TABLE public.local__nominees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.local__nominations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  timestamp text,
  email text,
  nominator_name text NOT NULL,
  nominee_name text NOT NULL,
  category text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 4. Enable Row Level Security
------------------------------------------------------------
ALTER TABLE public.prod__nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prod__nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local__nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local__nominations ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- 5. RLS policies — allow full access via anon key
------------------------------------------------------------
CREATE POLICY "allow all" ON public.prod__nominees
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all" ON public.prod__nominations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all" ON public.local__nominees
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all" ON public.local__nominations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
