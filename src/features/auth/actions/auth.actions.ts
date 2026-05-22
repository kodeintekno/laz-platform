"use server";

import { signIn } from "@/lib/auth";
import { authService } from "@/features/auth/services/auth.service";
import { loginSchema, registerSchema } from "@/features/auth/validations/auth.schema";
import { AuthError } from "next-auth";

/**
 * Server Actions for Authentication.
 */

export async function loginAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Data tidak valid" };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirect: false, // We handle redirect manually in the client
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah" };
        default:
          return { error: "Terjadi kesalahan sistem" };
      }
    }
    return { error: "Email atau password salah" }; // NextAuth throws non-AuthErrors sometimes in Beta
  }
}

export async function registerAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Data tidak valid" };
  }

  try {
    await authService.register(parsed.data);
    
    // Auto login after successful registration
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal melakukan registrasi" };
  }
}
