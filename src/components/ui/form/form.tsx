"use client";

import { useFormContext } from "react-hook-form";

/**
 * Helper hook alias to retrieve React Hook Form context parameters easily.
 */
export function useForm() {
  return useFormContext();
}
