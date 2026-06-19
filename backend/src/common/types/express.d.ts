import type { RBACSessionUser } from "../../../../shared/types/rbac";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      /** Diisi oleh AuthGuard — fresh dari DB tiap request. */
      user?: RBACSessionUser;
    }
  }
}

export {};
