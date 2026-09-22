-- Named allocation events keep the fee/amil/program portions independently searchable.
CREATE FUNCTION audit_donation_allocations() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE event TEXT; before_data JSONB; after_data JSONB;
BEGIN
 IF OLD.status IS DISTINCT FROM NEW.status THEN
   INSERT INTO audit_logs(id,"lembagaId",action,entity,"entityId",module,"oldData","newData","correlationId","createdAt")
   VALUES(gen_random_uuid()::text, NEW."lembagaId", 'DONATION_STATUS_CHANGED', 'Donation', NEW.id, 'donation', jsonb_build_object('status',OLD.status), jsonb_build_object('status',NEW.status), 'donation:' || NEW.id, clock_timestamp());
 END IF;
 IF NEW.status='PAID' AND (OLD.status IS DISTINCT FROM NEW.status OR
   ROW(OLD."platformFee",OLD."amilPlatformAmount",OLD."amilInstitutionAmount",OLD."netAmount") IS DISTINCT FROM
   ROW(NEW."platformFee",NEW."amilPlatformAmount",NEW."amilInstitutionAmount",NEW."netAmount")) THEN
   before_data := jsonb_build_object('platformFee',OLD."platformFee",'amilPlatformAmount',OLD."amilPlatformAmount",'amilInstitutionAmount',OLD."amilInstitutionAmount",'netAmount',OLD."netAmount");
   after_data := jsonb_build_object('platformFee',NEW."platformFee",'amilPlatformAmount',NEW."amilPlatformAmount",'amilInstitutionAmount',NEW."amilInstitutionAmount",'netAmount',NEW."netAmount");
   FOREACH event IN ARRAY ARRAY['PLATFORM_FEE_RECORDED','AMIL_FUNDS_ALLOCATED','PROGRAM_FUNDS_ALLOCATED'] LOOP
     INSERT INTO audit_logs(id,"lembagaId",action,entity,"entityId",module,"oldData","newData","transactionData","correlationId","createdAt")
     VALUES(gen_random_uuid()::text, NEW."lembagaId",event,'Donation',NEW.id,'donation',before_data,after_data,
       after_data || jsonb_build_object('donationId',NEW.id,'amount',NEW.amount),'donation:' || NEW.id,clock_timestamp());
   END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER audit_donation_allocations AFTER UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION audit_donation_allocations();
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON programs FOR EACH ROW EXECUTE FUNCTION audit_domain_change('Program');
CREATE TRIGGER audit_domain AFTER INSERT OR UPDATE OR DELETE ON accounting_books FOR EACH ROW EXECUTE FUNCTION audit_domain_change('AccountingBook');
CREATE INDEX "audit_logs_userId_createdAt_idx" ON audit_logs("userId","createdAt");
CREATE INDEX "audit_logs_module_createdAt_idx" ON audit_logs(module,"createdAt");
CREATE INDEX "audit_logs_actorRole_createdAt_idx" ON audit_logs("actorRole","createdAt");
