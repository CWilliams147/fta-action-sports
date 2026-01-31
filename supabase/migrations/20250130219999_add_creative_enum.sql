-- Add 'creative' to account_type enum.
-- Must be in its own migration so the value is committed before use in constraints.
-- (Postgres 15+: IF NOT EXISTS makes this idempotent.)
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'creative';
