import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authService } from "@/features/auth/services/auth.service";
import { loginSchema } from "@/features/auth/validations/auth.schema";
import type { RBACSessionUser, PermissionKey } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.parse(credentials);
          const user = await authService.signIn(parsed);

          if (!user) {
            return null;
          }

          return user as any; // NextAuth user type is loose
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const rbacUser = user as unknown as RBACSessionUser;
        token.id = rbacUser.id;
        token.roleId = rbacUser.roleId;
        token.roleName = rbacUser.roleName;
        token.permissions = rbacUser.permissions;
        token.lazId = rbacUser.lazId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.roleId = token.roleId as string | undefined;
        session.user.roleName = token.roleName as RBACSessionUser["roleName"] | undefined;
        session.user.permissions = (token.permissions as PermissionKey[]) ?? [];
        session.user.lazId = token.lazId as string | undefined;
      }
      return session;
    },
  },
});
