import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/auth/AuthProvider";
import { VolunteerAuthProvider } from "@/auth/VolunteerAuthProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { router } from "@/router";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <VolunteerAuthProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </VolunteerAuthProvider>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
);
