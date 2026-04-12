-- Enforce that SUPER_ADMIN users never belong to a tenant and that all other
-- users always do. This closes the gap between application-layer role checks
-- and the database, making cross-tenant user leakage structurally impossible.
ALTER TABLE "users"
  ADD CONSTRAINT "chk_user_tenant_role"
  CHECK (
    (role = 'SUPER_ADMIN' AND tenant_id IS NULL)
    OR
    (role <> 'SUPER_ADMIN' AND tenant_id IS NOT NULL)
  );
