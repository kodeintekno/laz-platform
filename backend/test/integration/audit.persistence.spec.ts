import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { describe, it, expect } from "vitest";

// All schema/data changes are rollback-only, including testing an unapplied migration.
describe.skipIf(!process.env.TEST_DATABASE_URL)("Audit persistence (PostgreSQL)", () => {
  it("captures exact balances, actor snapshots, masks credentials, prevents edits and rolls back atomically", async () => {
    const db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await db.connect();
    try {
      await db.query("BEGIN");
      const present = await db.query("SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor'");
      if (!present.rowCount) {
        for (const migration of ["20260918090000_complete_audit", "20260918093000_audit_snapshot_retention", "20260918100000_audit_fund_allocations"]) {
          await db.query(readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"));
        }
      }
      const id = randomUUID();
      await db.query('INSERT INTO lembagas (id,name,slug,"updatedAt") VALUES ($1,$2,$1,now())', [id, "Audit test"]);
      await db.query('INSERT INTO roles (id,name,"updatedAt") VALUES ($1,$1,now())', [id]);
      await db.query('INSERT INTO users (id,email,name,"roleId","lembagaId","updatedAt") VALUES ($1,$2,$3,$1,$1,now())', [id, `${id}@audit.test`, "Original actor"]);
      await db.query("SELECT set_config('app.audit_context', $1, true)", [JSON.stringify({ requestId: id, userId: id, httpMethod: "POST", endpoint: "/api/withdrawals", ipAddress: "127.0.0.1", userAgent: "Audit test" })]);
      await db.query("SELECT set_config('app.audit_financial', $1, true)", [JSON.stringify({ withdrawalId: "withdrawal-test" })]);
      await db.query('INSERT INTO institution_balances (id,"lembagaId",balance,"mustahiqBalance","updatedAt") VALUES ($1,$1,1000000,1000000,now())', [id]);
      await db.query('UPDATE institution_balances SET balance=balance-250000,"mustahiqBalance"=750000,"reservedBalance"=250000,"reservedMustahiqBalance"=250000 WHERE id=$1', [id]);
      const { rows: [log] } = await db.query('SELECT * FROM audit_logs WHERE "entityId"=$1 AND action=$2 ORDER BY "createdAt" DESC LIMIT 1', [id, "BALANCE_CHANGED"]);
      expect(log.actorName).toBe("Original actor");
      expect(log.actorInstitutionId).toBe(id);
      expect(log.requestId).toBe(id);
      expect(log.changes.balance).toEqual({ before: 1000000, after: 750000 });
      expect(log.transactionData).toMatchObject({ withdrawalId: "withdrawal-test", balanceBefore: 1000000, balanceAfter: 750000, balanceDelta: { balance: -250000, reservedBalance: 250000 } });
      await db.query('UPDATE users SET name=$2 WHERE id=$1', [id, "Renamed"]);
      expect((await db.query('SELECT "actorName" FROM audit_logs WHERE id=$1', [log.id])).rows[0].actorName).toBe("Original actor");
      const data = { password: "never-save", accountNumber: "1234567890", nested: { apiKey: "never-save", authorization: "never-save", token: "never-save" }, metadata: { raw: "never-save" } };
      await db.query('INSERT INTO audit_logs(id,action,entity,"newData") VALUES ($1,$2,$3,$4)', [randomUUID(), "SECURITY_TEST", "Test", data]);
      const safe = (await db.query("SELECT * FROM audit_logs WHERE action='SECURITY_TEST' AND \"requestId\"=$1", [id])).rows[0];
      expect(JSON.stringify(safe)).not.toContain("never-save");
      expect(safe.newData.accountNumber).toBe("****7890");
      for (const sql of ['UPDATE audit_logs SET action=action WHERE id=$1', 'DELETE FROM audit_logs WHERE id=$1', 'TRUNCATE audit_logs']) {
        await db.query("SAVEPOINT immutable_test");
        await expect(db.query(sql, sql.includes('$1') ? [log.id] : [])).rejects.toThrow("append-only");
        await db.query("ROLLBACK TO SAVEPOINT immutable_test");
      }
      const count = (await db.query('SELECT count(*) FROM audit_logs WHERE "requestId"=$1', [id])).rows[0].count;
      await db.query("SAVEPOINT financial_rollback");
      await db.query('UPDATE institution_balances SET balance=0,"mustahiqBalance"=0 WHERE id=$1', [id]);
      await db.query("ROLLBACK TO SAVEPOINT financial_rollback");
      expect((await db.query('SELECT count(*) FROM audit_logs WHERE "requestId"=$1', [id])).rows[0].count).toBe(count);
      await db.query('DELETE FROM users WHERE id=$1', [id]);
      expect((await db.query('SELECT "actorName" FROM audit_logs WHERE id=$1', [log.id])).rows[0].actorName).toBe("Original actor");
    } finally {
      await db.query("ROLLBACK");
      await db.end();
    }
  }, 30000);
});
