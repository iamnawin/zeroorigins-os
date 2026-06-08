-- Migration: Simplify internal role model to admin/employee
--
-- Replaces SUPER_ADMIN, FOUNDER, DIRECTOR, STAFF, CONTRACTOR with admin/employee.
-- CUSTOMER, PARTNER, REFERRAL_PARTNER (external roles) are unchanged.
-- Old enum values remain in the enum type but are no longer used.

-- 1. Extend enum with new values (committed before DML in PG 12+)
alter type app_role add value if not exists 'admin';
alter type app_role add value if not exists 'employee';
