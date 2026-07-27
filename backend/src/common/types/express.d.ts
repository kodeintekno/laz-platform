import type { RBACSessionUser } from "../../../../shared/types/rbac";
import type { VolunteerSessionUser } from "../../../../shared/types/volunteer";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    volunteerId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      /** Diisi oleh AuthGuard — fresh dari DB tiap request. */
      user?: RBACSessionUser;
      /** Diisi oleh VolunteerAuthGuard — principal terpisah dari User. */
      volunteer?: VolunteerSessionUser;
    }
  }
}

export {};
