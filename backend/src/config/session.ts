import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import type { RequestHandler } from "express";

/**
 * Session server-side di PostgreSQL (express-session + connect-pg-simple).
 * - Session hanya menyimpan { userId } — permissions selalu fresh dari DB.
 * - Tabel "session" dibuat lewat migration Prisma (createTableIfMissing: false).
 * - Cookie: laz.sid, httpOnly, secure (prod), sameSite=lax, 8 jam rolling.
 */
let cached: { middleware: RequestHandler; pool: Pool } | undefined;

export function getSession(): { middleware: RequestHandler; pool: Pool } {
  cached ??= createSessionMiddleware();
  return cached;
}

function createSessionMiddleware(): { middleware: RequestHandler; pool: Pool } {
  const PgStore = connectPgSimple(session);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const isProd = process.env.NODE_ENV === "production";

  const middleware = session({
    store: new PgStore({
      pool,
      tableName: "session",
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 15, // bersihkan row kedaluwarsa tiap 15 menit
    }),
    name: "laz.sid",
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: isProd,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 jam
    },
  });

  return { middleware, pool };
}

/**
 * Revoke semua session milik satu user (dipakai saat ganti password /
 * ganti role). `exceptSid` mempertahankan session yang sedang aktif.
 */
export async function revokeUserSessions(
  userId: string,
  exceptSid?: string,
): Promise<void> {
  const { pool } = getSession();
  if (exceptSid) {
    await pool.query(
      `DELETE FROM "session" WHERE sess->>'userId' = $1 AND sid <> $2`,
      [userId, exceptSid],
    );
  } else {
    await pool.query(`DELETE FROM "session" WHERE sess->>'userId' = $1`, [userId]);
  }
}
