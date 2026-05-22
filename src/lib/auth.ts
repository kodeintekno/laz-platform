import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth v5 (beta) configuration — Phase 1 scaffold.
 *
 * This is a stub. Full implementation (DB lookup, password verify,
 * role/permission injection into JWT) comes in the Auth phase.
 *
 * The exported `auth`, `handlers`, `signIn`, `signOut` are used:
 *  - handlers  → src/app/api/auth/[...nextauth]/route.ts
 *  - auth       → Server Components, middleware
 *  - signIn/Out → Server Actions in auth feature
 */
export const authConfig: NextAuthConfig = {
  // Use JWT strategy (stateless — no DB sessions table required)
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * TODO (Auth Phase): Replace stub with:
       * 1. Look up user via UserRepository
       * 2. Verify password with bcrypt
       * 3. Load role + permissions
       * 4. Return user object (injected into JWT via jwt callback)
       */
      async authorize(_credentials) {
        // Stub — always returns null until auth phase is implemented
        return null;
      },
    }),
  ],

  callbacks: {
    /**
     * JWT callback — extend token with custom fields.
     * TODO (Auth Phase): Inject userId, role, permissions from DB lookup.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // token.role = user.role        — added in auth phase
        // token.permissions = [...]     — added in auth phase
      }
      return token;
    },

    /**
     * Session callback — expose token fields to the client session.
     * TODO (Auth Phase): Expose role and permissions to session.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        // session.user.role = token.role
        // session.user.permissions = token.permissions
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
