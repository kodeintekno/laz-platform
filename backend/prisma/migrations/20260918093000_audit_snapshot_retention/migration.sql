-- Audit identity is a historical snapshot. Business record deletion must neither
-- delete nor rewrite that history through foreign-key referential actions.
DROP TRIGGER audit_no_update_delete ON audit_logs;
UPDATE audit_logs a SET
 "actorName"=u.name, "actorEmail"=u.email, "actorRole"=r.name,
 "actorInstitutionId"=u."lembagaId", "actorInstitutionName"=l.name,
 actor=CASE WHEN r.name='SUPER_ADMIN' THEN 'SUPER_ADMIN' ELSE 'USER' END
FROM users u JOIN roles r ON r.id=u."roleId" LEFT JOIN lembagas l ON l.id=u."lembagaId"
WHERE a."userId"=u.id AND a."requestId" IS NULL;
UPDATE audit_logs a SET "institutionId"=a."lembagaId", "institutionName"=l.name
FROM lembagas l WHERE l.id=a."lembagaId" AND a."requestId" IS NULL;
CREATE TRIGGER audit_no_update_delete BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION audit_immutable();
ALTER TABLE audit_logs DROP CONSTRAINT "audit_logs_userId_fkey";
ALTER TABLE audit_logs DROP CONSTRAINT "audit_logs_lembagaId_fkey";
