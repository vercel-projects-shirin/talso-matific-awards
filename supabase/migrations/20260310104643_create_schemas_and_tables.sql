------------------------------------------------------------
-- 1. Create schemas
------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS prod;
CREATE SCHEMA IF NOT EXISTS local;

------------------------------------------------------------
-- 2. Grant permissions to Supabase roles
------------------------------------------------------------
GRANT USAGE ON SCHEMA prod TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA local TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA prod
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA prod
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA local
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA local
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

------------------------------------------------------------
-- 3. Create tables in PROD schema
------------------------------------------------------------
CREATE TABLE prod.nominees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prod.nominations (
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
-- 4. Create identical tables in LOCAL schema
------------------------------------------------------------
CREATE TABLE local.nominees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE local.nominations (
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
-- 5. Enable Row Level Security
------------------------------------------------------------
ALTER TABLE prod.nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE prod.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE local.nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE local.nominations ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- 6. RLS policies — allow full access via anon key
--    (this is an internal admin tool, not user-facing)
------------------------------------------------------------
CREATE POLICY "allow all on prod.nominees" ON prod.nominees
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all on prod.nominations" ON prod.nominations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all on local.nominees" ON local.nominees
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow all on local.nominations" ON local.nominations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

------------------------------------------------------------
-- 7. Grant explicit permissions on the new tables
------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA prod TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA prod TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA local TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA local TO anon, authenticated, service_role;

------------------------------------------------------------
-- 8. Expose schemas via PostgREST config
------------------------------------------------------------
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, prod, local';
NOTIFY pgrst, 'reload config';