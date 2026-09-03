import { z } from "zod";
import {
  programSchema as sharedProgramSchema,
  PROGRAM_CATEGORIES,
  PROGRAM_STATUSES,
  PROGRAM_SELF_SERVICE_STATUSES,
  MAX_FEATURED_PROGRAMS,
  programRejectSchema,
  programFeatureSchema,
} from "@shared/validations/programs.schema";

const amilValidationContextSchema = z.object({
  amilPlatformPercentage: z.number().min(0).max(100).optional(),
  amilMaxTotalPercentage: z.number().min(0).max(100).optional(),
});

function hasAtMostTwoDecimals(value: number) {
  return Math.abs(value * 100 - Math.round(value * 100)) < Number.EPSILON * 100;
}

/** Schema form frontend; backend tetap menghitung ulang batas amil dari DB. */
export const programSchema = sharedProgramSchema
  .and(amilValidationContextSchema)
  .superRefine((data, ctx) => {
    const institution = data.institutionPercentage;
    const defaultPlatform = data.amilPlatformPercentage;
    // Nilai platform yang diedit pengguna adalah satu-satunya sumber untuk
    // validasi total. Default hanya dipakai untuk mendeteksi adanya perubahan.
    const platform = data.requestedPlatformPercentage;
    const maximum = data.amilMaxTotalPercentage;

    if (institution !== undefined && !hasAtMostTwoDecimals(institution)) {
      ctx.addIssue({ code: "custom", path: ["institutionPercentage"], message: "Porsi lembaga maksimal 2 angka desimal" });
    }
    // Form edit tidak membawa konteks amil sehingga aturan dinamis dilewati.
    if (platform !== undefined && !hasAtMostTwoDecimals(platform)) {
      ctx.addIssue({ code: "custom", path: ["requestedPlatformPercentage"], message: "Porsi platform maksimal 2 angka desimal" });
    }
    if (
      platform !== undefined
      && defaultPlatform !== undefined
      && Math.abs(platform - defaultPlatform) > 1e-8
      && (!data.platformChangeReason || data.platformChangeReason.trim().length < 10)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["platformChangeReason"],
        message: "Alasan perubahan porsi amil platform minimal 10 karakter",
      });
    }
    if (institution === undefined || platform === undefined || maximum === undefined) return;

    const institutionMaximum = maximum - platform;
    if (institution > institutionMaximum) {
      ctx.addIssue({
        code: "custom",
        path: ["institutionPercentage"],
        message: `Porsi lembaga maksimal ${institutionMaximum.toFixed(2)}% karena porsi platform ${platform.toFixed(2)}%`,
      });
    }
    if (institution + platform > maximum) {
      ctx.addIssue({
        code: "custom",
        path: ["institutionPercentage"],
        message: `Total porsi amil tidak boleh melebihi ${maximum.toFixed(2)}%`,
      });
    }

  });

export type ProgramInput = z.infer<typeof programSchema>;
export type ProgramRejectInput = z.infer<typeof programRejectSchema>;
export type ProgramFeatureInput = z.infer<typeof programFeatureSchema>;

export {
  PROGRAM_CATEGORIES,
  PROGRAM_STATUSES,
  PROGRAM_SELF_SERVICE_STATUSES,
  MAX_FEATURED_PROGRAMS,
  programRejectSchema,
  programFeatureSchema,
};
