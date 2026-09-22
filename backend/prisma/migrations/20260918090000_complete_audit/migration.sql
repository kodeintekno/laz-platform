ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE TEXT USING "action"::text;
ALTER TABLE "audit_logs"
 ADD COLUMN "actor" TEXT NOT NULL DEFAULT 'SYSTEM',
 ADD COLUMN "actorName" TEXT, ADD COLUMN "actorEmail" TEXT, ADD COLUMN "actorRole" TEXT,
 ADD COLUMN "actorInstitutionId" TEXT, ADD COLUMN "actorInstitutionName" TEXT,
 ADD COLUMN "institutionId" TEXT, ADD COLUMN "institutionName" TEXT,
 ADD COLUMN "module" TEXT NOT NULL DEFAULT 'legacy', ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SUCCESS',
 ADD COLUMN "changes" JSONB, ADD COLUMN "transactionData" JSONB,
 ADD COLUMN "httpMethod" TEXT, ADD COLUMN "endpoint" TEXT, ADD COLUMN "requestId" TEXT,
 ADD COLUMN "correlationId" TEXT, ADD COLUMN "errorMessage" TEXT;
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_lembagaId_createdAt_idx" ON "audit_logs"("lembagaId", "createdAt");
CREATE INDEX "audit_logs_requestId_idx" ON "audit_logs"("requestId");
CREATE INDEX "audit_logs_correlationId_idx" ON "audit_logs"("correlationId");
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");
CREATE INDEX "audit_logs_action_status_idx" ON "audit_logs"("action", "status");

-- Recursively remove credentials and unstructured/provider blobs. Account numbers
-- are masked BEFORE diffing, so neither snapshots nor changes contain raw accounts.
CREATE FUNCTION audit_sanitize(value JSONB) RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE result JSONB; k TEXT; v JSONB;
BEGIN
 IF value IS NULL THEN RETURN NULL; END IF;
 IF jsonb_typeof(value) = 'array' THEN
   SELECT coalesce(jsonb_agg(audit_sanitize(x)), '[]'::jsonb) INTO result FROM jsonb_array_elements(value) x;
   RETURN result;
 END IF;
 IF jsonb_typeof(value) <> 'object' THEN RETURN value; END IF;
 result := '{}'::jsonb;
 FOR k,v IN SELECT * FROM jsonb_each(value) LOOP
   IF k ~* '(password|passwd|token|secret|authorization|cookie|credential|api.?key|otp|private.?key|metadata|payload|headers)' THEN CONTINUE; END IF;
   IF k ~* '(account.?number|rekening)' AND jsonb_typeof(v) = 'string' THEN
     v := to_jsonb('****' || right(v #>> '{}', 4));
   END IF;
   result := result || jsonb_build_object(k, audit_sanitize(v));
 END LOOP;
 RETURN result;
END $$;

-- Clean historical snapshots once, before immutability is enforced.
UPDATE "audit_logs" SET "oldData"=audit_sanitize("oldData"), "newData"=audit_sanitize("newData");

CREATE FUNCTION audit_enrich() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ctx JSONB; u RECORD; k TEXT; b JSONB; a JSONB;
BEGIN
 ctx := coalesce(nullif(current_setting('app.audit_context', true), '')::jsonb, '{}'::jsonb);
 NEW."userId" := coalesce(NEW."userId", ctx->>'userId');
 SELECT users.name, users.email, roles.name AS role, users."lembagaId", lembagas.name AS institution
 INTO u FROM users JOIN roles ON roles.id=users."roleId" LEFT JOIN lembagas ON lembagas.id=users."lembagaId" WHERE users.id=NEW."userId";
 NEW."actorName" := u.name; NEW."actorEmail" := u.email; NEW."actorRole" := u.role;
 NEW."actorInstitutionId" := u."lembagaId"; NEW."actorInstitutionName" := u.institution;
 NEW.actor := CASE WHEN ctx->>'actor'='WEBHOOK' THEN 'WEBHOOK' WHEN u.role='SUPER_ADMIN' THEN 'SUPER_ADMIN' WHEN NEW."userId" IS NOT NULL OR ctx->>'actor'='USER' THEN 'USER' ELSE 'SYSTEM' END;
 IF NEW.action IN ('LOGIN_SUCCESS','LOGIN_FAILED','LOGOUT','REQUEST_FAILED') THEN NEW."lembagaId" := coalesce(NEW."lembagaId", u."lembagaId"); END IF;
 NEW."institutionId" := NEW."lembagaId";
 SELECT name INTO NEW."institutionName" FROM lembagas WHERE id=NEW."lembagaId";
 NEW."ipAddress" := coalesce(NEW."ipAddress", ctx->>'ipAddress');
 NEW."userAgent" := coalesce(NEW."userAgent", ctx->>'userAgent');
 NEW."httpMethod" := coalesce(NEW."httpMethod", ctx->>'httpMethod');
 NEW.endpoint := coalesce(NEW.endpoint, ctx->>'endpoint');
 NEW."requestId" := coalesce(NEW."requestId", ctx->>'requestId', 'db-' || txid_current()::text);
 NEW."correlationId" := coalesce(NEW."correlationId", nullif(current_setting('app.audit_correlation', true), ''), NEW."requestId");
 IF NEW.module='legacy' THEN NEW.module := lower(NEW.entity); END IF;
 b := coalesce(NEW."oldData", '{}'::jsonb); a := coalesce(NEW."newData", '{}'::jsonb);
 NEW."oldData" := audit_sanitize(NEW."oldData"); NEW."newData" := audit_sanitize(NEW."newData");
 NEW."transactionData" := audit_sanitize(coalesce(nullif(current_setting('app.audit_financial', true), '')::jsonb, '{}'::jsonb) || jsonb_strip_nulls(coalesce(NEW."transactionData", '{}'::jsonb)));
 NEW.changes := '{}'::jsonb;
 FOR k IN SELECT jsonb_object_keys(coalesce(NEW."oldData", '{}'::jsonb) || coalesce(NEW."newData", '{}'::jsonb)) LOOP
   IF b->k IS DISTINCT FROM a->k THEN NEW.changes := NEW.changes || jsonb_build_object(k, jsonb_build_object('before', NEW."oldData"->k, 'after', NEW."newData"->k)); END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER audit_enrich_before_insert BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION audit_enrich();

-- Explicit domain events derived from committed row transitions. Every event and
-- its source mutation share the same transaction, including bulk writes/cascades.
CREATE FUNCTION audit_domain_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b JSONB; a JSONB; row_data JSONB; event TEXT; entity TEXT; institution TEXT;
 financial JSONB; correlation TEXT; delta JSONB := '{}'::jsonb; k TEXT;
BEGIN
 IF TG_OP <> 'INSERT' THEN b := to_jsonb(OLD); END IF;
 IF TG_OP <> 'DELETE' THEN a := to_jsonb(NEW); END IF;
 IF b IS NOT NULL AND a IS NOT NULL AND b - 'updatedAt' = a - 'updatedAt' THEN RETURN NEW; END IF;
 row_data := coalesce(a,b); entity := TG_ARGV[0];
 institution := row_data->>'lembagaId';
 event := upper(entity) || CASE TG_OP WHEN 'INSERT' THEN '_CREATED' WHEN 'DELETE' THEN '_DELETED' ELSE '_UPDATED' END;
 IF entity IN ('Payment','Donation','Withdrawal','Payout') THEN
   IF TG_OP='UPDATE' AND b->>'status' IS DISTINCT FROM a->>'status' THEN
     event := upper(entity) || '_' || CASE a->>'status' WHEN 'SUCCESS' THEN 'PAID' WHEN 'SUCCEEDED' THEN 'PAID' WHEN 'COMPLETED' THEN 'PAID' ELSE coalesce(a->>'status','STATUS_CHANGED') END;
   END IF;
   correlation := CASE WHEN entity='Payment' THEN 'donation:' || (row_data->>'donationId') WHEN entity='Donation' THEN 'donation:' || (row_data->>'id') WHEN entity='Payout' THEN 'withdrawal:' || (row_data->>'withdrawalId') ELSE 'withdrawal:' || (row_data->>'id') END;
   PERFORM set_config('app.audit_correlation', correlation, true);
 END IF;
 IF entity='JournalDetail' THEN SELECT "lembagaId" INTO institution FROM journals WHERE id=row_data->>'journalId'; END IF;
 IF entity='Payout' THEN SELECT "lembagaId" INTO institution FROM withdrawals WHERE id=row_data->>'withdrawalId'; END IF;
 IF entity='Institution' THEN
   institution := row_data->>'id';
   IF TG_OP='UPDATE' AND b->>'status' IS DISTINCT FROM a->>'status' THEN event := 'INSTITUTION_' || (a->>'status'); END IF;
   IF TG_OP='UPDATE' AND (b->>'accountNumber' IS DISTINCT FROM a->>'accountNumber' OR b->>'bankCode' IS DISTINCT FROM a->>'bankCode') THEN event := 'BANK_ACCOUNT_CHANGED'; END IF;
 END IF;
 IF entity='BankAccount' THEN event := 'BANK_ACCOUNT_CHANGED'; END IF;
 IF entity='User' AND TG_OP='UPDATE' THEN
   IF b->>'roleId' IS DISTINCT FROM a->>'roleId' THEN event := 'ROLE_CHANGED';
   ELSIF b->>'password' IS DISTINCT FROM a->>'password' THEN event := 'PASSWORD_CHANGED'; END IF;
 END IF;
 IF entity IN ('Role','Permission','RolePermission') THEN event := CASE WHEN entity='Role' THEN 'ROLE_CHANGED' ELSE 'PERMISSION_CHANGED' END; END IF;
 IF entity IN ('InstitutionBalance','ProgramBalance','PlatformBalance') THEN
   event := 'BALANCE_CHANGED';
   FOR k IN SELECT jsonb_object_keys(row_data) LOOP
     IF k ~* 'balance$' THEN delta := delta || jsonb_build_object(k, coalesce((a->>k)::numeric,0)-coalesce((b->>k)::numeric,0)); END IF;
   END LOOP;
 END IF;
 financial := jsonb_build_object('amount', row_data->'amount', 'balanceBefore', b->'balance', 'balanceAfter', a->'balance', 'balanceDelta', delta,
   'paymentId', CASE WHEN entity='Payment' THEN row_data->>'id' ELSE row_data->>'paymentId' END,
   'donationId', CASE WHEN entity='Donation' THEN row_data->>'id' ELSE row_data->>'donationId' END,
   'withdrawalId', CASE WHEN entity='Withdrawal' THEN row_data->>'id' ELSE row_data->>'withdrawalId' END,
   'payoutId', CASE WHEN entity='Payout' THEN row_data->>'id' ELSE NULL END,
   'gatewayReference', coalesce(row_data->>'xenditPayoutId', row_data->>'xenditPaymentRequestId', row_data->>'gatewayRef'),
   'accountNumber', row_data->'accountNumber', 'platformFee', row_data->'platformFee', 'amilPlatformAmount', row_data->'amilPlatformAmount', 'amilInstitutionAmount', row_data->'amilInstitutionAmount', 'netAmount', row_data->'netAmount', 'statusBefore', b->'status', 'statusAfter', a->'status');
 INSERT INTO audit_logs(id, "lembagaId", action, entity, "entityId", module, "oldData", "newData", "transactionData", "correlationId", "createdAt")
 VALUES(gen_random_uuid()::text, institution, event, entity, coalesce(row_data->>'id',row_data->>'roleId'), lower(entity), b,a,financial,correlation,clock_timestamp());
 RETURN coalesce(NEW,OLD);
END $$;

CREATE FUNCTION audit_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit logs are append-only'; END $$;
CREATE TRIGGER audit_no_update_delete BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION audit_immutable();
CREATE TRIGGER audit_no_truncate BEFORE TRUNCATE ON audit_logs FOR EACH STATEMENT EXECUTE FUNCTION audit_immutable();
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Payment');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON donations FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Donation');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON withdrawals FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Withdrawal');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON payouts FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Payout');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON institution_balances FOR EACH ROW EXECUTE FUNCTION audit_domain_change('InstitutionBalance');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON program_balances FOR EACH ROW EXECUTE FUNCTION audit_domain_change('ProgramBalance');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON platform_balances FOR EACH ROW EXECUTE FUNCTION audit_domain_change('PlatformBalance');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON journals FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Journal');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON journal_details FOR EACH ROW EXECUTE FUNCTION audit_domain_change('JournalDetail');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON lembagas FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Institution');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON lembaga_bank_accounts FOR EACH ROW EXECUTE FUNCTION audit_domain_change('BankAccount');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON bank_account_change_requests FOR EACH ROW EXECUTE FUNCTION audit_domain_change('BankAccountChangeRequest');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_domain_change('User');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON roles FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Role');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON permissions FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Permission');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON role_permissions FOR EACH ROW EXECUTE FUNCTION audit_domain_change('RolePermission');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON distributions FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Distribution');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON amil_global_settings FOR EACH ROW EXECUTE FUNCTION audit_domain_change('AmilGlobalSetting');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON amil_institution_settings FOR EACH ROW EXECUTE FUNCTION audit_domain_change('AmilInstitutionSetting');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON amil_platform_change_requests FOR EACH ROW EXECUTE FUNCTION audit_domain_change('AmilPlatformChangeRequest');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON chart_of_accounts FOR EACH ROW EXECUTE FUNCTION audit_domain_change('ChartOfAccount');
