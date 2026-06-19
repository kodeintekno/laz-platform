import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";

/**
 * Membungkus return value controller menjadi envelope sukses:
 * - { data, meta }  → { success: true, data, meta }   (list berpaginasi)
 * - lainnya         → { success: true, data }
 *
 * Prisma Decimal terserialisasi ke string oleh JSON.stringify (toJSON bawaan
 * decimal.js) — kontrak DTO di shared/types/api.ts.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (
          value &&
          typeof value === "object" &&
          "data" in value &&
          "meta" in value &&
          Object.keys(value).length === 2
        ) {
          const { data, meta } = value as { data: unknown; meta: unknown };
          return { success: true, data, meta };
        }
        return { success: true, data: value ?? null };
      }),
    );
  }
}
