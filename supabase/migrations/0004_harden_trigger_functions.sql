-- Postgres exposes every function in the `public` schema as a PostgREST RPC
-- endpoint by default. handle_new_user() and prevent_role_self_escalation()
-- are trigger-only functions (they reference NEW/OLD, which only exist in
-- trigger context) and were never meant to be called directly — revoke the
-- auto-granted EXECUTE so they aren't reachable via /rest/v1/rpc/*.
-- set_user_role() and is_admin() are intentionally callable (they self-check
-- is_admin() / are read-only) and are left as-is.

revoke execute on function handle_new_user() from anon, authenticated;
revoke execute on function prevent_role_self_escalation() from anon, authenticated;
