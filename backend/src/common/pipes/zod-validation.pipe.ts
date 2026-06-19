import { Injectable, PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * ZodValidationPipe — schema zod dari shared/validations (satu sumber
 * dengan frontend). ZodError dilempar apa adanya; AllExceptionsFilter
 * memetakannya ke 422 + zodError.flatten().
 *
 * Pakai per-route: `@Body(new ZodValidationPipe(loginSchema)) body: LoginInput`
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    return this.schema.parse(value);
  }
}
